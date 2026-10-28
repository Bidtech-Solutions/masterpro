package auth

import (
	"context"
	"errors"
	"strings"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/bidtech-solutions/masterpro/backend/internal/http/middleware"
	"github.com/bidtech-solutions/masterpro/backend/internal/models"
)

// ErrNotFound dikembalikan repository bila data tidak ada.
var ErrNotFound = errors.New("not found")

// Repository akses data modul auth.
type Repository interface {
	middleware.SessionChecker
	FindUserByEmail(ctx context.Context, email string) (*models.User, error)
	FindUserByID(ctx context.Context, id uuid.UUID) (*models.User, error)
	TouchLastLogin(ctx context.Context, userID uuid.UUID, at time.Time) error
	CreateRefreshToken(ctx context.Context, t *models.RefreshToken) error
	FindRefreshTokenByHash(ctx context.Context, hash string) (*models.RefreshToken, error)
	// RotateRefreshToken mencabut token lama (mengisi replaced_by) dan menyimpan token baru secara atomik.
	// Mengembalikan ErrNotFound bila token lama sudah dicabut oleh request lain.
	RotateRefreshToken(ctx context.Context, oldID uuid.UUID, next *models.RefreshToken) error
	RevokeFamily(ctx context.Context, familyID uuid.UUID) error
}

type gormRepository struct{ db *gorm.DB }

// NewRepository membuat repository GORM.
func NewRepository(db *gorm.DB) Repository { return &gormRepository{db: db} }

func (r *gormRepository) FindUserByEmail(ctx context.Context, email string) (*models.User, error) {
	var u models.User
	err := r.db.WithContext(ctx).Preload("Agent").
		Where("lower(email) = ?", strings.ToLower(strings.TrimSpace(email))).
		Take(&u).Error
	return notFound(&u, err)
}

func (r *gormRepository) FindUserByID(ctx context.Context, id uuid.UUID) (*models.User, error) {
	var u models.User
	err := r.db.WithContext(ctx).Preload("Agent").Where("id = ?", id).Take(&u).Error
	return notFound(&u, err)
}

func (r *gormRepository) TouchLastLogin(ctx context.Context, userID uuid.UUID, at time.Time) error {
	return r.db.WithContext(ctx).Model(&models.User{}).Where("id = ?", userID).
		UpdateColumn("last_login_at", at).Error
}

func (r *gormRepository) CreateRefreshToken(ctx context.Context, t *models.RefreshToken) error {
	return r.db.WithContext(ctx).Create(t).Error
}

func (r *gormRepository) FindRefreshTokenByHash(ctx context.Context, hash string) (*models.RefreshToken, error) {
	var t models.RefreshToken
	err := r.db.WithContext(ctx).Where("token_hash = ?", hash).Take(&t).Error
	return notFound(&t, err)
}

func (r *gormRepository) RotateRefreshToken(ctx context.Context, oldID uuid.UUID, next *models.RefreshToken) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(next).Error; err != nil {
			return err
		}
		res := tx.Model(&models.RefreshToken{}).
			Where("id = ? AND revoked_at IS NULL", oldID).
			Updates(map[string]any{"revoked_at": next.CreatedAt, "replaced_by": next.ID})
		if res.Error != nil {
			return res.Error
		}
		if res.RowsAffected == 0 {
			return ErrNotFound // kalah balapan dengan request refresh lain → batalkan token baru
		}
		return nil
	})
}

func (r *gormRepository) RevokeFamily(ctx context.Context, familyID uuid.UUID) error {
	return r.db.WithContext(ctx).Model(&models.RefreshToken{}).
		Where("family_id = ? AND revoked_at IS NULL", familyID).
		UpdateColumn("revoked_at", time.Now().UTC()).Error
}

// ActiveSession dipakai middleware.Auth di setiap request terautentikasi.
func (r *gormRepository) ActiveSession(ctx context.Context, userID, sessionID uuid.UUID) (models.Role, models.UserStatus, error) {
	var row struct {
		Role   models.Role
		Status models.UserStatus
	}
	err := r.db.WithContext(ctx).Raw(`
		SELECT u.role, u.status FROM users u
		WHERE u.id = ? AND EXISTS (
			SELECT 1 FROM refresh_tokens rt
			WHERE rt.user_id = u.id AND rt.family_id = ? AND rt.revoked_at IS NULL AND rt.expires_at > now())`,
		userID, sessionID).Scan(&row).Error
	if err != nil {
		return "", "", err
	}
	if row.Role == "" {
		return "", "", middleware.ErrSessionNotFound
	}
	return row.Role, row.Status, nil
}

func notFound[T any](v *T, err error) (*T, error) {
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return v, nil
}
