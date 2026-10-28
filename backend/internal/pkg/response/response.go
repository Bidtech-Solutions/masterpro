// Package response menulis envelope JSON standar (docs/API.md §3).
package response

import (
	"log/slog"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"github.com/bidtech-solutions/masterpro/backend/internal/pkg/apperror"
	"github.com/bidtech-solutions/masterpro/backend/internal/pkg/pagination"
)

type envelope struct {
	Success bool             `json:"success"`
	Data    any              `json:"data,omitempty"`
	Meta    *pagination.Meta `json:"meta,omitempty"`
	Error   *apperror.Error  `json:"error,omitempty"`
}

// OK menulis 200 dengan data.
func OK(c *gin.Context, data any) {
	c.JSON(http.StatusOK, envelope{Success: true, Data: data})
}

// Created menulis 201 dengan data.
func Created(c *gin.Context, data any) {
	c.JSON(http.StatusCreated, envelope{Success: true, Data: data})
}

// Paginated menulis 200 dengan data dan meta paginasi.
func Paginated(c *gin.Context, data any, meta pagination.Meta) {
	c.JSON(http.StatusOK, envelope{Success: true, Data: data, Meta: &meta})
}

// NoContent menulis 204 tanpa body.
func NoContent(c *gin.Context) { c.Status(http.StatusNoContent) }

// Accepted menulis 202 tanpa body.
func Accepted(c *gin.Context) { c.Status(http.StatusAccepted) }

// Error menulis error. Error non-apperror dicatat di log dan dikembalikan sebagai INTERNAL_ERROR.
func Error(c *gin.Context, err error) {
	appErr, ok := apperror.As(err)
	if !ok {
		appErr = apperror.Internal(err)
	}
	if appErr.Status >= http.StatusInternalServerError {
		slog.ErrorContext(c.Request.Context(), "request failed",
			"request_id", c.GetString("request_id"),
			"code", appErr.Code,
			"error", appErr.Error(),
		)
	}
	if appErr.RetryAfter > 0 {
		c.Header("Retry-After", strconv.Itoa(appErr.RetryAfter))
	}
	c.AbortWithStatusJSON(appErr.Status, envelope{Success: false, Error: appErr})
}
