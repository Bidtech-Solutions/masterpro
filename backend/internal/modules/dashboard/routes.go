package dashboard

import "github.com/gin-gonic/gin"

// RegisterRoutes mendaftarkan endpoint ringkasan dashboard (API.md §13).
func RegisterRoutes(r gin.IRoutes, h *Handler) {
	r.GET("/dashboard/summary", h.GetSummary)
}
