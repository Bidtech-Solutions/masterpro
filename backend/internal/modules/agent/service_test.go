package agent

import (
	"context"
	"strings"
	"testing"
	"time"

	"github.com/google/uuid"

	"github.com/bidtech-solutions/masterpro/backend/internal/models"
	"github.com/bidtech-solutions/masterpro/backend/internal/pkg/pagination"
)

type mockRepo struct {
	createWithUserTxFn func(ctx context.Context, u *models.User, a *models.Agent) error
	listFn             func(ctx context.Context, f ListFilter, p pagination.Params) ([]models.Agent, int64, error)
	getByIDFn          func(ctx context.Context, id uuid.UUID) (*models.Agent, error)
	getByUserIDFn      func(ctx context.Context, userID uuid.UUID) (*models.Agent, error)
	getListingCountsFn func(ctx context.Context, agentIDs []uuid.UUID) (map[uuid.UUID]AgentListingCounts, error)
	updateFn           func(ctx context.Context, a *models.Agent, u *models.User) error
	updateAvatarFn     func(ctx context.Context, userID uuid.UUID, avatarKey string) error
	listOptionsFn      func(ctx context.Context, query string, status string) ([]AgentOptionResponse, error)
	isEmailTakenFn     func(ctx context.Context, email string, excludeUserID *uuid.UUID) (bool, error)
}

func (m *mockRepo) CreateWithUserTx(ctx context.Context, u *models.User, a *models.Agent) error {
	a.AgentCode = "AG-0001"
	if m.createWithUserTxFn != nil {
		return m.createWithUserTxFn(ctx, u, a)
	}
	return nil
}

func (m *mockRepo) List(ctx context.Context, f ListFilter, p pagination.Params) ([]models.Agent, int64, error) {
	if m.listFn != nil {
		return m.listFn(ctx, f, p)
	}
	return nil, 0, nil
}

func (m *mockRepo) GetByID(ctx context.Context, id uuid.UUID) (*models.Agent, error) {
	if m.getByIDFn != nil {
		return m.getByIDFn(ctx, id)
	}
	return nil, nil
}

func (m *mockRepo) GetByUserID(ctx context.Context, userID uuid.UUID) (*models.Agent, error) {
	if m.getByUserIDFn != nil {
		return m.getByUserIDFn(ctx, userID)
	}
	return nil, nil
}

func (m *mockRepo) GetListingCounts(ctx context.Context, agentIDs []uuid.UUID) (map[uuid.UUID]AgentListingCounts, error) {
	if m.getListingCountsFn != nil {
		return m.getListingCountsFn(ctx, agentIDs)
	}
	return make(map[uuid.UUID]AgentListingCounts), nil
}

func (m *mockRepo) Update(ctx context.Context, a *models.Agent, u *models.User) error {
	if m.updateFn != nil {
		return m.updateFn(ctx, a, u)
	}
	return nil
}

func (m *mockRepo) UpdateAvatar(ctx context.Context, userID uuid.UUID, avatarKey string) error {
	if m.updateAvatarFn != nil {
		return m.updateAvatarFn(ctx, userID, avatarKey)
	}
	return nil
}

func (m *mockRepo) ListOptions(ctx context.Context, query string, status string) ([]AgentOptionResponse, error) {
	if m.listOptionsFn != nil {
		return m.listOptionsFn(ctx, query, status)
	}
	return nil, nil
}

func (m *mockRepo) IsEmailTaken(ctx context.Context, email string, excludeUserID *uuid.UUID) (bool, error) {
	if m.isEmailTakenFn != nil {
		return m.isEmailTakenFn(ctx, email, excludeUserID)
	}
	return false, nil
}

func TestAgentService_Create_Success(t *testing.T) {
	repo := &mockRepo{
		isEmailTakenFn: func(ctx context.Context, email string, excludeUserID *uuid.UUID) (bool, error) {
			return false, nil
		},
		createWithUserTxFn: func(ctx context.Context, u *models.User, a *models.Agent) error {
			return nil
		},
	}
	svc := NewService(repo, nil, "http://media.localhost")

	req := CreateAgentRequest{
		Name:           "Hendra Wijaya",
		Email:          "hendra.wijaya@masterpro.co.id",
		Password:       "MasterPro2026!",
		WhatsappNumber: "081270008899",
	}

	res, err := svc.Create(context.Background(), req)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if res.User.Name != "Hendra Wijaya" {
		t.Errorf("expected Hendra Wijaya, got %s", res.User.Name)
	}
	if res.WhatsappNumber != "6281270008899" {
		t.Errorf("expected 6281270008899, got %s", res.WhatsappNumber)
	}
	if res.AgentCode != "AG-0001" {
		t.Errorf("expected AG-0001, got %s", res.AgentCode)
	}
}

func TestAgentService_Create_DuplicateEmail(t *testing.T) {
	repo := &mockRepo{
		isEmailTakenFn: func(ctx context.Context, email string, excludeUserID *uuid.UUID) (bool, error) {
			return true, nil
		},
	}
	svc := NewService(repo, nil, "http://media.localhost")

	req := CreateAgentRequest{
		Name:           "Budi Santoso",
		Email:          "budi@masterpro.co.id",
		Password:       "MasterPro2026!",
		WhatsappNumber: "081270008899",
	}

	res, err := svc.Create(context.Background(), req)
	if err == nil {
		t.Fatal("expected error for duplicate email, got nil")
	}
	if res != nil {
		t.Errorf("expected nil result, got %v", res)
	}
	if !strings.Contains(err.Error(), "sudah digunakan") {
		t.Errorf("expected error message to contain 'sudah digunakan', got %s", err.Error())
	}
}

func TestAgentService_Create_InvalidWhatsApp(t *testing.T) {
	repo := &mockRepo{
		isEmailTakenFn: func(ctx context.Context, email string, excludeUserID *uuid.UUID) (bool, error) {
			return false, nil
		},
	}
	svc := NewService(repo, nil, "http://media.localhost")

	req := CreateAgentRequest{
		Name:           "Budi Santoso",
		Email:          "budi@masterpro.co.id",
		Password:       "MasterPro2026!",
		WhatsappNumber: "1234", // Kurang digit
	}

	res, err := svc.Create(context.Background(), req)
	if err == nil {
		t.Fatal("expected validation error for invalid whatsapp, got nil")
	}
	if res != nil {
		t.Errorf("expected nil result, got %v", res)
	}
}

func TestAgentService_GetByID_Success(t *testing.T) {
	agentID := uuid.New()
	userID := uuid.New()
	now := time.Now().UTC()

	mockAgent := &models.Agent{
		ID:             agentID,
		UserID:         userID,
		AgentCode:      "AG-0007",
		WhatsappNumber: "6281234567890",
		CreatedAt:      now,
		UpdatedAt:      now,
		User: &models.User{
			ID:     userID,
			Name:   "Budi Santoso",
			Email:  "budi@masterpro.co.id",
			Status: models.UserActive,
		},
	}

	repo := &mockRepo{
		getByIDFn: func(ctx context.Context, id uuid.UUID) (*models.Agent, error) {
			return mockAgent, nil
		},
		getListingCountsFn: func(ctx context.Context, agentIDs []uuid.UUID) (map[uuid.UUID]AgentListingCounts, error) {
			return map[uuid.UUID]AgentListingCounts{
				agentID: {Total: 10, Active: 8, Draft: 2},
			}, nil
		},
	}
	svc := NewService(repo, nil, "http://media.localhost")

	res, err := svc.GetByID(context.Background(), agentID)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if res.AgentCode != "AG-0007" {
		t.Errorf("expected AG-0007, got %s", res.AgentCode)
	}
	if res.ListingCounts.Total != 10 {
		t.Errorf("expected 10 total listings, got %d", res.ListingCounts.Total)
	}
}
