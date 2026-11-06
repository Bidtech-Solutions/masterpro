package dashboard

import (
	"github.com/gin-gonic/gin"

	"github.com/bidtech-solutions/masterpro/backend/internal/http/middleware"
	"github.com/bidtech-solutions/masterpro/backend/internal/pkg/apperror"
	"github.com/bidtech-solutions/masterpro/backend/internal/pkg/response"
)

type Handler struct {
	svc *Service
}

func NewHandler(svc *Service) *Handler {
	return &Handler{svc: svc}
}

// GetSummary menangani GET /dashboard/summary (API.md §13).
func (h *Handler) GetSummary(c *gin.Context) {
	principal := middleware.CurrentPrincipal(c)
	data, err := h.svc.GetSummary(c.Request.Context(), principal)
	if err != nil {
		response.Error(c, apperror.Internal(err))
		return
	}
	response.OK(c, data)
}
