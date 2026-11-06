package user

import (
	"context"
	"errors"
	"strings"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/bidtech-solutions/masterpro/backend/internal/models"
	"github.com/bidtech-solutions/masterpro/backend/internal/pkg/pagination"
)

var ErrNotFound = errors.New("pengguna tidak ditemukan")

// Repository kontrak akses data pengguna.
type Repository interface {
	List(ctx context.Context, filter ListFilter, page pagination.Params) ([]models.User, int64, error)
	GetByID(ctx context.Context, id uuid.UUID) (*models.User, error)
	EmailExists(ctx context.Context, email string, excludeID *uuid.UUID) (bool, error)
	Create(ctx context.Context, u *models.User) error
	Update(ctx context.Context, u *models.User) error
	CountActiveAdmins(ctx context.Context) (int64, error)
	RevokeAllUserSessions(ctx context.Context, userID uuid.UUID) error
}

type gormRepository struct {
	db *gorm.DB
}

func NewRepository(db *gorm.DB) Repository {
	return &gormRepository{db: db}
}

func (r *gormRepository) List(ctx context.Context, filter ListFilter, page pagination.Params) ([]models.User, int64, error) {
	q := r.db.WithContext(ctx).Model(&models.User{}).Preload("Agent")

	if filter.Query != "" {
		like := "%" + strings.ToLower(strings.TrimSpace(filter.Query)) + "%"
		q = q.Where("LOWER(name) LIKE ? OR LOWER(email) LIKE ?", like, like)
	}
	if filter.Role != "" {
		q = q.Where("role = ?", filter.Role)
	}
	if filter.Status != "" {
		q = q.Where("status = ?", filter.Status)
	}

	var total int64
	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	switch filter.Sort {
	case "name":
		q = q.Order("name ASC")
	case "last_login":
		q = q.Order("last_login_at DESC NULLS LAST, created_at DESC")
	default:
		q = q.Order("created_at DESC")
	}

	var users []models.User
	if err := q.Offset(page.Offset()).Limit(page.PerPage).Find(&users).Error; err != nil {
		return nil, 0, err
	}
	return users, total, nil
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

func (r *gormRepository) EmailExists(ctx context.Context, email string, excludeID *uuid.UUID) (bool, error) {
	q := r.db.WithContext(ctx).Model(&models.User{}).Where("LOWER(email) = LOWER(?)", strings.TrimSpace(email))
	if excludeID != nil {
		q = q.Where("id <> ?", *excludeID)
	}
	var count int64
	if err := q.Count(&count).Error; err != nil {
		return false, err
	}
	return count > 0, nil
}

func (r *gormRepository) Create(ctx context.Context, u *models.User) error {
	return r.db.WithContext(ctx).Create(u).Error
}

func (r *gormRepository) Update(ctx context.Context, u *models.User) error {
	return r.db.WithContext(ctx).Save(u).Error
}

func (r *gormRepository) CountActiveAdmins(ctx context.Context) (int64, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&models.User{}).
		Where("role = ? AND status = ?", models.RoleAdmin, models.UserActive).
		Count(&count).Error
	return count, err
}

func (r *gormRepository) RevokeAllUserSessions(ctx context.Context, userID uuid.UUID) error {
	now := time.Now().UTC()
	return r.db.WithContext(ctx).Model(&models.RefreshToken{}).
		Where("user_id = ? AND revoked_at IS NULL", userID).
		Update("revoked_at", now).Error
}

