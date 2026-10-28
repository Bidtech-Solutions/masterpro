package property

import "github.com/gin-gonic/gin"

// RegisterPublicRoutes mendaftarkan endpoint listing publik di bawah grup /public.
func RegisterPublicRoutes(public *gin.RouterGroup, h *Handler) {
	public.GET("/properties", h.ListPublic)
	// TODO(API.md §7.2–7.4, §7.9): /properties/{slug}, /similar, /events, /sitemap/properties
}
