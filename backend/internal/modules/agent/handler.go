package agent

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"github.com/bidtech-solutions/masterpro/backend/internal/pkg/apperror"
	"github.com/bidtech-solutions/masterpro/backend/internal/pkg/pagination"
	"github.com/bidtech-solutions/masterpro/backend/internal/pkg/response"
)

type Handler struct {
	service Service
}

func NewHandler(service Service) *Handler {
	return &Handler{service: service}
}

// List godoc (GET /api/v1/agents)
func (h *Handler) List(c *gin.Context) {
	p := pagination.Parse(c, pagination.DashboardDefault, pagination.DashboardMax)
	f := ListFilter{
		Query:  c.Query("q"),
		Status: c.Query("status"),
		Sort:   c.Query("sort"),
	}

	agents, meta, err := h.service.List(c.Request.Context(), f, p)
	if err != nil {
		response.Error(c, err)
		return
	}

	response.Paginated(c, agents, meta)
}

// ListOptions godoc (GET /api/v1/agents/options)
func (h *Handler) ListOptions(c *gin.Context) {
	query := c.Query("q")
	status := c.Query("status")

	options, err := h.service.ListOptions(c.Request.Context(), query, status)
	if err != nil {
		response.Error(c, err)
		return
	}

	response.OK(c, options)
}

// Create godoc (POST /api/v1/agents)
func (h *Handler) Create(c *gin.Context) {
	var req CreateAgentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, apperror.BadRequest("Data pendaftaran agen tidak valid: "+err.Error()))
		return
	}

	ag, err := h.service.Create(c.Request.Context(), req)
	if err != nil {
		response.Error(c, err)
		return
	}

	response.Created(c, ag)
}

// GetByID godoc (GET /api/v1/agents/:id)
func (h *Handler) GetByID(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, apperror.NotFound("Agen"))
		return
	}

	ag, err := h.service.GetByID(c.Request.Context(), id)
	if err != nil {
		response.Error(c, err)
		return
	}

	response.OK(c, ag)
}

// Update godoc (PATCH /api/v1/agents/:id)
func (h *Handler) Update(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, apperror.NotFound("Agen"))
		return
	}

	var req UpdateAgentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, apperror.BadRequest("Format pembaruan data tidak valid: "+err.Error()))
		return
	}

	ag, err := h.service.Update(c.Request.Context(), id, req)
	if err != nil {
		response.Error(c, err)
		return
	}

	response.OK(c, ag)
}

// UploadPhoto godoc (POST /api/v1/agents/:id/photo)
func (h *Handler) UploadPhoto(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, apperror.NotFound("Agen"))
		return
	}

	fh, err := c.FormFile("file")
	if err != nil {
		response.Error(c, apperror.BadRequest("Berkas foto wajib diunggah"))
		return
	}

	// Maks 5 MB
	if fh.Size > 5*1024*1024 {
		response.Error(c, apperror.New(http.StatusRequestEntityTooLarge, apperror.CodePayloadTooLarge, "Ukuran berkas melebihi batas 5 MB"))
		return
	}

	f, err := fh.Open()
	if err != nil {
		response.Error(c, apperror.Internal(err))
		return
	}
	defer func() { _ = f.Close() }()

	ct := fh.Header.Get("Content-Type")
	if !strings.HasPrefix(ct, "image/") {
		response.Error(c, apperror.New(http.StatusUnsupportedMediaType, apperror.CodeUnsupportedMediaType, "Hanya format foto (JPG, PNG, WebP) yang didukung"))
		return
	}

	ag, err := h.service.UploadPhoto(c.Request.Context(), id, f, fh.Filename, fh.Size, ct)
	if err != nil {
		response.Error(c, err)
		return
	}

	response.OK(c, ag)
}
