package agent

import (
	"context"
	"fmt"
	"strings"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/bidtech-solutions/masterpro/backend/internal/models"
	"github.com/bidtech-solutions/masterpro/backend/internal/pkg/pagination"
)

type Repository interface {
	CreateWithUserTx(ctx context.Context, u *models.User, a *models.Agent) error
	List(ctx context.Context, f ListFilter, p pagination.Params) ([]models.Agent, int64, error)
	GetByID(ctx context.Context, id uuid.UUID) (*models.Agent, error)
	GetByUserID(ctx context.Context, userID uuid.UUID) (*models.Agent, error)
	GetListingCounts(ctx context.Context, agentIDs []uuid.UUID) (map[uuid.UUID]AgentListingCounts, error)
	Update(ctx context.Context, a *models.Agent, u *models.User) error
	UpdateAvatar(ctx context.Context, userID uuid.UUID, avatarKey string) error
	ListOptions(ctx context.Context, query string, status string) ([]AgentOptionResponse, error)
	IsEmailTaken(ctx context.Context, email string, excludeUserID *uuid.UUID) (bool, error)
}

type repository struct {
	db *gorm.DB
}

func NewRepository(db *gorm.DB) Repository {
	return &repository{db: db}
}

func (r *repository) CreateWithUserTx(ctx context.Context, u *models.User, a *models.Agent) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		// 1. Generate kode agen dari sequence agent_code_seq: "AG-" + lpad(4)
		var seqVal int64
		if err := tx.Raw("SELECT nextval('agent_code_seq')").Scan(&seqVal).Error; err != nil {
			return fmt.Errorf("nextval agent_code_seq: %w", err)
		}
		a.AgentCode = fmt.Sprintf("AG-%04d", seqVal)

		// 2. Simpan user
		if err := tx.Create(u).Error; err != nil {
			return fmt.Errorf("create user: %w", err)
		}

		// 3. Simpan agen
		a.UserID = u.ID
		if err := tx.Create(a).Error; err != nil {
			return fmt.Errorf("create agent: %w", err)
		}

		return nil
	})
}

func (r *repository) List(ctx context.Context, f ListFilter, p pagination.Params) ([]models.Agent, int64, error) {
	db := r.db.WithContext(ctx).Model(&models.Agent{}).Joins("JOIN users ON users.id = agents.user_id")

	if q := strings.TrimSpace(f.Query); q != "" {
		pattern := "%" + strings.ToLower(q) + "%"
		db = db.Where(
			"lower(users.name) LIKE ? OR lower(users.email) LIKE ? OR lower(agents.agent_code) LIKE ? OR agents.whatsapp_number LIKE ?",
			pattern, pattern, pattern, pattern,
		)
	}

	if st := strings.TrimSpace(f.Status); st != "" && st != "all" {
		db = db.Where("users.status = ?", st)
	}

	var total int64
	if err := db.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	orderClause := "agents.created_at DESC"
	switch f.Sort {
	case "name":
		orderClause = "users.name ASC"
	case "oldest":
		orderClause = "agents.created_at ASC"
	}

	var agents []models.Agent
	err := db.Preload("User").
		Order(orderClause).
		Offset(p.Offset()).
		Limit(p.PerPage).
		Find(&agents).Error

	return agents, total, err
}

func (r *repository) GetByID(ctx context.Context, id uuid.UUID) (*models.Agent, error) {
	var a models.Agent
	err := r.db.WithContext(ctx).Preload("User").Where("id = ?", id).First(&a).Error
	if err != nil {
		return nil, err
	}
	return &a, nil
}

func (r *repository) GetByUserID(ctx context.Context, userID uuid.UUID) (*models.Agent, error) {
	var a models.Agent
	err := r.db.WithContext(ctx).Preload("User").Where("user_id = ?", userID).First(&a).Error
	if err != nil {
		return nil, err
	}
	return &a, nil
}

func (r *repository) GetListingCounts(ctx context.Context, agentIDs []uuid.UUID) (map[uuid.UUID]AgentListingCounts, error) {
	result := make(map[uuid.UUID]AgentListingCounts, len(agentIDs))
	if len(agentIDs) == 0 {
		return result, nil
	}

	type statusRow struct {
		AgentID uuid.UUID
		Status  string
		Total   int
	}

	var rows []statusRow
	err := r.db.WithContext(ctx).
		Table("properties").
		Select("agent_id, status, count(*) as total").
		Where("agent_id IN ? AND deleted_at IS NULL", agentIDs).
		Group("agent_id, status").
		Scan(&rows).Error
	if err != nil {
		return nil, err
	}

	for _, id := range agentIDs {
		result[id] = AgentListingCounts{}
	}

	for _, r := range rows {
		counts := result[r.AgentID]
		counts.Total += r.Total
		switch r.Status {
		case "draft":
			counts.Draft = r.Total
		case "active":
			counts.Active = r.Total
		case "sold":
			counts.Sold = r.Total
		case "rented":
			counts.Rented = r.Total
		case "inactive":
			counts.Inactive = r.Total
		}
		result[r.AgentID] = counts
	}

	return result, nil
}

func (r *repository) Update(ctx context.Context, a *models.Agent, u *models.User) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if u != nil {
			if err := tx.Save(u).Error; err != nil {
				return err
			}
		}
		if a != nil {
			if err := tx.Save(a).Error; err != nil {
				return err
			}
		}
		return nil
	})
}

func (r *repository) UpdateAvatar(ctx context.Context, userID uuid.UUID, avatarKey string) error {
	return r.db.WithContext(ctx).
		Model(&models.User{}).
		Where("id = ?", userID).
		Update("avatar_key", avatarKey).Error
}

func (r *repository) ListOptions(ctx context.Context, query string, status string) ([]AgentOptionResponse, error) {
	db := r.db.WithContext(ctx).
		Table("agents").
		Select("agents.id, agents.agent_code, users.name, users.status").
		Joins("JOIN users ON users.id = agents.user_id")

	if q := strings.TrimSpace(query); q != "" {
		pattern := "%" + strings.ToLower(q) + "%"
		db = db.Where("lower(users.name) LIKE ? OR lower(agents.agent_code) LIKE ?", pattern, pattern)
	}

	if st := strings.TrimSpace(status); st != "" {
		db = db.Where("users.status = ?", st)
	} else {
		db = db.Where("users.status = 'active'")
	}

	var opts []AgentOptionResponse
	err := db.Order("users.name ASC").Scan(&opts).Error
	return opts, err
}

func (r *repository) IsEmailTaken(ctx context.Context, email string, excludeUserID *uuid.UUID) (bool, error) {
	db := r.db.WithContext(ctx).Model(&models.User{}).Where("lower(email) = lower(?)", strings.TrimSpace(email))
	if excludeUserID != nil {
		db = db.Where("id <> ?", *excludeUserID)
	}
	var count int64
	err := db.Count(&count).Error
	return count > 0, err
}

