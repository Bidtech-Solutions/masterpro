package agent

import (
	"time"

	"github.com/google/uuid"
)

// CreateAgentRequest payload untuk POST /agents (docs/API.md §11.3)
type CreateAgentRequest struct {
	Name           string  `json:"name" binding:"required,min=2,max=120"`
	Email          string  `json:"email" binding:"required,email,max=160"`
	Phone          *string `json:"phone" binding:"omitempty,max=20"`
	Password       string  `json:"password" binding:"required,min=8,max=72"`
	WhatsappNumber string  `json:"whatsapp_number" binding:"required"`
	Bio            *string `json:"bio"`
	ServiceArea    *string `json:"service_area" binding:"omitempty,max=160"`
	JoinedAt       *string `json:"joined_at"` // YYYY-MM-DD
}

// UpdateAgentRequest payload untuk PATCH /agents/{id} (docs/API.md §11.5)
type UpdateAgentRequest struct {
	Name           *string `json:"name" binding:"omitempty,min=2,max=120"`
	Email          *string `json:"email" binding:"omitempty,email,max=160"`
	Phone          *string `json:"phone" binding:"omitempty,max=20"`
	Status         *string `json:"status" binding:"omitempty,oneof=active inactive"`
	WhatsappNumber *string `json:"whatsapp_number"`
	Bio            *string `json:"bio"`
	ServiceArea    *string `json:"service_area" binding:"omitempty,max=160"`
	JoinedAt       *string `json:"joined_at"`
}

// AgentResponse representasi agen lengkap
type AgentResponse struct {
	ID             uuid.UUID          `json:"id"`
	AgentCode      string             `json:"agent_code"`
	WhatsappNumber string             `json:"whatsapp_number"`
	Bio            *string            `json:"bio"`
	ServiceArea    *string            `json:"service_area"`
	JoinedAt       *string            `json:"joined_at"`
	User           AgentUserResponse  `json:"user"`
	ListingCounts  AgentListingCounts `json:"listing_counts"`
	CreatedAt      time.Time          `json:"created_at"`
	UpdatedAt      time.Time          `json:"updated_at"`
}

// AgentUserResponse data akun user milik agen
type AgentUserResponse struct {
	ID          uuid.UUID  `json:"id"`
	Name        string     `json:"name"`
	Email       string     `json:"email"`
	Phone       *string    `json:"phone"`
	Status      string     `json:"status"`
	AvatarURL   *string    `json:"avatar_url"`
	LastLoginAt *time.Time `json:"last_login_at"`
}

// AgentListingCounts rincian jumlah listing milik agen
type AgentListingCounts struct {
	Total    int `json:"total"`
	Draft    int `json:"draft"`
	Active   int `json:"active"`
	Sold     int `json:"sold"`
	Rented   int `json:"rented"`
	Inactive int `json:"inactive"`
}

// AgentOptionResponse untuk dropdown pilihan agen (docs/API.md §11.2)
type AgentOptionResponse struct {
	ID        uuid.UUID `json:"id"`
	AgentCode string    `json:"agent_code"`
	Name      string    `json:"name"`
	Status    string    `json:"status"`
}

// ListFilter parameter pencarian dan penyaringan agen
type ListFilter struct {
	Query  string
	Status string
	Sort   string // "newest", "name", "listings"
}

