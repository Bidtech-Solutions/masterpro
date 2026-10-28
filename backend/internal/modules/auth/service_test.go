package auth

import (
	"context"
	"sync"
	"testing"
	"time"

	"github.com/google/uuid"

	"github.com/bidtech-solutions/masterpro/backend/internal/http/middleware"
	"github.com/bidtech-solutions/masterpro/backend/internal/models"
	"github.com/bidtech-solutions/masterpro/backend/internal/pkg/apperror"
	"github.com/bidtech-solutions/masterpro/backend/internal/pkg/security"
)

// fakeRepo implementasi Repository in-memory untuk unit test service.
type fakeRepo struct {
	mu     sync.Mutex
	users  map[uuid.UUID]*models.User
	tokens map[uuid.UUID]*models.RefreshToken
}

func newFakeRepo() *fakeRepo {
	return &fakeRepo{users: map[uuid.UUID]*models.User{}, tokens: map[uuid.UUID]*models.RefreshToken{}}
}

func (f *fakeRepo) addUser(t *testing.T, email, password string, status models.UserStatus) *models.User {
	t.Helper()
	h, err := security.HashPassword(password)
	if err != nil {
		t.Fatal(err)
	}
	u := &models.User{ID: uuid.New(), Name: "Uji", Email: email, PasswordHash: h, Role: models.RoleAdmin, Status: status}
	f.users[u.ID] = u
	return u
}

func (f *fakeRepo) FindUserByEmail(_ context.Context, email string) (*models.User, error) {
	for _, u := range f.users {
		if u.Email == email {
			return u, nil
		}
	}
	return nil, ErrNotFound
}

func (f *fakeRepo) FindUserByID(_ context.Context, id uuid.UUID) (*models.User, error) {
	if u, ok := f.users[id]; ok {
		return u, nil
	}
	return nil, ErrNotFound
}

func (f *fakeRepo) TouchLastLogin(context.Context, uuid.UUID, time.Time) error { return nil }

func (f *fakeRepo) CreateRefreshToken(_ context.Context, t *models.RefreshToken) error {
	f.mu.Lock()
	defer f.mu.Unlock()
	f.tokens[t.ID] = t
	return nil
}

func (f *fakeRepo) FindRefreshTokenByHash(_ context.Context, hash string) (*models.RefreshToken, error) {
	f.mu.Lock()
	defer f.mu.Unlock()
	for _, t := range f.tokens {
		if t.TokenHash == hash {
			c := *t
			return &c, nil
		}
	}
	return nil, ErrNotFound
}

func (f *fakeRepo) RotateRefreshToken(_ context.Context, oldID uuid.UUID, next *models.RefreshToken) error {
	f.mu.Lock()
	defer f.mu.Unlock()
	old := f.tokens[oldID]
	if old == nil || old.RevokedAt != nil {
		return ErrNotFound
	}
	at := next.CreatedAt
	old.RevokedAt, old.ReplacedBy = &at, &next.ID
	f.tokens[next.ID] = next
	return nil
}

func (f *fakeRepo) RevokeFamily(_ context.Context, family uuid.UUID) error {
	f.mu.Lock()
	defer f.mu.Unlock()
	now := time.Now()
	for _, t := range f.tokens {
		if t.FamilyID == family && t.RevokedAt == nil {
			t.RevokedAt = &now
		}
	}
	return nil
}

func (f *fakeRepo) ActiveSession(_ context.Context, userID, family uuid.UUID) (models.Role, models.UserStatus, error) {
	f.mu.Lock()
	defer f.mu.Unlock()
	for _, t := range f.tokens {
		if t.UserID == userID && t.FamilyID == family && t.RevokedAt == nil {
			u := f.users[userID]
			return u.Role, u.Status, nil
		}
	}
	return "", "", middleware.ErrSessionNotFound
}

func newTestService(t *testing.T) (*service, *fakeRepo) {
	t.Helper()
	repo := newFakeRepo()
	tokens, err := security.NewTokenIssuer("0123456789abcdef0123456789abcdef", 15*time.Minute)
	if err != nil {
		t.Fatal(err)
	}
	return NewService(repo, tokens, 7*24*time.Hour).(*service), repo
}

func TestLogin(t *testing.T) {
	svc, repo := newTestService(t)
	repo.addUser(t, "admin@masterpro.co.id", "Rahasia123", models.UserActive)
	repo.addUser(t, "off@masterpro.co.id", "Rahasia123", models.UserInactive)
	ctx := context.Background()

	sess, u, err := svc.Login(ctx, "admin@masterpro.co.id", "Rahasia123", ClientMeta{})
	if err != nil || sess.AccessToken == "" || sess.RefreshToken == "" || u.LastLoginAt == nil {
		t.Fatalf("login gagal: %v", err)
	}
	if _, _, err := svc.Login(ctx, "admin@masterpro.co.id", "salah123", ClientMeta{}); !apperror.Is(err, apperror.CodeInvalidCredentials) {
		t.Fatalf("password salah: ingin INVALID_CREDENTIALS, dapat %v", err)
	}
	if _, _, err := svc.Login(ctx, "tidakada@x.id", "Rahasia123", ClientMeta{}); !apperror.Is(err, apperror.CodeInvalidCredentials) {
		t.Fatalf("email tidak ada: ingin INVALID_CREDENTIALS, dapat %v", err)
	}
	if _, _, err := svc.Login(ctx, "off@masterpro.co.id", "Rahasia123", ClientMeta{}); !apperror.Is(err, apperror.CodeAccountInactive) {
		t.Fatalf("akun nonaktif: ingin ACCOUNT_INACTIVE, dapat %v", err)
	}
}

func TestLoginLockout(t *testing.T) {
	svc, repo := newTestService(t)
	repo.addUser(t, "a@x.id", "Rahasia123", models.UserActive)
	for range 10 {
		_, _, _ = svc.Login(context.Background(), "a@x.id", "salah", ClientMeta{})
	}
	if _, _, err := svc.Login(context.Background(), "a@x.id", "Rahasia123", ClientMeta{}); !apperror.Is(err, apperror.CodeRateLimited) {
		t.Fatalf("setelah 10 gagal harus terkunci, dapat %v", err)
	}
}

func TestRefreshRotationAndReuse(t *testing.T) {
	svc, repo := newTestService(t)
	repo.addUser(t, "a@x.id", "Rahasia123", models.UserActive)
	ctx := context.Background()
	first, _, err := svc.Login(ctx, "a@x.id", "Rahasia123", ClientMeta{})
	if err != nil {
		t.Fatal(err)
	}

	second, err := svc.Refresh(ctx, first.RefreshToken, ClientMeta{})
	if err != nil || second.RefreshToken == first.RefreshToken {
		t.Fatalf("rotasi gagal: %v", err)
	}

	// Pemakaian ulang dalam jendela grace → race, sesi tetap hidup.
	if _, err := svc.Refresh(ctx, first.RefreshToken, ClientMeta{}); err != ErrRefreshRace { //nolint:errorlint
		t.Fatalf("ingin ErrRefreshRace, dapat %v", err)
	}
	if _, err := svc.Refresh(ctx, second.RefreshToken, ClientMeta{}); err != nil {
		t.Fatalf("token terbaru harus tetap valid: %v", err)
	}

	// Pemakaian ulang di luar grace → seluruh family dicabut.
	svc.now = func() time.Time { return time.Now().UTC().Add(time.Hour) }
	if _, err := svc.Refresh(ctx, first.RefreshToken, ClientMeta{}); !apperror.Is(err, apperror.CodeRefreshInvalid) {
		t.Fatalf("reuse harus REFRESH_INVALID, dapat %v", err)
	}
	for _, tok := range repo.tokens {
		if tok.RevokedAt == nil {
			t.Fatal("semua token family harus dicabut setelah reuse")
		}
	}
}

func TestRefreshExpiredAndLogout(t *testing.T) {
	svc, repo := newTestService(t)
	u := repo.addUser(t, "a@x.id", "Rahasia123", models.UserActive)
	ctx := context.Background()
	sess, _, _ := svc.Login(ctx, "a@x.id", "Rahasia123", ClientMeta{})

	claims, _ := svc.tokens.Parse(sess.AccessToken)
	sid := uuid.MustParse(claims.SID)
	if _, _, err := repo.ActiveSession(ctx, u.ID, sid); err != nil {
		t.Fatalf("sesi harus aktif: %v", err)
	}
	if err := svc.Logout(ctx, sid); err != nil {
		t.Fatal(err)
	}
	if _, _, err := repo.ActiveSession(ctx, u.ID, sid); err == nil {
		t.Fatal("sesi harus dicabut setelah logout")
	}

	sess2, _, _ := svc.Login(ctx, "a@x.id", "Rahasia123", ClientMeta{})
	svc.now = func() time.Time { return time.Now().UTC().Add(8 * 24 * time.Hour) }
	if _, err := svc.Refresh(ctx, sess2.RefreshToken, ClientMeta{}); !apperror.Is(err, apperror.CodeRefreshInvalid) {
		t.Fatalf("refresh kedaluwarsa harus REFRESH_INVALID, dapat %v", err)
	}
}
