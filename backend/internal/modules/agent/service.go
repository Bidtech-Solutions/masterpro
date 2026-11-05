package agent

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"regexp"
	"strings"
	"time"

	"github.com/google/uuid"

	"github.com/bidtech-solutions/masterpro/backend/internal/models"
	"github.com/bidtech-solutions/masterpro/backend/internal/pkg/apperror"
	"github.com/bidtech-solutions/masterpro/backend/internal/pkg/pagination"
	"github.com/bidtech-solutions/masterpro/backend/internal/pkg/security"
	"github.com/bidtech-solutions/masterpro/backend/internal/storage"
)

var whatsappRegex = regexp.MustCompile(`^62[0-9]{8,13}$`)

type Service interface {
	Create(ctx context.Context, req CreateAgentRequest) (*AgentResponse, error)
	List(ctx context.Context, f ListFilter, p pagination.Params) ([]AgentResponse, pagination.Meta, error)
	GetByID(ctx context.Context, id uuid.UUID) (*AgentResponse, error)
	Update(ctx context.Context, id uuid.UUID, req UpdateAgentRequest) (*AgentResponse, error)
	ListOptions(ctx context.Context, query string, status string) ([]AgentOptionResponse, error)
	UploadPhoto(ctx context.Context, id uuid.UUID, r io.Reader, filename string, size int64, contentType string) (*AgentResponse, error)
}

type service struct {
	repo           Repository
	store          *storage.Client
	mediaPublicURL string
}

func NewService(repo Repository, store *storage.Client, mediaPublicURL string) Service {
	return &service{
		repo:           repo,
		store:          store,
		mediaPublicURL: strings.TrimRight(mediaPublicURL, "/"),
	}
}

func (s *service) normalizeWhatsApp(input string) (string, error) {
	// Buang spasi, strip, tanda tambah
	cleaned := strings.ReplaceAll(input, " ", "")
	cleaned = strings.ReplaceAll(cleaned, "-", "")
	cleaned = strings.ReplaceAll(cleaned, "+", "")

	if strings.HasPrefix(cleaned, "0") {
		cleaned = "62" + cleaned[1:]
	} else if strings.HasPrefix(cleaned, "8") {
		cleaned = "62" + cleaned
	}

	if !whatsappRegex.MatchString(cleaned) {
		return "", apperror.Validation(apperror.FieldError{
			Field:   "whatsapp_number",
			Code:    "INVALID_FORMAT",
			Message: "Format nomor WhatsApp tidak valid (contoh: 6281234567890)",
		})
	}
	return cleaned, nil
}

func (s *service) Create(ctx context.Context, req CreateAgentRequest) (*AgentResponse, error) {
	email := strings.ToLower(strings.TrimSpace(req.Email))
	if email == "" {
		return nil, apperror.Validation(apperror.FieldError{
			Field:   "email",
			Code:    "REQUIRED",
			Message: "Email wajib diisi",
		})
	}

	taken, err := s.repo.IsEmailTaken(ctx, email, nil)
	if err != nil {
		return nil, fmt.Errorf("check email: %w", err)
	}
	if taken {
		return nil, apperror.New(http.StatusConflict, apperror.CodeEmailTaken, "Email perusahaan sudah digunakan oleh akun lain")
	}

	whatsapp, err := s.normalizeWhatsApp(req.WhatsappNumber)
	if err != nil {
		return nil, err
	}

	hash, err := security.HashPassword(req.Password)
	if err != nil {
		return nil, fmt.Errorf("hash password: %w", err)
	}

	now := time.Now().UTC()
	userID := uuid.New()
	agentID := uuid.New()

	var phone *string
	if req.Phone != nil && strings.TrimSpace(*req.Phone) != "" {
		p := strings.TrimSpace(*req.Phone)
		phone = &p
	}

	u := models.User{
		ID:                userID,
		Name:              strings.TrimSpace(req.Name),
		Email:             email,
		Phone:             phone,
		PasswordHash:      hash,
		Role:              models.RoleAgent,
		Status:            models.UserActive,
		PasswordChangedAt: now,
		CreatedAt:         now,
		UpdatedAt:         now,
	}

	var joinedAt *time.Time
	if req.JoinedAt != nil && strings.TrimSpace(*req.JoinedAt) != "" {
		t, err := time.Parse("2006-01-02", strings.TrimSpace(*req.JoinedAt))
		if err == nil {
			joinedAt = &t
		}
	} else {
		joinedAt = &now
	}

	a := models.Agent{
		ID:             agentID,
		UserID:         userID,
		WhatsappNumber: whatsapp,
		Bio:            req.Bio,
		ServiceArea:    req.ServiceArea,
		JoinedAt:       joinedAt,
		CreatedAt:      now,
		UpdatedAt:      now,
	}

	if err := s.repo.CreateWithUserTx(ctx, &u, &a); err != nil {
		return nil, fmt.Errorf("create agent tx: %w", err)
	}

	a.User = &u
	return s.toResponse(&a, AgentListingCounts{}), nil
}

func (s *service) List(ctx context.Context, f ListFilter, p pagination.Params) ([]AgentResponse, pagination.Meta, error) {
	agents, total, err := s.repo.List(ctx, f, p)
	if err != nil {
		return nil, pagination.Meta{}, fmt.Errorf("list agents: %w", err)
	}

	agentIDs := make([]uuid.UUID, len(agents))
	for i, ag := range agents {
		agentIDs[i] = ag.ID
	}

	counts, err := s.repo.GetListingCounts(ctx, agentIDs)
	if err != nil {
		// Log and continue with empty counts
		counts = make(map[uuid.UUID]AgentListingCounts)
	}

	responses := make([]AgentResponse, len(agents))
	for i, ag := range agents {
		cnt := counts[ag.ID]
		responses[i] = *s.toResponse(&ag, cnt)
	}

	totalPages := 0
	if p.PerPage > 0 {
		totalPages = int((total + int64(p.PerPage) - 1) / int64(p.PerPage))
	}

	meta := pagination.Meta{
		Page:       p.Page,
		PerPage:    p.PerPage,
		Total:      total,
		TotalPages: totalPages,
	}

	return responses, meta, nil
}

func (s *service) GetByID(ctx context.Context, id uuid.UUID) (*AgentResponse, error) {
	ag, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, apperror.NotFound("Agen")
	}

	countsMap, _ := s.repo.GetListingCounts(ctx, []uuid.UUID{id})
	return s.toResponse(ag, countsMap[id]), nil
}

func (s *service) Update(ctx context.Context, id uuid.UUID, req UpdateAgentRequest) (*AgentResponse, error) {
	ag, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, apperror.NotFound("Agen")
	}

	u := ag.User
	now := time.Now().UTC()

	if req.Name != nil && strings.TrimSpace(*req.Name) != "" {
		u.Name = strings.TrimSpace(*req.Name)
	}

	if req.Email != nil && strings.TrimSpace(*req.Email) != "" {
		email := strings.ToLower(strings.TrimSpace(*req.Email))
		if email != strings.ToLower(u.Email) {
			taken, err := s.repo.IsEmailTaken(ctx, email, &u.ID)
			if err != nil {
				return nil, fmt.Errorf("check email: %w", err)
			}
			if taken {
				return nil, apperror.New(http.StatusConflict, apperror.CodeEmailTaken, "Email perusahaan sudah digunakan")
			}
			u.Email = email
		}
	}

	if req.Phone != nil {
		p := strings.TrimSpace(*req.Phone)
		u.Phone = &p
	}

	if req.Status != nil {
		u.Status = models.UserStatus(*req.Status)
	}

	if req.WhatsappNumber != nil && strings.TrimSpace(*req.WhatsappNumber) != "" {
		wa, err := s.normalizeWhatsApp(*req.WhatsappNumber)
		if err != nil {
			return nil, err
		}
		ag.WhatsappNumber = wa
	}

	if req.Bio != nil {
		ag.Bio = req.Bio
	}

	if req.ServiceArea != nil {
		ag.ServiceArea = req.ServiceArea
	}

	if req.JoinedAt != nil && strings.TrimSpace(*req.JoinedAt) != "" {
		t, err := time.Parse("2006-01-02", strings.TrimSpace(*req.JoinedAt))
		if err == nil {
			ag.JoinedAt = &t
		}
	}

	u.UpdatedAt = now
	ag.UpdatedAt = now

	if err := s.repo.Update(ctx, ag, u); err != nil {
		return nil, fmt.Errorf("update agent: %w", err)
	}

	countsMap, _ := s.repo.GetListingCounts(ctx, []uuid.UUID{id})
	return s.toResponse(ag, countsMap[id]), nil
}

func (s *service) ListOptions(ctx context.Context, query string, status string) ([]AgentOptionResponse, error) {
	return s.repo.ListOptions(ctx, query, status)
}

func (s *service) UploadPhoto(ctx context.Context, id uuid.UUID, r io.Reader, filename string, size int64, contentType string) (*AgentResponse, error) {
	ag, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, apperror.NotFound("Agen")
	}

	if s.store == nil {
		return nil, apperror.New(http.StatusServiceUnavailable, apperror.CodeServiceUnavailable, "Penyimpanan media belum dikonfigurasi")
	}

	ext := ".jpg"
	if strings.Contains(contentType, "png") {
		ext = ".png"
	} else if strings.Contains(contentType, "webp") {
		ext = ".webp"
	}

	key := fmt.Sprintf("avatars/%s-%d%s", ag.UserID.String(), time.Now().Unix(), ext)
	if err := s.store.Put(ctx, key, contentType, r, size); err != nil {
		return nil, fmt.Errorf("upload avatar: %w", err)
	}

	if err := s.repo.UpdateAvatar(ctx, ag.UserID, key); err != nil {
		return nil, fmt.Errorf("update avatar key: %w", err)
	}

	ag.User.AvatarKey = &key
	countsMap, _ := s.repo.GetListingCounts(ctx, []uuid.UUID{id})
	return s.toResponse(ag, countsMap[id]), nil
}

func (s *service) toResponse(ag *models.Agent, counts AgentListingCounts) *AgentResponse {
	var joinedAtStr *string
	if ag.JoinedAt != nil {
		str := ag.JoinedAt.Format("2006-01-02")
		joinedAtStr = &str
	}

	var avatarURL *string
	if ag.User != nil && ag.User.AvatarKey != nil && *ag.User.AvatarKey != "" {
		if strings.HasPrefix(*ag.User.AvatarKey, "http") {
			avatarURL = ag.User.AvatarKey
		} else if s.mediaPublicURL != "" {
			url := fmt.Sprintf("%s/%s", s.mediaPublicURL, *ag.User.AvatarKey)
			avatarURL = &url
		}
	}

	var userResp AgentUserResponse
	if ag.User != nil {
		userResp = AgentUserResponse{
			ID:          ag.User.ID,
			Name:        ag.User.Name,
			Email:       ag.User.Email,
			Phone:       ag.User.Phone,
			Status:      string(ag.User.Status),
			AvatarURL:   avatarURL,
			LastLoginAt: ag.User.LastLoginAt,
		}
	}

	return &AgentResponse{
		ID:             ag.ID,
		AgentCode:      ag.AgentCode,
		WhatsappNumber: ag.WhatsappNumber,
		Bio:            ag.Bio,
		ServiceArea:    ag.ServiceArea,
		JoinedAt:       joinedAtStr,
		User:           userResp,
		ListingCounts:  counts,
		CreatedAt:      ag.CreatedAt,
		UpdatedAt:      ag.UpdatedAt,
	}
}
