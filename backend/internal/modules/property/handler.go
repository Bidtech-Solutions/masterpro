package property

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"github.com/bidtech-solutions/masterpro/backend/internal/http/middleware"
	"github.com/bidtech-solutions/masterpro/backend/internal/pkg/apperror"
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

// GetPublic GET /public/properties/:slug (API.md §7.2).
func (h *Handler) GetPublic(c *gin.Context) {
	slug := c.Param("slug")
	detail, err := h.svc.GetPublicBySlug(c.Request.Context(), slug)
	if err != nil {
		response.Error(c, err)
		return
	}
	response.OK(c, detail)
}

// ListSimilar GET /public/properties/:slug/similar (API.md §7.3).
func (h *Handler) ListSimilar(c *gin.Context) {
	slug := c.Param("slug")
	limit := 8
	if l := c.Query("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 && parsed <= 12 {
			limit = parsed
		}
	}
	cards, err := h.svc.ListSimilar(c.Request.Context(), slug, limit)
	if err != nil {
		response.Error(c, err)
		return
	}
	response.OK(c, cards)
}

// TrackEvent POST /public/properties/:slug/events (API.md §7.4).
func (h *Handler) TrackEvent(c *gin.Context) {
	slug := c.Param("slug")
	var req PublicEventRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, validation.FromBindError(err))
		return
	}
	if err := h.svc.TrackPublicEvent(c.Request.Context(), slug, req.Type); err != nil {
		response.Error(c, err)
		return
	}
	c.Status(http.StatusAccepted)
}

// --- Dashboard Handlers (API.md §12) ---

// ListDashboard GET /properties (API.md §12.1).
func (h *Handler) ListDashboard(c *gin.Context) {
	principal := middleware.CurrentPrincipal(c)
	var q DashboardListQuery
	if err := c.ShouldBindQuery(&q); err != nil {
		response.Error(c, validation.FromBindError(err))
		return
	}
	p := pagination.Parse(c, pagination.DashboardDefault, pagination.DashboardMax)
	items, meta, err := h.svc.ListDashboard(c.Request.Context(), principal, q, p)
	if err != nil {
		response.Error(c, err)
		return
	}
	response.Paginated(c, items, meta)
}

// Create POST /properties (API.md §12.2).
func (h *Handler) Create(c *gin.Context) {
	principal := middleware.CurrentPrincipal(c)
	var req CreatePropertyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, validation.FromBindError(err))
		return
	}
	detail, err := h.svc.Create(c.Request.Context(), principal, req)
	if err != nil {
		response.Error(c, err)
		return
	}
	response.Created(c, detail)
}

// GetDetail GET /properties/:id (API.md §12.3).
func (h *Handler) GetDetail(c *gin.Context) {
	principal := middleware.CurrentPrincipal(c)
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, apperror.NotFound("Listing tidak ditemukan"))
		return
	}
	detail, err := h.svc.GetDetail(c.Request.Context(), principal, id)
	if err != nil {
		response.Error(c, err)
		return
	}
	response.OK(c, detail)
}

// Update PATCH /properties/:id (API.md §12.4).
func (h *Handler) Update(c *gin.Context) {
	principal := middleware.CurrentPrincipal(c)
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, apperror.NotFound("Listing tidak ditemukan"))
		return
	}
	var req UpdatePropertyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, validation.FromBindError(err))
		return
	}
	detail, err := h.svc.Update(c.Request.Context(), principal, id, req)
	if err != nil {
		response.Error(c, err)
		return
	}
	response.OK(c, detail)
}

// UpdateStatus PATCH /properties/:id/status (API.md §12.6).
func (h *Handler) UpdateStatus(c *gin.Context) {
	principal := middleware.CurrentPrincipal(c)
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, apperror.NotFound("Listing tidak ditemukan"))
		return
	}
	var req UpdateStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, validation.FromBindError(err))
		return
	}
	detail, err := h.svc.UpdateStatus(c.Request.Context(), principal, id, req.Status)
	if err != nil {
		response.Error(c, err)
		return
	}
	response.OK(c, detail)
}

// Delete DELETE /properties/:id (API.md §12.5).
func (h *Handler) Delete(c *gin.Context) {
	principal := middleware.CurrentPrincipal(c)
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, apperror.NotFound("Listing tidak ditemukan"))
		return
	}
	if err := h.svc.Delete(c.Request.Context(), principal, id); err != nil {
		response.Error(c, err)
		return
	}
	c.Status(http.StatusNoContent)
}

// UploadImages POST /properties/:id/images (API.md §12.7).
func (h *Handler) UploadImages(c *gin.Context) {
	principal := middleware.CurrentPrincipal(c)
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, apperror.NotFound("Listing tidak ditemukan"))
		return
	}
	form, err := c.MultipartForm()
	if err != nil {
		response.Error(c, apperror.Validation(apperror.FieldError{
			Field: "files", Code: "required", Message: "Form multipart tidak valid",
		}))
		return
	}
	files := form.File["files"]
	if len(files) == 0 {
		response.Error(c, apperror.Validation(apperror.FieldError{
			Field: "files", Code: "required", Message: "Minimal 1 foto",
		}))
		return
	}
	if len(files) > 20 {
		response.Error(c, apperror.New(http.StatusUnprocessableEntity, "IMAGE_LIMIT_EXCEEDED", "Maksimal 20 foto per request"))
		return
	}

	result, err := h.svc.UploadImages(c.Request.Context(), principal, id, files)
	if err != nil {
		response.Error(c, err)
		return
	}
	response.Created(c, result)
}

// ReorderImages PATCH /properties/:id/images (API.md §12.8).
func (h *Handler) ReorderImages(c *gin.Context) {
	principal := middleware.CurrentPrincipal(c)
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, apperror.NotFound("Listing tidak ditemukan"))
		return
	}
	var req ReorderImagesRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, validation.FromBindError(err))
		return
	}
	images, err := h.svc.ReorderImages(c.Request.Context(), principal, id, req)
	if err != nil {
		response.Error(c, err)
		return
	}
	response.OK(c, images)
}

// DeleteImage DELETE /properties/:id/images/:image_id (API.md §12.9).
func (h *Handler) DeleteImage(c *gin.Context) {
	principal := middleware.CurrentPrincipal(c)
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, apperror.NotFound("Listing tidak ditemukan"))
		return
	}
	imageID, err := uuid.Parse(c.Param("image_id"))
	if err != nil {
		response.Error(c, apperror.NotFound("Foto tidak ditemukan"))
		return
	}
	if err := h.svc.DeleteImage(c.Request.Context(), principal, id, imageID); err != nil {
		response.Error(c, err)
		return
	}
	c.Status(http.StatusNoContent)
}
