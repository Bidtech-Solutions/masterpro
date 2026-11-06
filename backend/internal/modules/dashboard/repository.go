package dashboard

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/bidtech-solutions/masterpro/backend/internal/models"
)

type Repository struct {
	db             *gorm.DB
	mediaPublicURL string
}

func NewRepository(db *gorm.DB, mediaPublicURL string) *Repository {
	return &Repository{db: db, mediaPublicURL: mediaPublicURL}
}

// GetAgentIDByUserID mencari Agent ID milik User ID (jika peran agen).
func (r *Repository) GetAgentIDByUserID(ctx context.Context, userID uuid.UUID) (*uuid.UUID, error) {
	var agent models.Agent
	err := r.db.WithContext(ctx).Select("id").Where("user_id = ?", userID).Take(&agent).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &agent.ID, nil
}

func (r *Repository) GetPropertiesSummary(ctx context.Context, agentID *uuid.UUID) (PropertiesSummary, error) {
	var summary PropertiesSummary
	q := r.db.WithContext(ctx).Table("properties").Where("deleted_at IS NULL")
	if agentID != nil {
		q = q.Where("agent_id = ?", *agentID)
	}

	row := q.Select(`
		COUNT(*) as total,
		COUNT(*) FILTER (WHERE status = 'draft') as draft,
		COUNT(*) FILTER (WHERE status = 'active') as active,
		COUNT(*) FILTER (WHERE status = 'sold') as sold,
		COUNT(*) FILTER (WHERE status = 'rented') as rented,
		COUNT(*) FILTER (WHERE status = 'inactive') as inactive
	`).Row()

	err := row.Scan(&summary.Total, &summary.Draft, &summary.Active, &summary.Sold, &summary.Rented, &summary.Inactive)
	return summary, err
}

func (r *Repository) GetAgentsSummary(ctx context.Context) (AgentsSummary, error) {
	var summary AgentsSummary
	row := r.db.WithContext(ctx).Table("agents").
		Joins("JOIN users ON users.id = agents.user_id").
		Select(`
			COUNT(*) as total,
			COUNT(*) FILTER (WHERE users.status = 'active') as active
		`).Row()

	err := row.Scan(&summary.Total, &summary.Active)
	return summary, err
}

func (r *Repository) GetTotalsSummary(ctx context.Context, agentID *uuid.UUID) (TotalsSummary, error) {
	var totals TotalsSummary
	q := r.db.WithContext(ctx).Table("properties").Where("deleted_at IS NULL")
	if agentID != nil {
		q = q.Where("agent_id = ?", *agentID)
	}

	row := q.Select(`
		COALESCE(SUM(view_count), 0) as view_count,
		COALESCE(SUM(whatsapp_click_count), 0) as whatsapp_click_count
	`).Row()

	err := row.Scan(&totals.ViewCount, &totals.WhatsappClickCount)
	return totals, err
}

func (r *Repository) GetTopViewed(ctx context.Context, agentID *uuid.UUID, limit int) ([]TopViewedProperty, error) {
	type rawTop struct {
		ID                 uuid.UUID
		Code               string
		Title              string
		PropertyType       string
		CityName           string
		District           *string
		ViewCount          int32
		WhatsappClickCount int32
		CoverKey           *string
	}

	var raws []rawTop
	q := r.db.WithContext(ctx).Table("properties p").
		Select(`
			p.id, p.code, p.title, pt.name_id as property_type, c.name as city_name, p.district,
			p.view_count, p.whatsapp_click_count, pi.object_key as cover_key
		`).
		Joins("JOIN property_types pt ON pt.id = p.property_type_id").
		Joins("JOIN cities c ON c.id = p.city_id").
		Joins("LEFT JOIN LATERAL (SELECT object_key FROM property_images WHERE property_id = p.id ORDER BY is_cover DESC, sort_order ASC, created_at ASC LIMIT 1) pi ON true").
		Where("p.deleted_at IS NULL")

	if agentID != nil {
		q = q.Where("p.agent_id = ?", *agentID)
	}

	err := q.Order("p.view_count DESC, p.whatsapp_click_count DESC, p.created_at DESC").
		Limit(limit).
		Scan(&raws).Error
	if err != nil {
		return nil, err
	}

	result := make([]TopViewedProperty, len(raws))
	for i, rItem := range raws {
		var imgURL *string
		if rItem.CoverKey != nil && *rItem.CoverKey != "" {
			url := fmt.Sprintf("%s/%s", r.mediaPublicURL, *rItem.CoverKey)
			imgURL = &url
		}
		result[i] = TopViewedProperty{
			ID:                 rItem.ID,
			Code:               rItem.Code,
			Title:              rItem.Title,
			PropertyType:       rItem.PropertyType,
			CityName:           rItem.CityName,
			District:           rItem.District,
			ViewCount:          rItem.ViewCount,
			WhatsappClickCount: rItem.WhatsappClickCount,
			CoverImageURL:      imgURL,
		}
	}
	return result, nil
}

func (r *Repository) GetRecentlyUpdated(ctx context.Context, agentID *uuid.UUID, limit int) ([]RecentProperty, error) {
	type rawRecent struct {
		ID        uuid.UUID
		Code      string
		Title     string
		Status    models.PropertyStatus
		UpdatedAt time.Time
	}

	var raws []rawRecent
	q := r.db.WithContext(ctx).Table("properties").
		Select("id, code, title, status, updated_at").
		Where("deleted_at IS NULL")

	if agentID != nil {
		q = q.Where("agent_id = ?", *agentID)
	}

	err := q.Order("updated_at DESC").Limit(limit).Scan(&raws).Error
	if err != nil {
		return nil, err
	}

	result := make([]RecentProperty, len(raws))
	for i, rItem := range raws {
		result[i] = RecentProperty{
			ID:        rItem.ID,
			Code:      rItem.Code,
			Title:     rItem.Title,
			Status:    string(rItem.Status),
			UpdatedAt: rItem.UpdatedAt.Format(time.RFC3339),
		}
	}
	return result, nil
}
