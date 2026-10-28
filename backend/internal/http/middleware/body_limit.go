package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"

	"github.com/bidtech-solutions/masterpro/backend/internal/pkg/apperror"
	"github.com/bidtech-solutions/masterpro/backend/internal/pkg/response"
)

// Batas ukuran body (PRD §10.6, API.md §12.7).
const (
	MaxJSONBody      int64 = 1 << 20  // 1 MB
	MaxMultipartBody int64 = 60 << 20 // 60 MB per request upload
)

// BodyLimit membatasi ukuran body: multipart/form-data memakai multipartMax, lainnya jsonMax.
func BodyLimit(jsonMax, multipartMax int64) gin.HandlerFunc {
	return func(c *gin.Context) {
		limit := jsonMax
		if strings.HasPrefix(c.ContentType(), "multipart/") {
			limit = multipartMax
		}
		if c.Request.ContentLength > limit {
			response.Error(c, apperror.New(http.StatusRequestEntityTooLarge, apperror.CodePayloadTooLarge, "Ukuran data terlalu besar"))
			return
		}
		c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, limit)
		c.Next()
	}
}
