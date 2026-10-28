package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"

	"github.com/bidtech-solutions/masterpro/backend/internal/pkg/apperror"
	"github.com/bidtech-solutions/masterpro/backend/internal/pkg/response"
)

// Path dalam `skip` (prefix) dikecualikan.
func CSRF(skip ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		switch c.Request.Method {
		case http.MethodGet, http.MethodHead, http.MethodOptions:
			c.Next()
			return
		}
		for _, p := range skip {
			if strings.HasPrefix(c.Request.URL.Path, p) {
				c.Next()
				return
			}
		}
		if c.GetHeader("X-Requested-With") != "XMLHttpRequest" {
			response.Error(c, apperror.New(http.StatusForbidden, apperror.CodeCSRFHeaderMissing, "Header X-Requested-With wajib ada"))
			return
		}
		c.Next()
	}
}
