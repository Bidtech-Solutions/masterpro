package user

import "github.com/gin-gonic/gin"

// RegisterRoutes mendaftarkan seluruh route manajemen pengguna khusus Admin (docs/API.md §10).
func RegisterRoutes(admin *gin.RouterGroup, h *Handler) {
	admin.GET("/users", h.List)
	admin.POST("/users", h.Create)
	admin.GET("/users/:id", h.GetByID)
	admin.PATCH("/users/:id", h.Update)
	admin.PATCH("/users/:id/status", h.UpdateStatus)
	admin.PUT("/users/:id/password", h.ResetPassword)
}
