package reference

import "github.com/gin-gonic/gin"

// RegisterRoutes mendaftarkan endpoint referensi di bawah grup /public.
func RegisterRoutes(public *gin.RouterGroup, h *Handler) {
	public.GET("/property-types", h.PropertyTypes)
	public.GET("/facilities", h.Facilities)
	public.GET("/locations/provinces", h.Provinces)
	public.GET("/locations/cities", h.Cities)
}
