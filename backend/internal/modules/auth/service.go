package auth

import (
	"context"
	"errors"
	"net/http"
	"sync"
	"time"

	"github.com/google/uuid"

	"github.com/bidtech-solutions/masterpro/backend/internal/models"
	"github.com/bidtech-solutions/masterpro/backend/internal/pkg/apperror"
	"github.com/bidtech-solutions/masterpro/backend/internal/pkg/security"
)

// reuseGrace: token lama yang dipakai ulang dalam jendela ini dianggap balapan antar-tab
// (bukan pencurian) sehingga sesi tidak dicabut (API.md §8.2).
const reuseGrace = 30 * time.Second

// ClientMeta info klien yang disimpan bersama refresh token.
type ClientMeta struct {
	IP        string
	UserAgent string
}

// Session hasil login/refresh yang ditulis handler ke cookie.
type Session struct {
	AccessToken      string
	AccessExpiresAt  time.Time
	RefreshToken     string
	RefreshExpiresAt time.Time
}

// Service aturan bisnis autentikasi.
type Service interface {
	Login(ctx context.Context, email, password string, meta ClientMeta) (*Session, *models.User, error)
	Refresh(ctx context.Context, rawRefresh string, meta ClientMeta) (*Session, error)
	Logout(ctx context.Context, sessionID uuid.UUID) error
	Me(ctx context.Context, userID uuid.UUID) (*models.User, error)
}

// Errors khusus yang perlu dibedakan handler.
var (
	errInvalidCredentials = apperror.New(http.StatusUnauthorized, apperror.CodeInvalidCredentials, "Email atau password salah")
	errAccountInactive    = apperror.New(http.StatusForbidden, apperror.CodeAccountInactive, "Akun Anda dinonaktifkan, hubungi admin")
	errRefreshInvalid     = apperror.New(http.StatusUnauthorized, apperror.CodeRefreshInvalid, "Sesi tidak valid, silakan masuk kembali")
	// ErrRefreshRace: refresh token baru saja dirotasi oleh request lain — jangan hapus cookie.
	ErrRefreshRace = apperror.New(http.StatusUnauthorized, apperror.CodeRefreshInvalid, "Sesi sedang diperbarui, ulangi permintaan")
)

type service struct {
	repo       Repository
	tokens     *security.TokenIssuer
	refreshTTL time.Duration
	lockout    *lockout
	now        func() time.Time
	dummyHash  func() string
}

// NewService membuat service auth.
func NewService(repo Repository, tokens *security.TokenIssuer, refreshTTL time.Duration) Service {
	return &service{
		repo:       repo,
		tokens:     tokens,
		refreshTTL: refreshTTL,
		lockout:    newLockout(10, 15*time.Minute, 15*time.Minute),
		now:        func() time.Time { return time.Now().UTC() },
		dummyHash:  sync.OnceValue(func() string { h, _ := security.HashPassword("dummy-password-1"); return h }),
	}
}

func (s *service) Login(ctx context.Context, email, password string, meta ClientMeta) (*Session, *models.User, error) {
	if wait := s.lockout.lockedFor(email); wait > 0 {
		return nil, nil, apperror.RateLimited(int(wait.Seconds()) + 1)
	}
	u, err := s.repo.FindUserByEmail(ctx, email)
	if err != nil && !errors.Is(err, ErrNotFound) {
		return nil, nil, apperror.Internal(err)
	}
	if u == nil {
		security.CheckPassword(s.dummyHash(), password) // samakan waktu respons
		s.lockout.fail(email)
		return nil, nil, errInvalidCredentials
	}
	if !security.CheckPassword(u.PasswordHash, password) {
		s.lockout.fail(email)
		return nil, nil, errInvalidCredentials
	}
	if !u.IsActive() {
		return nil, nil, errAccountInactive
	}
	s.lockout.reset(email)

	sess, err := s.startSession(ctx, u, uuid.Must(uuid.NewV7()), nil, meta)
	if err != nil {
		return nil, nil, err
	}
	now := s.now()
	if err := s.repo.TouchLastLogin(ctx, u.ID, now); err != nil {
		return nil, nil, apperror.Internal(err)
	}
	u.LastLoginAt = &now
	return sess, u, nil
}

func (s *service) Refresh(ctx context.Context, rawRefresh string, meta ClientMeta) (*Session, error) {
	if rawRefresh == "" {
		return nil, errRefreshInvalid
	}
	old, err := s.repo.FindRefreshTokenByHash(ctx, security.HashToken(rawRefresh))
	if errors.Is(err, ErrNotFound) {
		return nil, errRefreshInvalid
	}
	if err != nil {
		return nil, apperror.Internal(err)
	}
	now := s.now()
	if old.RevokedAt != nil {
		if old.ReplacedBy != nil && now.Sub(*old.RevokedAt) <= reuseGrace {
			return nil, ErrRefreshRace
		}
		// Token yang sudah dirotasi dipakai lagi → kemungkinan dicuri: cabut seluruh sesi.
		if err := s.repo.RevokeFamily(ctx, old.FamilyID); err != nil {
			return nil, apperror.Internal(err)
		}
		return nil, errRefreshInvalid
	}
	if !now.Before(old.ExpiresAt) {
		return nil, errRefreshInvalid
	}
	u, err := s.repo.FindUserByID(ctx, old.UserID)
	if errors.Is(err, ErrNotFound) {
		return nil, errRefreshInvalid
	}
	if err != nil {
		return nil, apperror.Internal(err)
	}
	if !u.IsActive() {
		_ = s.repo.RevokeFamily(ctx, old.FamilyID)
		return nil, errAccountInactive
	}
	sess, err := s.startSession(ctx, u, old.FamilyID, &old.ID, meta)
	if errors.Is(err, ErrNotFound) {
		return nil, ErrRefreshRace
	}
	return sess, err
}

func (s *service) Logout(ctx context.Context, sessionID uuid.UUID) error {
	if err := s.repo.RevokeFamily(ctx, sessionID); err != nil {
		return apperror.Internal(err)
	}
	return nil
}

func (s *service) Me(ctx context.Context, userID uuid.UUID) (*models.User, error) {
	u, err := s.repo.FindUserByID(ctx, userID)
	if errors.Is(err, ErrNotFound) {
		return nil, apperror.Unauthenticated()
	}
	if err != nil {
		return nil, apperror.Internal(err)
	}
	return u, nil
}

// startSession membuat refresh token baru (rotasi bila rotateFrom != nil) dan access token.
func (s *service) startSession(ctx context.Context, u *models.User, familyID uuid.UUID, rotateFrom *uuid.UUID, meta ClientMeta) (*Session, error) {
	raw, err := security.RandomToken(32)
	if err != nil {
		return nil, apperror.Internal(err)
	}
	now := s.now()
	rt := &models.RefreshToken{
		ID:        uuid.Must(uuid.NewV7()),
		UserID:    u.ID,
		FamilyID:  familyID,
		TokenHash: security.HashToken(raw),
		ExpiresAt: now.Add(s.refreshTTL),
		CreatedAt: now,
	}
	if meta.UserAgent != "" {
		ua := meta.UserAgent
		if len(ua) > 255 {
			ua = ua[:255]
		}
		rt.UserAgent = &ua
	}
	if meta.IP != "" {
		rt.IPAddress = &meta.IP
	}
	if rotateFrom != nil {
		err = s.repo.RotateRefreshToken(ctx, *rotateFrom, rt)
	} else {
		err = s.repo.CreateRefreshToken(ctx, rt)
	}
	if errors.Is(err, ErrNotFound) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, apperror.Internal(err)
	}
	access, exp, err := s.tokens.Issue(u.ID.String(), string(u.Role), familyID.String())
	if err != nil {
		return nil, apperror.Internal(err)
	}
	return &Session{AccessToken: access, AccessExpiresAt: exp, RefreshToken: raw, RefreshExpiresAt: rt.ExpiresAt}, nil
}
