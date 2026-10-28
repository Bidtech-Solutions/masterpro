package reference

import (
	"github.com/gin-gonic/gin"

	"github.com/bidtech-solutions/masterpro/backend/internal/pkg/response"
	"github.com/bidtech-solutions/masterpro/backend/internal/pkg/validation"
)

// Handler HTTP data referensi.
type Handler struct{ svc Service }

// NewHandler membuat handler.
func NewHandler(svc Service) *Handler { return &Handler{svc: svc} }

// PropertyTypes GET /public/property-types.
func (h *Handler) PropertyTypes(c *gin.Context) {
	var q PropertyTypeQuery
	if err := c.ShouldBindQuery(&q); err != nil {
		response.Error(c, validation.FromBindError(err))
		return
	}
	data, err := h.svc.PropertyTypes(c.Request.Context(), q)
	respond(c, data, err)
}

// Facilities GET /public/facilities.
func (h *Handler) Facilities(c *gin.Context) {
	data, err := h.svc.Facilities(c.Request.Context())
	respond(c, data, err)
}

// Provinces GET /public/locations/provinces.
func (h *Handler) Provinces(c *gin.Context) {
	var q ProvinceQuery
	if err := c.ShouldBindQuery(&q); err != nil {
		response.Error(c, validation.FromBindError(err))
		return
	}
	data, err := h.svc.Provinces(c.Request.Context(), q)
	respond(c, data, err)
}

// Cities GET /public/locations/cities.
func (h *Handler) Cities(c *gin.Context) {
	var q CityQuery
	if err := c.ShouldBindQuery(&q); err != nil {
		response.Error(c, validation.FromBindError(err))
		return
	}
	data, err := h.svc.Cities(c.Request.Context(), q)
	respond(c, data, err)
}

func respond(c *gin.Context, data any, err error) {
	if err != nil {
		response.Error(c, err)
		return
	}
	response.OK(c, data)
}
