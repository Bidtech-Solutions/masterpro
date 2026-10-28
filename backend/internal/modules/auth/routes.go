package auth

import (
	"time"

	"github.com/gin-gonic/gin"

	"github.com/bidtech-solutions/masterpro/backend/internal/http/middleware"
)

// RegisterRoutes mendaftarkan /auth/* (API.md §8). `authed` adalah middleware.Auth.
func RegisterRoutes(v1 *gin.RouterGroup, h *Handler, authed gin.HandlerFunc) {
	g := v1.Group("/auth", middleware.NoStore())
	g.POST("/login", h.Login)
	g.POST("/refresh", middleware.RateLimitByIP(middleware.NewLimiter(30, time.Minute, 30)), h.Refresh)
	g.POST("/logout", authed, h.Logout)
	g.GET("/me", authed, h.Me)
}
