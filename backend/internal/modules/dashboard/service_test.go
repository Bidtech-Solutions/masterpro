package dashboard

import (
	"context"
	"testing"

	"github.com/google/uuid"

	"github.com/bidtech-solutions/masterpro/backend/internal/http/middleware"
	"github.com/bidtech-solutions/masterpro/backend/internal/models"
)

type mockRepo struct {
	agentIDByUserIDFn   func(ctx context.Context, userID uuid.UUID) (*uuid.UUID, error)
	propertiesSummaryFn func(ctx context.Context, agentID *uuid.UUID) (PropertiesSummary, error)
	agentsSummaryFn     func(ctx context.Context) (AgentsSummary, error)
	totalsSummaryFn     func(ctx context.Context, agentID *uuid.UUID) (TotalsSummary, error)
	topViewedFn         func(ctx context.Context, agentID *uuid.UUID, limit int) ([]TopViewedProperty, error)
	recentlyUpdatedFn   func(ctx context.Context, agentID *uuid.UUID, limit int) ([]RecentProperty, error)
}

func (m *mockRepo) GetAgentIDByUserID(ctx context.Context, userID uuid.UUID) (*uuid.UUID, error) {
	if m.agentIDByUserIDFn != nil {
		return m.agentIDByUserIDFn(ctx, userID)
	}
	return nil, nil
}

func (m *mockRepo) GetPropertiesSummary(ctx context.Context, agentID *uuid.UUID) (PropertiesSummary, error) {
	if m.propertiesSummaryFn != nil {
		return m.propertiesSummaryFn(ctx, agentID)
	}
	return PropertiesSummary{Total: 124, Active: 88, Sold: 17, Rented: 5}, nil
}

func (m *mockRepo) GetAgentsSummary(ctx context.Context) (AgentsSummary, error) {
	if m.agentsSummaryFn != nil {
		return m.agentsSummaryFn(ctx)
	}
	return AgentsSummary{Total: 23, Active: 21}, nil
}

func (m *mockRepo) GetTotalsSummary(ctx context.Context, agentID *uuid.UUID) (TotalsSummary, error) {
	if m.totalsSummaryFn != nil {
		return m.totalsSummaryFn(ctx, agentID)
	}
	return TotalsSummary{ViewCount: 4200, WhatsappClickCount: 310}, nil
}

func (m *mockRepo) GetTopViewed(ctx context.Context, agentID *uuid.UUID, limit int) ([]TopViewedProperty, error) {
	if m.topViewedFn != nil {
		return m.topViewedFn(ctx, agentID, limit)
	}
	return []TopViewedProperty{
		{Code: "MP-300123", Title: "Rumah Minimalis Modern Batam Centre", ViewCount: 2450, WhatsappClickCount: 184},
	}, nil
}

func (m *mockRepo) GetRecentlyUpdated(ctx context.Context, agentID *uuid.UUID, limit int) ([]RecentProperty, error) {
	if m.recentlyUpdatedFn != nil {
		return m.recentlyUpdatedFn(ctx, agentID, limit)
	}
	return []RecentProperty{
		{Code: "MP-300123", Title: "Rumah Minimalis Modern Batam Centre", Status: "active"},
	}, nil
}

func TestGetSummary_Admin(t *testing.T) {
	repo := &mockRepo{}
	svc := NewService(repo)

	adminPrincipal := middleware.Principal{
		UserID: uuid.New(),
		Role:   models.RoleAdmin,
	}

	res, err := svc.GetSummary(context.Background(), adminPrincipal)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if res.Properties.Total != 124 {
		t.Errorf("expected total properties 124, got %d", res.Properties.Total)
	}
	if res.Agents == nil || res.Agents.Active != 21 {
		t.Errorf("expected active agents 21, got %v", res.Agents)
	}
	if len(res.TopViewed) != 1 {
		t.Errorf("expected 1 top viewed property, got %d", len(res.TopViewed))
	}
}

func TestGetSummary_Agent(t *testing.T) {
	agentID := uuid.New()
	repo := &mockRepo{
		agentIDByUserIDFn: func(ctx context.Context, userID uuid.UUID) (*uuid.UUID, error) {
			return &agentID, nil
		},
		propertiesSummaryFn: func(ctx context.Context, aID *uuid.UUID) (PropertiesSummary, error) {
			if aID == nil || *aID != agentID {
				t.Errorf("expected agentID to be passed")
			}
			return PropertiesSummary{Total: 32, Active: 28}, nil
		},
	}
	svc := NewService(repo)

	agentPrincipal := middleware.Principal{
		UserID: uuid.New(),
		Role:   models.RoleAgent,
	}

	res, err := svc.GetSummary(context.Background(), agentPrincipal)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if res.Agents != nil {
		t.Errorf("expected nil agents for agent role, got %v", res.Agents)
	}
	if res.Properties.Total != 32 {
		t.Errorf("expected 32 properties, got %d", res.Properties.Total)
	}
}
