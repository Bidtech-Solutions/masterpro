package account

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/bidtech-solutions/masterpro/backend/internal/models"
)

var ErrNotFound = errors.New("akun tidak ditemukan")

// Repository kontrak akses data untuk modul account.
type Repository interface {
	GetByID(ctx context.Context, id uuid.UUID) (*models.User, error)
	UpdateUserAndAgent(ctx context.Context, u *models.User, ag *models.Agent) error
	UpdateAvatarKey(ctx context.Context, userID uuid.UUID, key *string) error
	UpdatePasswordAndRevokeOthers(ctx context.Context, userID uuid.UUID, hash string, currentSessionID uuid.UUID) error
}

type gormRepository struct {
	db *gorm.DB
}

func NewRepository(db *gorm.DB) Repository {
	return &gormRepository{db: db}
}

func (r *gormRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.User, error) {
	var u models.User
	err := r.db.WithContext(ctx).Preload("Agent").First(&u, "id = ?", id).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return &u, nil
}

func (r *gormRepository) UpdateUserAndAgent(ctx context.Context, u *models.User, ag *models.Agent) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Save(u).Error; err != nil {
			return err
		}
		if ag != nil {
			if err := tx.Save(ag).Error; err != nil {
				return err
			}
		}
		return nil
	})
}

func (r *gormRepository) UpdateAvatarKey(ctx context.Context, userID uuid.UUID, key *string) error {
	return r.db.WithContext(ctx).Model(&models.User{}).
		Where("id = ?", userID).
		Updates(map[string]any{
			"avatar_key": key,
			"updated_at": time.Now().UTC(),
		}).Error
}

func (r *gormRepository) UpdatePasswordAndRevokeOthers(ctx context.Context, userID uuid.UUID, hash string, currentSessionID uuid.UUID) error {
	now := time.Now().UTC()
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Model(&models.User{}).Where("id = ?", userID).Updates(map[string]any{
			"password_hash":       hash,
			"password_changed_at": now,
			"updated_at":          now,
		}).Error; err != nil {
			return err
		}
		// Cabut semua sesi lain milik pengguna kecuali sesi saat ini
		return tx.Model(&models.RefreshToken{}).
			Where("user_id = ? AND family_id <> ? AND revoked_at IS NULL", userID, currentSessionID).
			Update("revoked_at", now).Error
	})
}

