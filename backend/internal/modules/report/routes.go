package report

import "github.com/gin-gonic/gin"

// RegisterRoutes mendaftarkan endpoint modul report ke router admin (API.md §12.10).
func RegisterRoutes(admin *gin.RouterGroup, h *Handler) {
	if admin != nil {
		admin.GET("/properties/export", h.Export)
	}
}
