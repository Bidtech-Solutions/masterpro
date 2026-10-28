package property

import (
	"github.com/gin-gonic/gin"

	"github.com/bidtech-solutions/masterpro/backend/internal/pkg/pagination"
	"github.com/bidtech-solutions/masterpro/backend/internal/pkg/response"
	"github.com/bidtech-solutions/masterpro/backend/internal/pkg/validation"
)

// Handler HTTP listing.
type Handler struct{ svc Service }

// NewHandler membuat handler.
func NewHandler(svc Service) *Handler { return &Handler{svc: svc} }

// ListPublic GET /public/properties (API.md §7.1).
func (h *Handler) ListPublic(c *gin.Context) {
	var q PublicListQuery
	if err := c.ShouldBindQuery(&q); err != nil {
		response.Error(c, validation.FromBindError(err))
		return
	}
	p := pagination.Parse(c, pagination.PublicDefault, pagination.PublicMax)
	cards, meta, err := h.svc.ListPublic(c.Request.Context(), q, p)
	if err != nil {
		response.Error(c, err)
		return
	}
	response.Paginated(c, cards, meta)
}
