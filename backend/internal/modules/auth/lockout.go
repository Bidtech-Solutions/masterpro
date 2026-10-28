package auth

import (
	"strings"
	"sync"
	"time"
)

// lockout mengunci email sementara setelah terlalu banyak login gagal (AUTH-04):
// `limit` kegagalan dalam `window` → terkunci selama `duration`. In-memory, satu instance.
type lockout struct {
	mu       sync.Mutex
	limit    int
	window   time.Duration
	duration time.Duration
	entries  map[string]*lockEntry
	now      func() time.Time
}

type lockEntry struct {
	failures    []time.Time
	lockedUntil time.Time
}

func newLockout(limit int, window, duration time.Duration) *lockout {
	return &lockout{limit: limit, window: window, duration: duration, entries: map[string]*lockEntry{}, now: time.Now}
}

func key(email string) string { return strings.ToLower(strings.TrimSpace(email)) }

// lockedFor mengembalikan sisa waktu kunci (0 = tidak terkunci).
func (l *lockout) lockedFor(email string) time.Duration {
	l.mu.Lock()
	defer l.mu.Unlock()
	if e, ok := l.entries[key(email)]; ok {
		if d := e.lockedUntil.Sub(l.now()); d > 0 {
			return d
		}
	}
	return 0
}

func (l *lockout) fail(email string) {
	l.mu.Lock()
	defer l.mu.Unlock()
	now := l.now()
	k := key(email)
	e, ok := l.entries[k]
	if !ok {
		e = &lockEntry{}
		l.entries[k] = e
	}
	kept := e.failures[:0]
	for _, t := range e.failures {
		if now.Sub(t) < l.window {
			kept = append(kept, t)
		}
	}
	e.failures = append(kept, now)
	if len(e.failures) >= l.limit {
		e.lockedUntil = now.Add(l.duration)
		e.failures = nil
	}
	// pembersihan oportunistik agar map tidak tumbuh tanpa batas
	if len(l.entries) > 10000 {
		for k2, e2 := range l.entries {
			if len(e2.failures) == 0 && now.After(e2.lockedUntil) {
				delete(l.entries, k2)
			}
		}
	}
}

func (l *lockout) reset(email string) {
	l.mu.Lock()
	defer l.mu.Unlock()
	delete(l.entries, key(email))
}
