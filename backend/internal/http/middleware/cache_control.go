package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// NoStore menandai respons dashboard agar tidak di-cache (API.md §1).
func NoStore() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("Cache-Control", "no-store")
		c.Next()
	}
}

// PublicCache untuk GET /public/* (API.md §1).
func PublicCache() gin.HandlerFunc {
	return func(c *gin.Context) {
		if c.Request.Method == http.MethodGet {
			c.Header("Cache-Control", "public, max-age=60, stale-while-revalidate=300")
		} else {
			c.Header("Cache-Control", "no-store")
		}
		c.Next()
	}
}
