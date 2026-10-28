// Package http merakit router Gin untuk seluruh API /api/v1 (docs/API.md §5).
package http

import (
	"context"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"github.com/bidtech-solutions/masterpro/backend/internal/config"
	"github.com/bidtech-solutions/masterpro/backend/internal/database"
	"github.com/bidtech-solutions/masterpro/backend/internal/http/middleware"
	"github.com/bidtech-solutions/masterpro/backend/internal/modules/auth"
	"github.com/bidtech-solutions/masterpro/backend/internal/modules/property"
	"github.com/bidtech-solutions/masterpro/backend/internal/modules/reference"
	"github.com/bidtech-solutions/masterpro/backend/internal/pkg/apperror"
	"github.com/bidtech-solutions/masterpro/backend/internal/pkg/response"
	"github.com/bidtech-solutions/masterpro/backend/internal/pkg/security"
	"github.com/bidtech-solutions/masterpro/backend/internal/storage"
)

// Deps dependensi yang dibutuhkan router.
type Deps struct {
	Config  config.Config
	DB      *gorm.DB
	Storage *storage.Client
	Tokens  *security.TokenIssuer
	Version string
}

// privateNetworks: jaringan Docker/Traefik yang dipercaya untuk header X-Forwarded-For.
var privateNetworks = []string{"127.0.0.1/32", "10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16", "::1/128"}

// NewRouter membuat engine Gin lengkap dengan middleware dan seluruh route.
func NewRouter(d Deps) (*gin.Engine, error) {
	if d.Config.IsProduction() {
		gin.SetMode(gin.ReleaseMode)
	}
	r := gin.New()
	if err := r.SetTrustedProxies(privateNetworks); err != nil {
		return nil, err
	}
	if d.Config.TrustedPlatfm == "cloudflare" {
		r.TrustedPlatform = gin.PlatformCloudflare
	}
	r.HandleMethodNotAllowed = true
	r.Use(
		middleware.RequestID(),
		middleware.Logger(),
		middleware.Recovery(),
		middleware.CORS(d.Config.CORSOrigins),
		middleware.BodyLimit(middleware.MaxJSONBody, middleware.MaxMultipartBody),
	)
	r.NoRoute(func(c *gin.Context) { response.Error(c, apperror.NotFound("Endpoint")) })
	r.NoMethod(func(c *gin.Context) {
		response.Error(c, apperror.New(http.StatusMethodNotAllowed, apperror.CodeBadRequest, "Metode tidak didukung"))
	})

	v1 := r.Group("/api/v1", middleware.CSRF("/api/v1/public/", "/api/v1/auth/login"))
	v1.GET("/health", healthHandler(d))

	// --- Modul ---
	authRepo := auth.NewRepository(d.DB)
	authed := middleware.Auth(d.Tokens, authRepo)

	public := v1.Group("/public", middleware.PublicCache())
	reference.RegisterRoutes(public, reference.NewHandler(reference.NewService(reference.NewRepository(d.DB))))
	property.RegisterPublicRoutes(public, property.NewHandler(property.NewService(property.NewRepository(d.DB, d.Config.MediaPublicURL))))

	auth.RegisterRoutes(v1,
		auth.NewHandler(auth.NewService(authRepo, d.Tokens, d.Config.RefreshTTL), d.Config.MediaPublicURL, d.Config.CookieSecure),
		authed,
	)

	// Grup dashboard untuk modul berikutnya (account, user, agent, property, report, dashboard):
	//   dash := v1.Group("", authed, middleware.NoStore())
	//   admin := dash.Group("", middleware.RequireRole(models.RoleAdmin))
	// Daftarkan route-nya di sini sesuai docs/API.md §5.

	return r, nil
}

type healthData struct {
	Status   string `json:"status"`
	Database string `json:"database"`
	Storage  string `json:"storage"`
	Version  string `json:"version"`
}

// healthHandler GET /api/v1/health (API.md §6).
func healthHandler(d Deps) gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx, cancel := context.WithTimeout(c.Request.Context(), 2*time.Second)
		defer cancel()
		c.Header("Cache-Control", "no-store")
		if err := database.Ping(ctx, d.DB); err != nil {
			response.Error(c, apperror.Unavailable("Database tidak tersedia", err))
			return
		}
		if err := d.Storage.Ping(ctx); err != nil {
			response.Error(c, apperror.Unavailable("Storage tidak tersedia", err))
			return
		}
		response.OK(c, healthData{Status: "ok", Database: "ok", Storage: "ok", Version: d.Version})
	}
}
