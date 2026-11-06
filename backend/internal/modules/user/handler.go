package user

import (
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"github.com/bidtech-solutions/masterpro/backend/internal/http/middleware"
	"github.com/bidtech-solutions/masterpro/backend/internal/pkg/apperror"
	"github.com/bidtech-solutions/masterpro/backend/internal/pkg/pagination"
	"github.com/bidtech-solutions/masterpro/backend/internal/pkg/response"
	"github.com/bidtech-solutions/masterpro/backend/internal/pkg/validation"
)

// Handler HTTP untuk manajemen pengguna (docs/API.md §10).
type Handler struct {
	svc *Service
}

func NewHandler(svc *Service) *Handler {
	return &Handler{svc: svc}
}

// List GET /api/v1/users
func (h *Handler) List(c *gin.Context) {
	page := pagination.Parse(c, pagination.DashboardDefault, pagination.DashboardMax)
	filter := ListFilter{
		Query:  c.Query("q"),
		Role:   c.Query("role"),
		Status: c.Query("status"),
		Sort:   c.DefaultQuery("sort", "newest"),
	}

	items, total, err := h.svc.List(c.Request.Context(), filter, page)
	if err != nil {
		response.Error(c, err)
		return
	}
	response.Paginated(c, items, pagination.NewMeta(page, total))
}

// GetByID GET /api/v1/users/:id
func (h *Handler) GetByID(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, apperror.NotFound("Pengguna"))
		return
	}
	res, err := h.svc.GetByID(c.Request.Context(), id)
	if err != nil {
		response.Error(c, err)
		return
	}
	response.OK(c, res)
}

// Create POST /api/v1/users
func (h *Handler) Create(c *gin.Context) {
	var req CreateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, validation.FromBindError(err))
		return
	}
	res, err := h.svc.CreateAdmin(c.Request.Context(), req)
	if err != nil {
		response.Error(c, err)
		return
	}
	response.Created(c, res)
}

// Update PATCH /api/v1/users/:id
func (h *Handler) Update(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, apperror.NotFound("Pengguna"))
		return
	}
	var req UpdateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, validation.FromBindError(err))
		return
	}
	res, err := h.svc.Update(c.Request.Context(), id, req)
	if err != nil {
		response.Error(c, err)
		return
	}
	response.OK(c, res)
}

// UpdateStatus PATCH /api/v1/users/:id/status
func (h *Handler) UpdateStatus(c *gin.Context) {
	targetID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, apperror.NotFound("Pengguna"))
		return
	}
	var req UpdateStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, validation.FromBindError(err))
		return
	}

	actor := middleware.CurrentPrincipal(c)
	res, err := h.svc.UpdateStatus(c.Request.Context(), actor.UserID, targetID, req)
	if err != nil {
		response.Error(c, err)
		return
	}
	response.OK(c, res)
}

// ResetPassword PUT /api/v1/users/:id/password
func (h *Handler) ResetPassword(c *gin.Context) {
	targetID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, apperror.NotFound("Pengguna"))
		return
	}
	var req ResetPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, validation.FromBindError(err))
		return
	}
	if err := h.svc.ResetPassword(c.Request.Context(), targetID, req); err != nil {
		response.Error(c, err)
		return
	}
	response.NoContent(c)
}
