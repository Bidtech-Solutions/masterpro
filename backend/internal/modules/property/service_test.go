package property

import (
	"context"
	"errors"
	"net/http"
	"testing"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/bidtech-solutions/masterpro/backend/internal/http/middleware"
	"github.com/bidtech-solutions/masterpro/backend/internal/models"
	"github.com/bidtech-solutions/masterpro/backend/internal/pkg/apperror"
	"github.com/bidtech-solutions/masterpro/backend/internal/pkg/pagination"
)

type mockRepo struct {
	properties map[uuid.UUID]*models.Property
	agentMap   map[uuid.UUID]uuid.UUID // userID -> agentID
	types      map[int16]*models.PropertyType
}

func newMockRepo() *mockRepo {
	return &mockRepo{
		properties: make(map[uuid.UUID]*models.Property),
		agentMap:   make(map[uuid.UUID]uuid.UUID),
		types: map[int16]*models.PropertyType{
			1: {ID: 1, Slug: "rumah", NameID: "Rumah", NameEN: "House", AllowSale: true, AllowRent: true},
			2: {ID: 2, Slug: "apartemen", NameID: "Apartemen", NameEN: "Apartment", AllowSale: true, AllowRent: true},
			3: {ID: 3, Slug: "tanah", NameID: "Tanah", NameEN: "Land", AllowSale: true, AllowRent: false},
		},
	}
}

func (m *mockRepo) ListPublic(_ context.Context, _ PublicListQuery, _ pagination.Params) ([]Card, int64, error) {
	return nil, 0, nil
}
func (m *mockRepo) GetPublicBySlug(_ context.Context, _ string) (*Detail, error) {
	return nil, nil
}
func (m *mockRepo) ListSimilar(_ context.Context, _ string, _ int) ([]Card, error) {
	return nil, nil
}
func (m *mockRepo) IncrementPublicCounter(_ context.Context, slug string, eventType string) error {
	for _, p := range m.properties {
		if p.Slug == slug && p.Status == models.StatusActive && !p.DeletedAt.Valid {
			if eventType == "whatsapp_click" {
				p.WhatsappClickCount++
			} else {
				p.ViewCount++
			}
			return nil
		}
	}
	return gorm.ErrRecordNotFound
}

func (m *mockRepo) GetAgentIDByUserID(_ context.Context, userID uuid.UUID) (*uuid.UUID, error) {
	if aid, ok := m.agentMap[userID]; ok {
		return &aid, nil
	}
	return nil, nil
}

func (m *mockRepo) GetFirstActiveAgentID(_ context.Context) (*uuid.UUID, error) {
	aid := uuid.New()
	return &aid, nil
}

func (m *mockRepo) ListDashboard(_ context.Context, agentID *uuid.UUID, _ DashboardListQuery, _ pagination.Params) ([]DashboardPropertyItem, int64, error) {
	var items []DashboardPropertyItem
	for _, p := range m.properties {
		if agentID != nil && p.AgentID != *agentID {
			continue
		}
		items = append(items, DashboardPropertyItem{
			ID:     p.ID.String(),
			Title:  p.Title,
			Status: p.Status,
		})
	}
	return items, int64(len(items)), nil
}

func (m *mockRepo) GetByID(_ context.Context, id uuid.UUID, agentID *uuid.UUID) (*models.Property, error) {
	p, ok := m.properties[id]
	if !ok || (p.DeletedAt.Valid) {
		return nil, gorm.ErrRecordNotFound
	}
	if agentID != nil && p.AgentID != *agentID {
		return nil, gorm.ErrRecordNotFound
	}
	return p, nil
}

func (m *mockRepo) Create(_ context.Context, prop *models.Property, _ []int16) error {
	m.properties[prop.ID] = prop
	return nil
}

func (m *mockRepo) Update(_ context.Context, prop *models.Property, _ *[]int16, _ *uuid.UUID) error {
	m.properties[prop.ID] = prop
	return nil
}

func (m *mockRepo) UpdateStatus(_ context.Context, id uuid.UUID, status models.PropertyStatus, _ uuid.UUID, _ *uuid.UUID) error {
	if p, ok := m.properties[id]; ok {
		p.Status = status
		return nil
	}
	return gorm.ErrRecordNotFound
}

func (m *mockRepo) SoftDelete(_ context.Context, id uuid.UUID, _ uuid.UUID) error {
	if p, ok := m.properties[id]; ok {
		p.DeletedAt = gorm.DeletedAt{Time: time.Now().UTC(), Valid: true}
		return nil
	}
	return gorm.ErrRecordNotFound
}

func (m *mockRepo) AddImages(_ context.Context, propertyID uuid.UUID, images []models.PropertyImage, _ *uuid.UUID) error {
	if p, ok := m.properties[propertyID]; ok {
		p.Images = append(p.Images, images...)
		return nil
	}
	return gorm.ErrRecordNotFound
}

func (m *mockRepo) ReorderImages(_ context.Context, _ uuid.UUID, _ []uuid.UUID, _ uuid.UUID, _ *uuid.UUID) error {
	return nil
}

func (m *mockRepo) DeleteImage(_ context.Context, _ uuid.UUID, _ uuid.UUID, _ *uuid.UUID) (string, error) {
	return "test-key", nil
}

func (m *mockRepo) CountImages(_ context.Context, propertyID uuid.UUID) (int64, error) {
	if p, ok := m.properties[propertyID]; ok {
		return int64(len(p.Images)), nil
	}
	return 0, nil
}

func (m *mockRepo) GetPropertyType(_ context.Context, id int16) (*models.PropertyType, error) {
	if pt, ok := m.types[id]; ok {
		return pt, nil
	}
	return nil, gorm.ErrRecordNotFound
}

func (m *mockRepo) CheckCityInProvince(_ context.Context, _ int32, _ int16) (bool, error) {
	return true, nil
}

func TestUpdateStatus_PublishValidation(t *testing.T) {
	repo := newMockRepo()
	svc := NewService(repo, nil, nil, "https://media.test", "https://masterpro.test")

	adminPrincipal := middleware.Principal{
		UserID: uuid.New(),
		Role:   models.RoleAdmin,
	}

	propID := uuid.New()
	agentID := uuid.New()
	repo.properties[propID] = &models.Property{
		ID:          propID,
		AgentID:     agentID,
		Status:      models.StatusDraft,
		Title:       "Rumah Keren",
		Description: "Rumah contoh yang sangat luas dan nyaman di Batam Centre.",
		ListingType: models.ListingSale,
		PropertyType: &models.PropertyType{
			ID:   1,
			Slug: "rumah",
		},
		Images: []models.PropertyImage{}, // Empty images!
	}

	// 1. Trying to publish without images or complete details should fail
	_, err := svc.UpdateStatus(context.Background(), adminPrincipal, propID, models.StatusActive)
	if err == nil {
		t.Fatal("expected publish validation error, got nil")
	}

	var appErr *apperror.Error
	if !errors.As(err, &appErr) {
		t.Fatalf("expected apperror.Error, got %T", err)
	}
	if appErr.Status != http.StatusUnprocessableEntity || appErr.Code != "PUBLISH_REQUIREMENTS_NOT_MET" {
		t.Errorf("unexpected error code: %s (%d)", appErr.Code, appErr.Status)
	}

	// 2. Now fill required fields and photo
	addr := "Jl. Sudirman No 1"
	district := "Batam Kota"
	shm := models.CertSHM
	land := 120.0
	building := 100.0

	repo.properties[propID].Address = &addr
	repo.properties[propID].District = &district
	repo.properties[propID].Certificate = &shm
	repo.properties[propID].LandArea = &land
	repo.properties[propID].BuildingArea = &building
	repo.properties[propID].Images = []models.PropertyImage{
		{ID: uuid.New(), PropertyID: propID, ObjectKey: "img1.webp", IsCover: true},
	}

	// Now publish should succeed
	updated, err := svc.UpdateStatus(context.Background(), adminPrincipal, propID, models.StatusActive)
	if err != nil {
		t.Fatalf("unexpected error publishing valid property: %v", err)
	}
	if updated.Status != models.StatusActive {
		t.Errorf("expected status 'active', got '%s'", updated.Status)
	}
}

func TestUpdateStatus_InvalidTransition(t *testing.T) {
	repo := newMockRepo()
	svc := NewService(repo, nil, nil, "https://media.test", "https://masterpro.test")

	adminPrincipal := middleware.Principal{
		UserID: uuid.New(),
		Role:   models.RoleAdmin,
	}

	propID := uuid.New()
	repo.properties[propID] = &models.Property{
		ID:      propID,
		Status:  models.StatusDraft,
		Title:   "Draf Listing",
		AgentID: uuid.New(),
	}

	// Direct transition from draft to sold is forbidden
	_, err := svc.UpdateStatus(context.Background(), adminPrincipal, propID, models.StatusSold)
	if err == nil {
		t.Fatal("expected conflict on invalid status transition, got nil")
	}

	var appErr *apperror.Error
	if !errors.As(err, &appErr) {
		t.Fatalf("expected apperror.Error, got %T", err)
	}
	if appErr.Status != http.StatusConflict || appErr.Code != "INVALID_STATUS_TRANSITION" {
		t.Errorf("unexpected error code: %s (%d)", appErr.Code, appErr.Status)
	}
}

func TestUpdateStatus_ListingTypeMismatch(t *testing.T) {
	repo := newMockRepo()
	svc := NewService(repo, nil, nil, "https://media.test", "https://masterpro.test")

	adminPrincipal := middleware.Principal{
		UserID: uuid.New(),
		Role:   models.RoleAdmin,
	}

	// 1. Sale property cannot become rented
	salePropID := uuid.New()
	repo.properties[salePropID] = &models.Property{
		ID:          salePropID,
		Status:      models.StatusActive,
		ListingType: models.ListingSale,
		Title:       "Rumah Dijual",
		AgentID:     uuid.New(),
	}

	_, err := svc.UpdateStatus(context.Background(), adminPrincipal, salePropID, models.StatusRented)
	if err == nil {
		t.Fatal("expected error when setting rented on sale property, got nil")
	}
	var appErr *apperror.Error
	if !errors.As(err, &appErr) {
		t.Fatalf("expected apperror.Error, got %T", err)
	}
	if appErr.Status != http.StatusUnprocessableEntity || appErr.Code != "INVALID_LISTING_TYPE_STATUS" {
		t.Errorf("unexpected error code/status: %s (%d)", appErr.Code, appErr.Status)
	}

	// 2. Rent property cannot become sold
	rentPropID := uuid.New()
	repo.properties[rentPropID] = &models.Property{
		ID:          rentPropID,
		Status:      models.StatusActive,
		ListingType: models.ListingRent,
		Title:       "Apartemen Disewa",
		AgentID:     uuid.New(),
	}

	_, err = svc.UpdateStatus(context.Background(), adminPrincipal, rentPropID, models.StatusSold)
	if err == nil {
		t.Fatal("expected error when setting sold on rent property, got nil")
	}
	if !errors.As(err, &appErr) {
		t.Fatalf("expected apperror.Error, got %T", err)
	}
	if appErr.Status != http.StatusUnprocessableEntity || appErr.Code != "INVALID_LISTING_TYPE_STATUS" {
		t.Errorf("unexpected error code/status: %s (%d)", appErr.Code, appErr.Status)
	}
}

func TestCreate_TypeRestrictions(t *testing.T) {
	repo := newMockRepo()
	svc := NewService(repo, nil, nil, "https://media.test", "https://masterpro.test")

	adminPrincipal := middleware.Principal{
		UserID: uuid.New(),
		Role:   models.RoleAdmin,
	}

	agentIDStr := uuid.New().String()

	// Type 3 = Tanah, AllowRent: false
	req := CreatePropertyRequest{
		AgentID:        &agentIDStr,
		ListingType:    models.ListingRent,
		MarketType:     models.MarketSecondary,
		PropertyTypeID: 3, // Tanah
		Title:          "Tanah Disewakan Dekat Pantai",
		Price:          50000000,
		ProvinceID:     21,
		CityID:         2171,
	}

	_, err := svc.Create(context.Background(), adminPrincipal, req)
	if err == nil {
		t.Fatal("expected error renting land, got nil")
	}

	var appErr *apperror.Error
	if !errors.As(err, &appErr) {
		t.Fatalf("expected apperror.Error, got %T", err)
	}
	if appErr.Code != "TYPE_NOT_ALLOWED_FOR_LISTING" {
		t.Errorf("unexpected error code: %s", appErr.Code)
	}
}

func TestRoleScoping_AgentIsolation(t *testing.T) {
	repo := newMockRepo()
	svc := NewService(repo, nil, nil, "https://media.test", "https://masterpro.test")

	agent1UserID := uuid.New()
	agent1ID := uuid.New()
	repo.agentMap[agent1UserID] = agent1ID

	agent2UserID := uuid.New()
	agent2ID := uuid.New()
	repo.agentMap[agent2UserID] = agent2ID

	agent1Principal := middleware.Principal{
		UserID: agent1UserID,
		Role:   models.RoleAgent,
	}

	// Property belongs to agent 2
	propID := uuid.New()
	repo.properties[propID] = &models.Property{
		ID:      propID,
		AgentID: agent2ID,
		Status:  models.StatusDraft,
		Title:   "Listing Milik Agen 2",
	}

	// Agent 1 attempts to get Agent 2's property -> should return 404
	_, err := svc.GetDetail(context.Background(), agent1Principal, propID)
	if err == nil {
		t.Fatal("expected 404 accessing other agent property, got nil")
	}

	var appErr *apperror.Error
	if !errors.As(err, &appErr) {
		t.Fatalf("expected apperror.Error, got %T", err)
	}
	if appErr.Status != http.StatusNotFound {
		t.Errorf("expected 404, got %d", appErr.Status)
	}
}

func TestTrackPublicEvent(t *testing.T) {
	repo := newMockRepo()
	svc := NewService(repo, nil, nil, "https://media.test", "https://masterpro.test")

	propID := uuid.New()
	repo.properties[propID] = &models.Property{
		ID:     propID,
		Slug:   "rumah-batam-centre",
		Status: models.StatusActive,
	}

	if err := svc.TrackPublicEvent(context.Background(), "rumah-batam-centre", "whatsapp_click"); err != nil {
		t.Fatalf("expected nil error, got %v", err)
	}
	if repo.properties[propID].WhatsappClickCount != 1 {
		t.Errorf("expected WhatsappClickCount=1, got %d", repo.properties[propID].WhatsappClickCount)
	}

	if err := svc.TrackPublicEvent(context.Background(), "rumah-batam-centre", "view"); err != nil {
		t.Fatalf("expected nil error, got %v", err)
	}
	if repo.properties[propID].ViewCount != 1 {
		t.Errorf("expected ViewCount=1, got %d", repo.properties[propID].ViewCount)
	}

	if err := svc.TrackPublicEvent(context.Background(), "tidak-ada", "whatsapp_click"); err == nil {
		t.Fatal("expected 404 for unknown slug, got nil")
	}
}
