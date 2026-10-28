// Package config memuat dan memvalidasi environment variable backend (PRD §14).
package config

import (
	"errors"
	"fmt"
	"net/url"
	"os"
	"strconv"
	"strings"
	"time"
)

// Config adalah seluruh konfigurasi runtime backend.
type Config struct {
	Env      string // development | production
	Port     int
	LogLevel string

	DB            DB
	RunMigrations bool

	JWTSecret     string
	AccessTTL     time.Duration
	RefreshTTL    time.Duration
	CookieSecure  bool
	CORSOrigins   []string
	TrustedPlatfm string // "" | "cloudflare"

	S3 S3

	MediaPublicURL      string
	FrontendInternalURL string
	RevalidateSecret    string
}

// DB konfigurasi PostgreSQL.
type DB struct {
	Host, Name, User, Password, SSLMode string
	Port                                int
}

// DSN untuk driver pgx / GORM.
func (d DB) DSN() string {
	u := url.URL{
		Scheme:   "postgres",
		User:     url.UserPassword(d.User, d.Password),
		Host:     fmt.Sprintf("%s:%d", d.Host, d.Port),
		Path:     d.Name,
		RawQuery: "sslmode=" + url.QueryEscape(d.SSLMode) + "&TimeZone=UTC",
	}
	return u.String()
}

// S3 konfigurasi RustFS (S3-compatible).
type S3 struct {
	Endpoint, AccessKey, SecretKey, Bucket, Region string
	UseSSL                                         bool
}

// IsProduction true bila APP_ENV=production.
func (c Config) IsProduction() bool { return c.Env == "production" }

// Load membaca env. Mengumpulkan semua error agar mudah diperbaiki sekaligus.
func Load() (Config, error) {
	r := &reader{}
	c := Config{
		Env:      r.str("APP_ENV", "development"),
		Port:     r.int("APP_PORT", 8080),
		LogLevel: r.str("LOG_LEVEL", "info"),
		DB: DB{
			Host:     r.str("DB_HOST", "postgres"),
			Port:     r.int("DB_PORT", 5432),
			Name:     r.required("DB_NAME"),
			User:     r.required("DB_USER"),
			Password: r.required("DB_PASSWORD"),
			SSLMode:  r.str("DB_SSLMODE", "disable"),
		},
		RunMigrations:       r.bool("RUN_MIGRATIONS", true),
		JWTSecret:           r.required("JWT_SECRET"),
		AccessTTL:           r.duration("JWT_ACCESS_TTL", 15*time.Minute),
		RefreshTTL:          r.duration("JWT_REFRESH_TTL", 168*time.Hour),
		CookieSecure:        r.bool("COOKIE_SECURE", false),
		CORSOrigins:         r.list("CORS_ALLOWED_ORIGINS"),
		TrustedPlatfm:       r.str("TRUSTED_PLATFORM", ""),
		MediaPublicURL:      strings.TrimRight(r.required("MEDIA_PUBLIC_URL"), "/"),
		FrontendInternalURL: strings.TrimRight(r.str("FRONTEND_INTERNAL_URL", "http://frontend:3000"), "/"),
		RevalidateSecret:    r.required("REVALIDATE_SECRET"),
		S3: S3{
			Endpoint:  r.str("S3_ENDPOINT", "rustfs:9000"),
			AccessKey: r.required("S3_ACCESS_KEY"),
			SecretKey: r.required("S3_SECRET_KEY"),
			Bucket:    r.str("S3_BUCKET", "masterpro-media"),
			Region:    r.str("S3_REGION", "us-east-1"),
			UseSSL:    r.bool("S3_USE_SSL", false),
		},
	}
	if c.Env != "development" && c.Env != "production" {
		r.errs = append(r.errs, "APP_ENV harus development atau production")
	}
	if c.IsProduction() {
		if len(c.JWTSecret) < 64 {
			r.errs = append(r.errs, "JWT_SECRET minimal 64 karakter di produksi")
		}
		if !c.CookieSecure {
			r.errs = append(r.errs, "COOKIE_SECURE wajib true di produksi")
		}
	} else if len(c.JWTSecret) < 32 {
		r.errs = append(r.errs, "JWT_SECRET minimal 32 karakter")
	}
	if c.TrustedPlatfm != "" && c.TrustedPlatfm != "cloudflare" {
		r.errs = append(r.errs, "TRUSTED_PLATFORM hanya boleh kosong atau cloudflare")
	}
	if len(r.errs) > 0 {
		return Config{}, errors.New("konfigurasi tidak valid:\n  - " + strings.Join(r.errs, "\n  - "))
	}
	return c, nil
}

type reader struct{ errs []string }

func (r *reader) str(key, def string) string {
	if v, ok := os.LookupEnv(key); ok && strings.TrimSpace(v) != "" {
		return strings.TrimSpace(v)
	}
	return def
}

func (r *reader) required(key string) string {
	v := r.str(key, "")
	if v == "" {
		r.errs = append(r.errs, key+" wajib diisi")
	}
	return v
}

func (r *reader) int(key string, def int) int {
	v := r.str(key, "")
	if v == "" {
		return def
	}
	n, err := strconv.Atoi(v)
	if err != nil {
		r.errs = append(r.errs, key+" harus angka")
	}
	return n
}

func (r *reader) bool(key string, def bool) bool {
	v := r.str(key, "")
	if v == "" {
		return def
	}
	b, err := strconv.ParseBool(v)
	if err != nil {
		r.errs = append(r.errs, key+" harus true/false")
	}
	return b
}

func (r *reader) duration(key string, def time.Duration) time.Duration {
	v := r.str(key, "")
	if v == "" {
		return def
	}
	d, err := time.ParseDuration(v)
	if err != nil {
		r.errs = append(r.errs, key+" harus durasi Go, mis. 15m atau 168h")
	}
	return d
}

func (r *reader) list(key string) []string {
	var out []string
	for _, p := range strings.Split(r.str(key, ""), ",") {
		if p = strings.TrimSpace(p); p != "" {
			out = append(out, p)
		}
	}
	return out
}
