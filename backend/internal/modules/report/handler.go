package report

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/bidtech-solutions/masterpro/backend/internal/http/middleware"
	"github.com/bidtech-solutions/masterpro/backend/internal/pkg/response"
	"github.com/bidtech-solutions/masterpro/backend/internal/pkg/validation"
)

// Handler HTTP modul report (API.md §12.10).
type Handler struct {
	svc Service
}

// NewHandler membuat instance Handler baru.
func NewHandler(svc Service) *Handler {
	return &Handler{svc: svc}
}

// Export menangani permintaan GET /properties/export.
func (h *Handler) Export(c *gin.Context) {
	principal := middleware.CurrentPrincipal(c)
	var q ExportQuery
	if err := c.ShouldBindQuery(&q); err != nil {
		response.Error(c, validation.FromBindError(err))
		return
	}

	f, filename, err := h.svc.ExportProperties(c.Request.Context(), principal, q)
	if err != nil {
		response.Error(c, err)
		return
	}
	defer func() {
		_ = f.Close()
	}()

	c.Header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s\"", filename))
	c.Header("Cache-Control", "no-store")
	c.Status(http.StatusOK)

	if err := f.Write(c.Writer); err != nil {
		_ = c.Error(err)
	}
}

