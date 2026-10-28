package middleware

import (
	"math"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"golang.org/x/time/rate"

	"github.com/bidtech-solutions/masterpro/backend/internal/pkg/apperror"
	"github.com/bidtech-solutions/masterpro/backend/internal/pkg/response"
)

// Limiter adalah rate limiter token-bucket per kunci, in-memory (cukup untuk satu instance
// backend; PRD §10). Entri yang tidak dipakai > 10 menit dibersihkan otomatis.
type Limiter struct {
	mu      sync.Mutex
	entries map[string]*limiterEntry
	limit   rate.Limit
	burst   int
}

type limiterEntry struct {
	lim  *rate.Limiter
	seen time.Time
}

// NewLimiter membuat limiter `events` per `per` dengan burst.
func NewLimiter(events int, per time.Duration, burst int) *Limiter {
	l := &Limiter{
		entries: make(map[string]*limiterEntry),
		limit:   rate.Every(per / time.Duration(events)),
		burst:   burst,
	}
	go l.cleanup()
	return l
}

// Allow mengembalikan (diizinkan, detik tunggu bila ditolak).
func (l *Limiter) Allow(key string) (bool, int) {
	l.mu.Lock()
	e, ok := l.entries[key]
	if !ok {
		e = &limiterEntry{lim: rate.NewLimiter(l.limit, l.burst)}
		l.entries[key] = e
	}
	e.seen = time.Now()
	l.mu.Unlock()

	r := e.lim.Reserve()
	if d := r.Delay(); d > 0 {
		r.Cancel()
		return false, int(math.Ceil(d.Seconds()))
	}
	return true, 0
}

func (l *Limiter) cleanup() {
	t := time.NewTicker(time.Minute)
	defer t.Stop()
	for range t.C {
		l.mu.Lock()
		for k, e := range l.entries {
			if time.Since(e.seen) > 10*time.Minute {
				delete(l.entries, k)
			}
		}
		l.mu.Unlock()
	}
}

// RateLimitByIP memasang limiter per IP klien.
func RateLimitByIP(l *Limiter) gin.HandlerFunc {
	return func(c *gin.Context) {
		if ok, wait := l.Allow(c.ClientIP()); !ok {
			response.Error(c, apperror.RateLimited(wait))
			return
		}
		c.Next()
	}
}

// RateLimitByUser memasang limiter per user login (fallback IP).
func RateLimitByUser(l *Limiter) gin.HandlerFunc {
	return func(c *gin.Context) {
		key := c.GetString(ctxUserID)
		if key == "" {
			key = c.ClientIP()
		}
		if ok, wait := l.Allow(key); !ok {
			response.Error(c, apperror.RateLimited(wait))
			return
		}
		c.Next()
	}
}
