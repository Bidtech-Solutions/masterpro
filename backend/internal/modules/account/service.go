package account

import (
	"context"
	"errors"
	"fmt"
	"mime/multipart"
	"net/http"
	"regexp"
	"strings"
	"time"

	"github.com/google/uuid"

	"github.com/bidtech-solutions/masterpro/backend/internal/models"
	"github.com/bidtech-solutions/masterpro/backend/internal/modules/user"
	"github.com/bidtech-solutions/masterpro/backend/internal/pkg/apperror"
	"github.com/bidtech-solutions/masterpro/backend/internal/pkg/security"
	"github.com/bidtech-solutions/masterpro/backend/internal/pkg/validation"
	"github.com/bidtech-solutions/masterpro/backend/internal/storage"
)

var whatsappRe = regexp.MustCompile(`^62[0-9]{8,13}$`)

// Service logika bisnis modul Akun Saya (ACC-01, ACC-02).
type Service struct {
	repo           Repository
	storage        *storage.Client
	mediaPublicURL string
}

func NewService(repo Repository, st *storage.Client, mediaPublicURL string) *Service {
	return &Service{
		repo:           repo,
		storage:        st,
		mediaPublicURL: mediaPublicURL,
	}
}

func normalizeWhatsapp(raw string) string {
	var b strings.Builder
	for _, r := range raw {
		if r >= '0' && r <= '9' {
			b.WriteRune(r)
		}
	}
	digits := b.String()
	if strings.HasPrefix(digits, "08") {
		digits = "62" + digits[1:]
	} else if strings.HasPrefix(digits, "8") {
		digits = "62" + digits
	}
	return digits
}

// UpdateProfile memperbarui profil pribadi pengguna yang sedang login.
func (s *Service) UpdateProfile(ctx context.Context, userID uuid.UUID, req UpdateProfileRequest) (user.Response, error) {
	u, err := s.repo.GetByID(ctx, userID)
	if errors.Is(err, ErrNotFound) {
		return user.Response{}, apperror.NotFound("Akun")
	}
	if err != nil {
		return user.Response{}, apperror.Internal(err)
	}

	now := time.Now().UTC()
	if req.Name != nil {
		u.Name = strings.TrimSpace(*req.Name)
	}
	if req.Phone != nil {
		u.Phone = req.Phone
	}
	u.UpdatedAt = now

	var ag *models.Agent
	if u.Role == models.RoleAgent && u.Agent != nil {
		ag = u.Agent
		if req.WhatsappNumber != nil {
			wa := normalizeWhatsapp(*req.WhatsappNumber)
			if !whatsappRe.MatchString(wa) {
				return user.Response{}, apperror.Validation(apperror.FieldError{
					Field:   "whatsapp_number",
					Code:    "phone_id",
					Message: "Nomor WhatsApp harus valid (mis. 6281234567890)",
				})
			}
			ag.WhatsappNumber = wa
		}
		if req.Bio != nil {
			ag.Bio = req.Bio
		}
		if req.ServiceArea != nil {
			ag.ServiceArea = req.ServiceArea
		}
		ag.UpdatedAt = now
	}

	if err := s.repo.UpdateUserAndAgent(ctx, u, ag); err != nil {
		return user.Response{}, apperror.Internal(err)
	}
	return user.ToResponse(u, s.mediaPublicURL), nil
}

// UploadAvatar mengunggah foto avatar ke S3/RustFS.
func (s *Service) UploadAvatar(ctx context.Context, userID uuid.UUID, fileHeader *multipart.FileHeader) (user.Response, error) {
	u, err := s.repo.GetByID(ctx, userID)
	if errors.Is(err, ErrNotFound) {
		return user.Response{}, apperror.NotFound("Akun")
	}
	if err != nil {
		return user.Response{}, apperror.Internal(err)
	}

	if fileHeader.Size > 10*1024*1024 {
		return user.Response{}, apperror.BadRequest("Ukuran file maksimal 10 MB")
	}

	src, err := fileHeader.Open()
	if err != nil {
		return user.Response{}, apperror.BadRequest("Gagal membuka file foto")
	}
	defer func() { _ = src.Close() }()

	contentType := fileHeader.Header.Get("Content-Type")
	ext := ".jpg"
	if strings.Contains(contentType, "png") {
		ext = ".png"
	} else if strings.Contains(contentType, "webp") {
		ext = ".webp"
	} else {
		contentType = "image/jpeg"
	}

	key := fmt.Sprintf("avatars/%s-%d%s", userID.String(), time.Now().Unix(), ext)
	if s.storage != nil {
		if err := s.storage.Put(ctx, key, contentType, src, fileHeader.Size); err != nil {
			return user.Response{}, apperror.Internal(err)
		}
	}

	if err := s.repo.UpdateAvatarKey(ctx, userID, &key); err != nil {
		return user.Response{}, apperror.Internal(err)
	}
	u.AvatarKey = &key
	return user.ToResponse(u, s.mediaPublicURL), nil
}

// DeleteAvatar menghapus foto avatar pengguna.
func (s *Service) DeleteAvatar(ctx context.Context, userID uuid.UUID) (user.Response, error) {
	u, err := s.repo.GetByID(ctx, userID)
	if errors.Is(err, ErrNotFound) {
		return user.Response{}, apperror.NotFound("Akun")
	}
	if err != nil {
		return user.Response{}, apperror.Internal(err)
	}

	if err := s.repo.UpdateAvatarKey(ctx, userID, nil); err != nil {
		return user.Response{}, apperror.Internal(err)
	}
	u.AvatarKey = nil
	return user.ToResponse(u, s.mediaPublicURL), nil
}

// ChangePassword mengganti password akun dengan Password Complexity Policy.
func (s *Service) ChangePassword(ctx context.Context, userID, currentSessionID uuid.UUID, req ChangePasswordRequest) error {
	if req.NewPassword != req.NewPasswordConfirmation {
		return apperror.Validation(apperror.FieldError{
			Field:   "new_password_confirmation",
			Code:    "mismatch",
			Message: "Konfirmasi password baru tidak sama",
		})
	}
	if !validation.IsStrongPassword(req.NewPassword) {
		return apperror.Validation(apperror.FieldError{
			Field:   "new_password",
			Code:    "password_weak",
			Message: "Password baru wajib 8–72 karakter dan memuat huruf besar, huruf kecil, angka, serta karakter spesial",
		})
	}
	if req.NewPassword == req.CurrentPassword {
		return apperror.Validation(apperror.FieldError{
			Field:   "new_password",
			Code:    "password_same",
			Message: "Password baru tidak boleh sama dengan password saat ini",
		})
	}

	u, err := s.repo.GetByID(ctx, userID)
	if errors.Is(err, ErrNotFound) {
		return apperror.NotFound("Akun")
	}
	if err != nil {
		return apperror.Internal(err)
	}

	if !security.CheckPassword(u.PasswordHash, req.CurrentPassword) {
		return apperror.New(http.StatusUnauthorized, apperror.CodeInvalidCurrentPassword, "Password saat ini tidak sesuai")
	}

	newHash, err := security.HashPassword(req.NewPassword)
	if err != nil {
		return apperror.Internal(err)
	}

	if err := s.repo.UpdatePasswordAndRevokeOthers(ctx, userID, newHash, currentSessionID); err != nil {
		return apperror.Internal(err)
	}
	return nil
}
