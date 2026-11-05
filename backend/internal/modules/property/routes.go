package property

import "github.com/gin-gonic/gin"

// RegisterPublicRoutes mendaftarkan endpoint listing publik di bawah grup /public.
func RegisterPublicRoutes(public *gin.RouterGroup, h *Handler) {
	public.GET("/properties", h.ListPublic)
	public.GET("/properties/:slug", h.GetPublic)
	public.GET("/properties/:slug/similar", h.ListSimilar)
	// TODO(API.md §7.4, §7.9): /events, /sitemap/properties
}

// RegisterDashboardRoutes mendaftarkan endpoint CRUD properti dashboard (API.md §12).
func RegisterDashboardRoutes(dash *gin.RouterGroup, admin *gin.RouterGroup, h *Handler) {
	dash.GET("/properties", h.ListDashboard)
	dash.POST("/properties", h.Create)
	dash.GET("/properties/:id", h.GetDetail)
	dash.PATCH("/properties/:id", h.Update)
	dash.PATCH("/properties/:id/status", h.UpdateStatus)
	dash.POST("/properties/:id/images", h.UploadImages)
	dash.PATCH("/properties/:id/images", h.ReorderImages)
	dash.DELETE("/properties/:id/images/:image_id", h.DeleteImage)

	// Admin-only endpoints
	if admin != nil {
		admin.DELETE("/properties/:id", h.Delete)
	}
}
