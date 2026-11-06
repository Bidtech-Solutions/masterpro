package dashboard

import (
	"context"

	"github.com/google/uuid"

	"github.com/bidtech-solutions/masterpro/backend/internal/http/middleware"
)

// Repo interface abstraksi repository untuk service dashboard.
type Repo interface {
	GetAgentIDByUserID(ctx context.Context, userID uuid.UUID) (*uuid.UUID, error)
	GetPropertiesSummary(ctx context.Context, agentID *uuid.UUID) (PropertiesSummary, error)
	GetAgentsSummary(ctx context.Context) (AgentsSummary, error)
	GetTotalsSummary(ctx context.Context, agentID *uuid.UUID) (TotalsSummary, error)
	GetTopViewed(ctx context.Context, agentID *uuid.UUID, limit int) ([]TopViewedProperty, error)
	GetRecentlyUpdated(ctx context.Context, agentID *uuid.UUID, limit int) ([]RecentProperty, error)
}

type Service struct {
	repo Repo
}

func NewService(repo Repo) *Service {
	return &Service{repo: repo}
}

func (s *Service) GetSummary(ctx context.Context, principal middleware.Principal) (*DashboardSummaryResponse, error) {
	var agentID *uuid.UUID
	var agentsSummary *AgentsSummary

	if !principal.IsAdmin() {
		// Agen: hanya melihat data miliknya sendiri
		foundAgentID, err := s.repo.GetAgentIDByUserID(ctx, principal.UserID)
		if err != nil {
			return nil, err
		}
		if foundAgentID == nil {
			// Agen baru tanpa profil listing
			emptyID := uuid.Nil
			agentID = &emptyID
		} else {
			agentID = foundAgentID
		}
	} else {
		// Admin: melihat rekap agen kantor
		ag, err := s.repo.GetAgentsSummary(ctx)
		if err != nil {
			return nil, err
		}
		agentsSummary = &ag
	}

	propSummary, err := s.repo.GetPropertiesSummary(ctx, agentID)
	if err != nil {
		return nil, err
	}

	totals, err := s.repo.GetTotalsSummary(ctx, agentID)
	if err != nil {
		return nil, err
	}

	topViewed, err := s.repo.GetTopViewed(ctx, agentID, 5)
	if err != nil {
		return nil, err
	}

	recentlyUpdated, err := s.repo.GetRecentlyUpdated(ctx, agentID, 5)
	if err != nil {
		return nil, err
	}

	return &DashboardSummaryResponse{
		Properties:      propSummary,
		Agents:          agentsSummary,
		Totals:          totals,
		TopViewed:       topViewed,
		RecentlyUpdated: recentlyUpdated,
	}, nil
}
