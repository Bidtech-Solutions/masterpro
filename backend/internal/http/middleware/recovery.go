package middleware

import (
	"log/slog"

	"github.com/gin-gonic/gin"

	"github.com/bidtech-solutions/masterpro/backend/internal/pkg/apperror"
	"github.com/bidtech-solutions/masterpro/backend/internal/pkg/response"
)

// Recovery mengubah panic menjadi INTERNAL_ERROR.
func Recovery() gin.HandlerFunc {
	return gin.CustomRecovery(func(c *gin.Context, rec any) {
		slog.ErrorContext(c.Request.Context(), "panic", "request_id", c.GetString("request_id"), "panic", rec)
		response.Error(c, apperror.Internal(nil))
	})
}
