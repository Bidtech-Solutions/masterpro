package account

import "github.com/gin-gonic/gin"

// RegisterRoutes mendaftarkan route Akun Saya untuk seluruh pengguna terautentikasi (docs/API.md §9).
func RegisterRoutes(authed *gin.RouterGroup, h *Handler) {
	authed.PATCH("/account/profile", h.UpdateProfile)
	authed.POST("/account/avatar", h.UploadAvatar)
	authed.DELETE("/account/avatar", h.DeleteAvatar)
	authed.PUT("/account/password", h.ChangePassword)
}

