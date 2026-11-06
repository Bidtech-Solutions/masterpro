package agent

import (
	"github.com/gin-gonic/gin"
)

// RegisterRoutes mendaftarkan seluruh route keagenan.
// authed: endpoint yang dapat diakses oleh semua pengguna terautentikasi (admin & agen).
// admin: endpoint yang dibatasi khusus peran Admin.
func RegisterRoutes(authed, admin *gin.RouterGroup, h *Handler) {
	authed.GET("/agents/options", h.ListOptions)
	authed.GET("/agents/:id", h.GetByID)

	admin.GET("/agents", h.List)
	admin.POST("/agents", h.Create)
	admin.PATCH("/agents/:id", h.Update)
	admin.POST("/agents/:id/photo", h.UploadPhoto)
}
