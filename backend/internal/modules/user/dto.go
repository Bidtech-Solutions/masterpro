package user

import (
	"time"

	"github.com/bidtech-solutions/masterpro/backend/internal/models"
	"github.com/bidtech-solutions/masterpro/backend/internal/storage"
)

// CreateUserRequest payload untuk POST /users (membuat akun Admin, API.md §10.2).
type CreateUserRequest struct {
	Name     string  `json:"name" binding:"required,min=2,max=120"`
	Email    string  `json:"email" binding:"required,email,max=160"`
	Phone    *string `json:"phone" binding:"omitempty,max=20"`
	Password string  `json:"password" binding:"required,password"`
}

// UpdateUserRequest payload untuk PATCH /users/{id} (API.md §10.4).
type UpdateUserRequest struct {
	Name  *string `json:"name" binding:"omitempty,min=2,max=120"`
	Email *string `json:"email" binding:"omitempty,email,max=160"`
	Phone *string `json:"phone" binding:"omitempty,max=20"`
}

// UpdateStatusRequest payload untuk PATCH /users/{id}/status (API.md §10.5).
type UpdateStatusRequest struct {
	Status models.UserStatus `json:"status" binding:"required,oneof=active inactive"`
}

// ResetPasswordRequest payload untuk PUT /users/{id}/password (API.md §10.6).
type ResetPasswordRequest struct {
	NewPassword string `json:"new_password" binding:"required,password"`
}

// ListFilter parameter pencarian & penyaringan daftar pengguna.
type ListFilter struct {
	Query  string
	Role   string
	Status string
	Sort   string // "newest", "name", "last_login"
}

// Response objek User (docs/API.md §4.6). Dipakai juga oleh modul auth & account.
type Response struct {
	ID          string            `json:"id"`
	Name        string            `json:"name"`
	Email       string            `json:"email"`
	Phone       *string           `json:"phone"`
	Role        models.Role       `json:"role"`
	Status      models.UserStatus `json:"status"`
	AvatarURL   *string           `json:"avatar_url"`
	LastLoginAt *time.Time        `json:"last_login_at"`
	CreatedAt   time.Time         `json:"created_at"`
	UpdatedAt   time.Time         `json:"updated_at"`
	Agent       *AgentProfile     `json:"agent"`
}

// AgentProfile bagian `agent` pada User.
type AgentProfile struct {
	ID             string  `json:"id"`
	AgentCode      string  `json:"agent_code"`
	WhatsappNumber string  `json:"whatsapp_number"`
	Bio            *string `json:"bio"`
	ServiceArea    *string `json:"service_area"`
	JoinedAt       *string `json:"joined_at"` // YYYY-MM-DD
}

// ToResponse memetakan model ke DTO. mediaURL = MEDIA_PUBLIC_URL.
func ToResponse(u *models.User, mediaURL string) Response {
	r := Response{
		ID:          u.ID.String(),
		Name:        u.Name,
		Email:       u.Email,
		Phone:       u.Phone,
		Role:        u.Role,
		Status:      u.Status,
		LastLoginAt: u.LastLoginAt,
		CreatedAt:   u.CreatedAt,
		UpdatedAt:   u.UpdatedAt,
	}
	if u.AvatarKey != nil && *u.AvatarKey != "" {
		url := storage.URL(mediaURL, *u.AvatarKey)
		r.AvatarURL = &url
	}
	if a := u.Agent; a != nil {
		p := &AgentProfile{
			ID:             a.ID.String(),
			AgentCode:      a.AgentCode,
			WhatsappNumber: a.WhatsappNumber,
			Bio:            a.Bio,
			ServiceArea:    a.ServiceArea,
		}
		if a.JoinedAt != nil {
			d := a.JoinedAt.Format(time.DateOnly)
			p.JoinedAt = &d
		}
		r.Agent = p
	}
	return r
}
