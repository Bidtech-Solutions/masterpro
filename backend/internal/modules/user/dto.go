package user

import (
	"time"

	"github.com/bidtech-solutions/masterpro/backend/internal/models"
	"github.com/bidtech-solutions/masterpro/backend/internal/storage"
)

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
