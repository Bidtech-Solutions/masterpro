package account

import (
	"github.com/gin-gonic/gin"

	"github.com/bidtech-solutions/masterpro/backend/internal/http/middleware"
	"github.com/bidtech-solutions/masterpro/backend/internal/pkg/apperror"
	"github.com/bidtech-solutions/masterpro/backend/internal/pkg/response"
	"github.com/bidtech-solutions/masterpro/backend/internal/pkg/validation"
)

// Handler HTTP untuk modul Akun Saya (docs/API.md §9).
type Handler struct {
	svc *Service
}

func NewHandler(svc *Service) *Handler {
	return &Handler{svc: svc}
}

// UpdateProfile PATCH /api/v1/account/profile
func (h *Handler) UpdateProfile(c *gin.Context) {
	var req UpdateProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, validation.FromBindError(err))
		return
	}
	actor := middleware.CurrentPrincipal(c)
	res, err := h.svc.UpdateProfile(c.Request.Context(), actor.UserID, req)
	if err != nil {
		response.Error(c, err)
		return
	}
	response.OK(c, res)
}

// UploadAvatar POST /api/v1/account/avatar
func (h *Handler) UploadAvatar(c *gin.Context) {
	file, err := c.FormFile("file")
	if err != nil {
		response.Error(c, apperror.BadRequest("File foto wajib diunggah pada field 'file'"))
		return
	}
	actor := middleware.CurrentPrincipal(c)
	res, err := h.svc.UploadAvatar(c.Request.Context(), actor.UserID, file)
	if err != nil {
		response.Error(c, err)
		return
	}
	response.OK(c, res)
}

// DeleteAvatar DELETE /api/v1/account/avatar
func (h *Handler) DeleteAvatar(c *gin.Context) {
	actor := middleware.CurrentPrincipal(c)
	res, err := h.svc.DeleteAvatar(c.Request.Context(), actor.UserID)
	if err != nil {
		response.Error(c, err)
		return
	}
	response.OK(c, res)
}

// ChangePassword PUT /api/v1/account/password
func (h *Handler) ChangePassword(c *gin.Context) {
	var req ChangePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, validation.FromBindError(err))
		return
	}
	actor := middleware.CurrentPrincipal(c)
	if err := h.svc.ChangePassword(c.Request.Context(), actor.UserID, actor.SessionID, req); err != nil {
		response.Error(c, err)
		return
	}
	response.NoContent(c)
}
