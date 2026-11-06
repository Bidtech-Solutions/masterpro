package user

import (
	"context"
	"errors"
	"strings"
	"time"

	"github.com/google/uuid"

	"github.com/bidtech-solutions/masterpro/backend/internal/models"
	"github.com/bidtech-solutions/masterpro/backend/internal/pkg/apperror"
	"github.com/bidtech-solutions/masterpro/backend/internal/pkg/pagination"
	"github.com/bidtech-solutions/masterpro/backend/internal/pkg/security"
	"github.com/bidtech-solutions/masterpro/backend/internal/pkg/validation"
)

// Service layanan manajemen pengguna (USR-01..USR-06).
type Service struct {
	repo           Repository
	mediaPublicURL string
}

func NewService(repo Repository, mediaPublicURL string) *Service {
	return &Service{repo: repo, mediaPublicURL: mediaPublicURL}
}

func (s *Service) List(ctx context.Context, filter ListFilter, page pagination.Params) ([]Response, int64, error) {
	users, total, err := s.repo.List(ctx, filter, page)
	if err != nil {
		return nil, 0, apperror.Internal(err)
	}
	res := make([]Response, 0, len(users))
	for i := range users {
		res = append(res, ToResponse(&users[i], s.mediaPublicURL))
	}
	return res, total, nil
}

func (s *Service) GetByID(ctx context.Context, id uuid.UUID) (Response, error) {
	u, err := s.repo.GetByID(ctx, id)
	if errors.Is(err, ErrNotFound) {
		return Response{}, apperror.NotFound("Pengguna")
	}
	if err != nil {
		return Response{}, apperror.Internal(err)
	}
	return ToResponse(u, s.mediaPublicURL), nil
}

func (s *Service) CreateAdmin(ctx context.Context, req CreateUserRequest) (Response, error) {
	email := strings.ToLower(strings.TrimSpace(req.Email))
	exists, err := s.repo.EmailExists(ctx, email, nil)
	if err != nil {
		return Response{}, apperror.Internal(err)
	}
	if exists {
		return Response{}, apperror.Conflict(apperror.CodeEmailTaken, "Email sudah terdaftar")
	}
	if !validation.IsStrongPassword(req.Password) {
		return Response{}, apperror.Validation(apperror.FieldError{
			Field:   "password",
			Code:    "password_weak",
			Message: "Password wajib 8–72 karakter dengan huruf besar, huruf kecil, angka, dan karakter spesial",
		})
	}

	hash, err := security.HashPassword(req.Password)
	if err != nil {
		return Response{}, apperror.Internal(err)
	}

	id, err := uuid.NewV7()
	if err != nil {
		id = uuid.New()
	}

	now := time.Now().UTC()
	u := &models.User{
		ID:                id,
		Name:              strings.TrimSpace(req.Name),
		Email:             email,
		Phone:             req.Phone,
		PasswordHash:      hash,
		Role:              models.RoleAdmin,
		Status:            models.UserActive,
		PasswordChangedAt: now,
		CreatedAt:         now,
		UpdatedAt:         now,
	}

	if err := s.repo.Create(ctx, u); err != nil {
		return Response{}, apperror.Internal(err)
	}
	return ToResponse(u, s.mediaPublicURL), nil
}

func (s *Service) Update(ctx context.Context, id uuid.UUID, req UpdateUserRequest) (Response, error) {
	u, err := s.repo.GetByID(ctx, id)
	if errors.Is(err, ErrNotFound) {
		return Response{}, apperror.NotFound("Pengguna")
	}
	if err != nil {
		return Response{}, apperror.Internal(err)
	}

	if req.Email != nil {
		email := strings.ToLower(strings.TrimSpace(*req.Email))
		if email != strings.ToLower(u.Email) {
			exists, err := s.repo.EmailExists(ctx, email, &id)
			if err != nil {
				return Response{}, apperror.Internal(err)
			}
			if exists {
				return Response{}, apperror.Conflict(apperror.CodeEmailTaken, "Email sudah terdaftar")
			}
			u.Email = email
		}
	}
	if req.Name != nil {
		u.Name = strings.TrimSpace(*req.Name)
	}
	if req.Phone != nil {
		u.Phone = req.Phone
	}
	u.UpdatedAt = time.Now().UTC()

	if err := s.repo.Update(ctx, u); err != nil {
		return Response{}, apperror.Internal(err)
	}
	return ToResponse(u, s.mediaPublicURL), nil
}

func (s *Service) UpdateStatus(ctx context.Context, actorID, targetID uuid.UUID, req UpdateStatusRequest) (Response, error) {
	if actorID == targetID && req.Status == models.UserInactive {
		return Response{}, apperror.New(422, apperror.CodeCannotDeactivateSelf, "Anda tidak dapat menonaktifkan akun Anda sendiri")
	}

	u, err := s.repo.GetByID(ctx, targetID)
	if errors.Is(err, ErrNotFound) {
		return Response{}, apperror.NotFound("Pengguna")
	}
	if err != nil {
		return Response{}, apperror.Internal(err)
	}

	if u.Role == models.RoleAdmin && u.Status == models.UserActive && req.Status == models.UserInactive {
		activeAdmins, err := s.repo.CountActiveAdmins(ctx)
		if err != nil {
			return Response{}, apperror.Internal(err)
		}
		if activeAdmins <= 1 {
			return Response{}, apperror.Conflict(apperror.CodeLastActiveAdmin, "Tidak dapat menonaktifkan satu-satunya admin aktif")
		}
	}

	u.Status = req.Status
	u.UpdatedAt = time.Now().UTC()

	if err := s.repo.Update(ctx, u); err != nil {
		return Response{}, apperror.Internal(err)
	}

	if req.Status == models.UserInactive {
		_ = s.repo.RevokeAllUserSessions(ctx, targetID)
	}

	return ToResponse(u, s.mediaPublicURL), nil
}

func (s *Service) ResetPassword(ctx context.Context, targetID uuid.UUID, req ResetPasswordRequest) error {
	if !validation.IsStrongPassword(req.NewPassword) {
		return apperror.Validation(apperror.FieldError{
			Field:   "new_password",
			Code:    "password_weak",
			Message: "Password baru wajib 8–72 karakter dengan huruf besar, huruf kecil, angka, dan karakter spesial",
		})
	}

	u, err := s.repo.GetByID(ctx, targetID)
	if errors.Is(err, ErrNotFound) {
		return apperror.NotFound("Pengguna")
	}
	if err != nil {
		return apperror.Internal(err)
	}

	hash, err := security.HashPassword(req.NewPassword)
	if err != nil {
		return apperror.Internal(err)
	}

	now := time.Now().UTC()
	u.PasswordHash = hash
	u.PasswordChangedAt = now
	u.UpdatedAt = now

	if err := s.repo.Update(ctx, u); err != nil {
		return apperror.Internal(err)
	}

	_ = s.repo.RevokeAllUserSessions(ctx, targetID)
	return nil
}
