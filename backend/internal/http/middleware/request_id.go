// Package middleware berisi middleware HTTP Gin: request id, logging, recovery, CORS, CSRF,
// autentikasi, otorisasi peran, rate limit, dan batas ukuran body.
package middleware

import (
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

const headerRequestID = "X-Request-ID"

// RequestID meneruskan atau membuat X-Request-ID.
func RequestID() gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.GetHeader(headerRequestID)
		if id == "" || len(id) > 64 {
			id = uuid.NewString()
		}
		c.Set("request_id", id)
		c.Header(headerRequestID, id)
		c.Next()
	}
}
