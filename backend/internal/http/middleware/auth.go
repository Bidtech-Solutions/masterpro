package middleware

import (
	"context"
	"errors"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"github.com/bidtech-solutions/masterpro/backend/internal/models"
	"github.com/bidtech-solutions/masterpro/backend/internal/pkg/apperror"
	"github.com/bidtech-solutions/masterpro/backend/internal/pkg/response"
	"github.com/bidtech-solutions/masterpro/backend/internal/pkg/security"
)

// Nama cookie sesi (API.md §2.1).
const (
	CookieAccess  = "mp_access"
	CookieRefresh = "mp_refresh"
)

const (
	ctxUserID    = "auth.user_id"
	ctxRole      = "auth.role"
	ctxSessionID = "auth.session_id"
)

// SessionChecker memvalidasi bahwa sesi (family refresh token) masih aktif dan mengembalikan
// status & peran akun saat ini. Diimplementasikan oleh repository modul auth.
type SessionChecker interface {
	ActiveSession(ctx context.Context, userID, sessionID uuid.UUID) (role models.Role, status models.UserStatus, err error)
}

// ErrSessionNotFound dikembalikan SessionChecker bila sesi sudah dicabut/kedaluwarsa.
var ErrSessionNotFound = errors.New("session not found")

// Auth memverifikasi cookie mp_access, sesi, dan status akun setiap request (PRD §10.5).
func Auth(issuer *security.TokenIssuer, sessions SessionChecker) gin.HandlerFunc {
	return func(c *gin.Context) {
		token, err := c.Cookie(CookieAccess)
		if err != nil || token == "" {
			response.Error(c, apperror.Unauthenticated())
			return
		}
		claims, err := issuer.Parse(token)
		switch {
		case errors.Is(err, security.ErrTokenExpired):
			response.Error(c, apperror.TokenExpired())
			return
		case err != nil:
			response.Error(c, apperror.Unauthenticated())
			return
		}
		userID, err1 := uuid.Parse(claims.Subject)
		sessionID, err2 := uuid.Parse(claims.SID)
		if err1 != nil || err2 != nil {
			response.Error(c, apperror.Unauthenticated())
			return
		}
		role, status, err := sessions.ActiveSession(c.Request.Context(), userID, sessionID)
		switch {
		case errors.Is(err, ErrSessionNotFound):
			response.Error(c, apperror.Unauthenticated())
			return
		case err != nil:
			response.Error(c, apperror.Internal(err))
			return
		case status != models.UserActive:
			response.Error(c, apperror.New(403, apperror.CodeAccountInactive, "Akun Anda dinonaktifkan, hubungi admin"))
			return
		}
		c.Set(ctxUserID, userID.String())
		c.Set(ctxRole, string(role))
		c.Set(ctxSessionID, sessionID.String())
		c.Next()
	}
}
