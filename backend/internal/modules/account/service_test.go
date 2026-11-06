package account

import (
	"context"
	"testing"

	"github.com/google/uuid"

	"github.com/bidtech-solutions/masterpro/backend/internal/models"
	"github.com/bidtech-solutions/masterpro/backend/internal/pkg/security"
)

type fakeAccountRepo struct {
	user *models.User
}

func (f *fakeAccountRepo) GetByID(_ context.Context, id uuid.UUID) (*models.User, error) {
	if f.user != nil && f.user.ID == id {
		return f.user, nil
	}
	return nil, ErrNotFound
}

func (f *fakeAccountRepo) UpdateUserAndAgent(_ context.Context, u *models.User, ag *models.Agent) error {
	f.user = u
	if ag != nil {
		f.user.Agent = ag
	}
	return nil
}

func (f *fakeAccountRepo) UpdateAvatarKey(_ context.Context, _ uuid.UUID, key *string) error {
	if f.user != nil {
		f.user.AvatarKey = key
	}
	return nil
}

func (f *fakeAccountRepo) UpdatePasswordAndRevokeOthers(_ context.Context, _ uuid.UUID, hash string, _ uuid.UUID) error {
	if f.user != nil {
		f.user.PasswordHash = hash
	}
	return nil
}

func TestAccountService_ChangePasswordComplexity(t *testing.T) {
	oldHash, _ := security.HashPassword("OldPass123!")
	uid := uuid.New()
	repo := &fakeAccountRepo{
		user: &models.User{
			ID:           uid,
			Name:         "Budi",
			Email:        "budi@masterpro.co.id",
			PasswordHash: oldHash,
			Role:         models.RoleAgent,
			Status:       models.UserActive,
		},
	}
	svc := NewService(repo, nil, "http://media.localhost")
	ctx := context.Background()

	// 1. Weak password rejected
	err := svc.ChangePassword(ctx, uid, uuid.New(), ChangePasswordRequest{
		CurrentPassword:         "OldPass123!",
		NewPassword:             "TanpaSimbol123",
		NewPasswordConfirmation: "TanpaSimbol123",
	})
	if err == nil {
		t.Fatal("expected weak password to be rejected")
	}

	// 2. Strong password accepted
	err = svc.ChangePassword(ctx, uid, uuid.New(), ChangePasswordRequest{
		CurrentPassword:         "OldPass123!",
		NewPassword:             "NewSecurePass2026!",
		NewPasswordConfirmation: "NewSecurePass2026!",
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
}
