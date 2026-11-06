package user

import (
	"context"
	"testing"

	"github.com/google/uuid"

	"github.com/bidtech-solutions/masterpro/backend/internal/models"
	"github.com/bidtech-solutions/masterpro/backend/internal/pkg/apperror"
	"github.com/bidtech-solutions/masterpro/backend/internal/pkg/pagination"
)

type fakeUserRepo struct {
	users map[uuid.UUID]*models.User
}

func newFakeUserRepo() *fakeUserRepo {
	return &fakeUserRepo{users: make(map[uuid.UUID]*models.User)}
}

func (f *fakeUserRepo) List(_ context.Context, _ ListFilter, _ pagination.Params) ([]models.User, int64, error) {
	res := make([]models.User, 0, len(f.users))
	for _, u := range f.users {
		res = append(res, *u)
	}
	return res, int64(len(res)), nil
}

func (f *fakeUserRepo) GetByID(_ context.Context, id uuid.UUID) (*models.User, error) {
	u, ok := f.users[id]
	if !ok {
		return nil, ErrNotFound
	}
	return u, nil
}

func (f *fakeUserRepo) EmailExists(_ context.Context, email string, excludeID *uuid.UUID) (bool, error) {
	for id, u := range f.users {
		if excludeID != nil && id == *excludeID {
			continue
		}
		if u.Email == email {
			return true, nil
		}
	}
	return false, nil
}

func (f *fakeUserRepo) Create(_ context.Context, u *models.User) error {
	f.users[u.ID] = u
	return nil
}

func (f *fakeUserRepo) Update(_ context.Context, u *models.User) error {
	f.users[u.ID] = u
	return nil
}

func (f *fakeUserRepo) CountActiveAdmins(_ context.Context) (int64, error) {
	var c int64
	for _, u := range f.users {
		if u.Role == models.RoleAdmin && u.Status == models.UserActive {
			c++
		}
	}
	return c, nil
}

func (f *fakeUserRepo) RevokeAllUserSessions(_ context.Context, _ uuid.UUID) error {
	return nil
}

func TestUserService_CreateAndPasswordPolicy(t *testing.T) {
	repo := newFakeUserRepo()
	svc := NewService(repo, "http://media.localhost")
	ctx := context.Background()

	// 1. Weak password should fail
	_, err := svc.CreateAdmin(ctx, CreateUserRequest{
		Name:     "Admin Baru",
		Email:    "admin2@masterpro.co.id",
		Password: "weakpassword",
	})
	if err == nil {
		t.Fatal("expected error for weak password")
	}

	// 2. Strong password should succeed
	res, err := svc.CreateAdmin(ctx, CreateUserRequest{
		Name:     "Admin Baru",
		Email:    "admin2@masterpro.co.id",
		Password: "StrongPassword123!",
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if res.Role != models.RoleAdmin {
		t.Errorf("got role %s, want admin", res.Role)
	}

	// 3. Cannot deactivate self
	uid, _ := uuid.Parse(res.ID)
	_, err = svc.UpdateStatus(ctx, uid, uid, UpdateStatusRequest{Status: models.UserInactive})
	if !apperror.Is(err, apperror.CodeCannotDeactivateSelf) {
		t.Errorf("expected CANNOT_DEACTIVATE_SELF, got %v", err)
	}
}
