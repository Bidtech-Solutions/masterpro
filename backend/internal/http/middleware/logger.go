package middleware

import (
	"log/slog"
	"time"

	"github.com/gin-gonic/gin"
)

// Logger mencatat setiap request sebagai log JSON. Query string, header, dan body tidak dicatat
// agar password/token tidak bocor ke log.
func Logger() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		c.Next()
		status := c.Writer.Status()
		level := slog.LevelInfo
		switch {
		case status >= 500:
			level = slog.LevelError
		case status >= 400:
			level = slog.LevelWarn
		}
		slog.Log(c.Request.Context(), level, "http request",
			"request_id", c.GetString("request_id"),
			"method", c.Request.Method,
			"path", c.FullPath(),
			"status", status,
			"latency_ms", time.Since(start).Milliseconds(),
			"ip", c.ClientIP(),
			"user_id", c.GetString(ctxUserID),
		)
	}
}
