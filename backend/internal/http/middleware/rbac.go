package middleware

import (
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"github.com/bidtech-solutions/masterpro/backend/internal/models"
	"github.com/bidtech-solutions/masterpro/backend/internal/pkg/apperror"
	"github.com/bidtech-solutions/masterpro/backend/internal/pkg/response"
)

// RequireRole membatasi akses ke peran tertentu (harus dipasang setelah Auth).
func RequireRole(roles ...models.Role) gin.HandlerFunc {
	return func(c *gin.Context) {
		current := models.Role(c.GetString(ctxRole))
		for _, r := range roles {
			if r == current {
				c.Next()
				return
			}
		}
		response.Error(c, apperror.Forbidden())
	}
}

// Principal identitas pengguna yang sedang login.
type Principal struct {
	UserID    uuid.UUID
	Role      models.Role
	SessionID uuid.UUID
}

// IsAdmin true bila peran admin.
func (p Principal) IsAdmin() bool { return p.Role == models.RoleAdmin }

// CurrentPrincipal mengambil Principal dari context (hanya valid di route ber-middleware Auth).
func CurrentPrincipal(c *gin.Context) Principal {
	uid, _ := uuid.Parse(c.GetString(ctxUserID))
	sid, _ := uuid.Parse(c.GetString(ctxSessionID))
	return Principal{UserID: uid, Role: models.Role(c.GetString(ctxRole)), SessionID: sid}
}
