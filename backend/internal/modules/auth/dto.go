// Package auth — login, refresh, logout, dan pengguna saat ini (PRD §6.1 AUTH-01..06, API.md §8).
package auth

import (
	"time"

	"github.com/bidtech-solutions/masterpro/backend/internal/modules/user"
)

// LoginRequest body POST /auth/login.
type LoginRequest struct {
	Email    string `json:"email" binding:"required,email,max=160"`
	Password string `json:"password" binding:"required,max=72"`
}

// LoginResponse data POST /auth/login.
type LoginResponse struct {
	User            user.Response `json:"user"`
	AccessExpiresAt time.Time     `json:"access_expires_at"`
}

// RefreshResponse data POST /auth/refresh.
type RefreshResponse struct {
	AccessExpiresAt time.Time `json:"access_expires_at"`
}
