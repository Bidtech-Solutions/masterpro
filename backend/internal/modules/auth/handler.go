package auth

import (
	"errors"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/bidtech-solutions/masterpro/backend/internal/http/middleware"
	"github.com/bidtech-solutions/masterpro/backend/internal/modules/user"
	"github.com/bidtech-solutions/masterpro/backend/internal/pkg/apperror"
	"github.com/bidtech-solutions/masterpro/backend/internal/pkg/response"
	"github.com/bidtech-solutions/masterpro/backend/internal/pkg/validation"
)

const refreshCookiePath = "/api/v1/auth"

// Handler HTTP modul auth.
type Handler struct {
	svc          Service
	mediaURL     string
	cookieSecure bool
	loginLimiter *middleware.Limiter // 5/menit per IP+email (AUTH-04)
}

// NewHandler membuat handler.
func NewHandler(svc Service, mediaURL string, cookieSecure bool) *Handler {
	return &Handler{
		svc:          svc,
		mediaURL:     mediaURL,
		cookieSecure: cookieSecure,
		loginLimiter: middleware.NewLimiter(5, time.Minute, 5),
	}
}

// Login POST /auth/login.
func (h *Handler) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, validation.FromBindError(err))
		return
	}
	if ok, wait := h.loginLimiter.Allow(c.ClientIP() + "|" + strings.ToLower(req.Email)); !ok {
		response.Error(c, apperror.RateLimited(wait))
		return
	}
	sess, u, err := h.svc.Login(c.Request.Context(), req.Email, req.Password, meta(c))
	if err != nil {
		response.Error(c, err)
		return
	}
	h.setCookies(c, sess)
	response.OK(c, LoginResponse{User: user.ToResponse(u, h.mediaURL), AccessExpiresAt: sess.AccessExpiresAt})
}

// Refresh POST /auth/refresh.
func (h *Handler) Refresh(c *gin.Context) {
	raw, _ := c.Cookie(middleware.CookieRefresh)
	sess, err := h.svc.Refresh(c.Request.Context(), raw, meta(c))
	if err != nil {
		if !errors.Is(err, ErrRefreshRace) {
			h.clearCookies(c)
		}
		response.Error(c, err)
		return
	}
	h.setCookies(c, sess)
	response.OK(c, RefreshResponse{AccessExpiresAt: sess.AccessExpiresAt})
}

// Logout POST /auth/logout.
func (h *Handler) Logout(c *gin.Context) {
	if err := h.svc.Logout(c.Request.Context(), middleware.CurrentPrincipal(c).SessionID); err != nil {
		response.Error(c, err)
		return
	}
	h.clearCookies(c)
	response.NoContent(c)
}

// Me GET /auth/me.
func (h *Handler) Me(c *gin.Context) {
	u, err := h.svc.Me(c.Request.Context(), middleware.CurrentPrincipal(c).UserID)
	if err != nil {
		response.Error(c, err)
		return
	}
	response.OK(c, user.ToResponse(u, h.mediaURL))
}

func (h *Handler) setCookies(c *gin.Context, s *Session) {
	c.SetSameSite(http.SameSiteLaxMode)
	c.SetCookie(middleware.CookieAccess, s.AccessToken, maxAge(s.AccessExpiresAt), "/", "", h.cookieSecure, true)
	c.SetCookie(middleware.CookieRefresh, s.RefreshToken, maxAge(s.RefreshExpiresAt), refreshCookiePath, "", h.cookieSecure, true)
}

func (h *Handler) clearCookies(c *gin.Context) {
	c.SetSameSite(http.SameSiteLaxMode)
	c.SetCookie(middleware.CookieAccess, "", -1, "/", "", h.cookieSecure, true)
	c.SetCookie(middleware.CookieRefresh, "", -1, refreshCookiePath, "", h.cookieSecure, true)
}

func maxAge(exp time.Time) int { return int(time.Until(exp).Seconds()) }

func meta(c *gin.Context) ClientMeta {
	return ClientMeta{IP: c.ClientIP(), UserAgent: c.Request.UserAgent()}
}
