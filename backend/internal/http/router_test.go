package http

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/google/uuid"

	"github.com/bidtech-solutions/masterpro/backend/internal/config"
	"github.com/bidtech-solutions/masterpro/backend/internal/models"
	"github.com/bidtech-solutions/masterpro/backend/internal/pkg/security"
	"github.com/bidtech-solutions/masterpro/backend/internal/pkg/validation"
	"github.com/bidtech-solutions/masterpro/backend/internal/storage"
	"github.com/bidtech-solutions/masterpro/backend/internal/testutil"
)

// TestAPIIntegration menguji migrasi, endpoint referensi, dan alur auth end-to-end terhadap Postgres.
func TestAPIIntegration(t *testing.T) {
	db := testutil.FreshDB(t)
	if err := validation.Setup(); err != nil {
		t.Fatal(err)
	}

	var provinces, cities int64
	db.Table("provinces").Count(&provinces)
	db.Table("cities").Count(&cities)
	if provinces != 38 || cities != 514 {
		t.Fatalf("data wilayah: %d provinsi, %d kota", provinces, cities)
	}

	hash, _ := security.HashPassword("Rahasia123")
	now := time.Now().UTC()
	admin := models.User{ID: uuid.Must(uuid.NewV7()), Name: "Admin", Email: "admin@masterpro.co.id", PasswordHash: hash,
		Role: models.RoleAdmin, Status: models.UserActive, PasswordChangedAt: now, CreatedAt: now, UpdatedAt: now}
	if err := db.Create(&admin).Error; err != nil {
		t.Fatal(err)
	}

	store, _ := storage.New(storage.Config{Endpoint: "127.0.0.1:1", AccessKey: "x", SecretKey: "x", Bucket: "b", PublicURL: "http://media.localhost"})
	tokens, _ := security.NewTokenIssuer(strings.Repeat("s", 32), 15*time.Minute)
	cfg := config.Config{Env: "development", RefreshTTL: 168 * time.Hour, MediaPublicURL: "http://media.localhost"}
	r, err := NewRouter(Deps{Config: cfg, DB: db, Storage: store, Tokens: tokens, Version: "test"})
	if err != nil {
		t.Fatal(err)
	}

	do := func(method, path, body string, cookies []*http.Cookie, csrf bool) *httptest.ResponseRecorder {
		req := httptest.NewRequest(method, path, strings.NewReader(body))
		if body != "" {
			req.Header.Set("Content-Type", "application/json")
		}
		if csrf {
			req.Header.Set("X-Requested-With", "XMLHttpRequest")
		}
		for _, c := range cookies {
			req.AddCookie(c)
		}
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)
		return w
	}
	expect := func(w *httptest.ResponseRecorder, status int, contains string) {
		t.Helper()
		if w.Code != status || !strings.Contains(w.Body.String(), contains) {
			t.Fatalf("ingin %d berisi %q, dapat %d: %s", status, contains, w.Code, w.Body.String())
		}
	}

	t.Run("referensi publik", func(t *testing.T) {
		expect(do("GET", "/api/v1/public/locations/cities?q=batam", "", nil, false), 200, `"slug":"kota-batam"`)
		expect(do("GET", "/api/v1/public/locations/cities?q=batam", "", nil, false), 200, `"province":{"id":21,"slug":"kepulauan-riau"`)
		w := do("GET", "/api/v1/public/property-types?listing_type=rent", "", nil, false)
		var body struct{ Data []map[string]any }
		_ = json.Unmarshal(w.Body.Bytes(), &body)
		if w.Code != 200 || len(body.Data) != 3 {
			t.Fatalf("tipe sewa harus 3: %d %s", w.Code, w.Body.String())
		}
		expect(do("GET", "/api/v1/public/property-types?listing_type=x", "", nil, false), 422, "VALIDATION_ERROR")
		expect(do("GET", "/api/v1/tidak-ada", "", nil, false), 404, "NOT_FOUND")
	})

	t.Run("katalog publik", func(t *testing.T) {
		agentUser := models.User{ID: uuid.Must(uuid.NewV7()), Name: "Budi", Email: "budi@x.id", PasswordHash: hash,
			Role: models.RoleAgent, Status: models.UserActive, PasswordChangedAt: now, CreatedAt: now, UpdatedAt: now}
		agent := models.Agent{ID: uuid.Must(uuid.NewV7()), UserID: agentUser.ID, AgentCode: "AG-0001", WhatsappNumber: "6281234567890", CreatedAt: now, UpdatedAt: now}
		if err := db.Create(&agentUser).Error; err != nil {
			t.Fatal(err)
		}
		if err := db.Create(&agent).Error; err != nil {
			t.Fatal(err)
		}
		mk := func(code, title string, status models.PropertyStatus, price int64) {
			area := 120.0
			p := models.Property{ID: uuid.Must(uuid.NewV7()), Code: code, Slug: code, AgentID: agent.ID, CreatedBy: agentUser.ID,
				ListingType: models.ListingSale, MarketType: models.MarketSecondary, PropertyTypeID: 1, Status: status,
				Title: title, Description: "Deskripsi", Price: price, ProvinceID: 21, CityID: 2171, LandArea: &area,
				PublishedAt: &now, CreatedAt: now, UpdatedAt: now}
			if err := db.Omit("Agent", "PropertyType", "Province", "City", "Images", "Facilities").Create(&p).Error; err != nil {
				t.Fatal(err)
			}
		}
		mk("MP-000001", "Rumah Minimalis Batam Centre", models.StatusActive, 1_450_000_000)
		mk("MP-000002", "Rumah Draf", models.StatusDraft, 900_000_000)

		w := do("GET", "/api/v1/public/properties?listing_type=sale&city=kota-batam", "", nil, false)
		expect(w, 200, `"total":1`)
		expect(w, 200, `"agent":{"agent_code":"AG-0001","name":"Budi","whatsapp_number":"6281234567890"}`)
		if !strings.Contains(w.Header().Get("Cache-Control"), "public") {
			t.Fatal("endpoint publik harus Cache-Control public")
		}
		expect(do("GET", "/api/v1/public/properties?q=minimalis", "", nil, false), 200, `"total":1`)
		expect(do("GET", "/api/v1/public/properties?listing_type=rent", "", nil, false), 200, `"total":0`)
		expect(do("GET", "/api/v1/public/properties?min_price=2000000000&max_price=1000", "", nil, false), 422, "min_price")
		expect(do("GET", "/api/v1/public/locations/cities?has_listings=true", "", nil, false), 200, `"active_listing_count":1`)
	})

	t.Run("alur auth", func(t *testing.T) {
		expect(do("POST", "/api/v1/auth/login", `{"email":"admin@masterpro.co.id","password":"salah123"}`, nil, false), 401, "INVALID_CREDENTIALS")
		expect(do("POST", "/api/v1/auth/login", `{"email":"bukan-email"}`, nil, false), 422, `"field":"email"`)

		w := do("POST", "/api/v1/auth/login", `{"email":"ADMIN@masterpro.co.id","password":"Rahasia123"}`, nil, false)
		expect(w, 200, `"role":"admin"`)
		cookies := w.Result().Cookies()
		if len(cookies) != 2 {
			t.Fatalf("harus set 2 cookie, dapat %d", len(cookies))
		}
		for _, c := range cookies {
			if !c.HttpOnly || c.SameSite != http.SameSiteLaxMode {
				t.Fatalf("atribut cookie %s salah", c.Name)
			}
		}

		expect(do("GET", "/api/v1/auth/me", "", nil, false), 401, "UNAUTHENTICATED")
		expect(do("GET", "/api/v1/auth/me", "", cookies, false), 200, `"email":"admin@masterpro.co.id"`)
		expect(do("POST", "/api/v1/auth/refresh", "", cookies, false), 403, "CSRF_HEADER_MISSING")

		w = do("POST", "/api/v1/auth/refresh", "", cookies, true)
		expect(w, 200, "access_expires_at")
		fresh := w.Result().Cookies()

		expect(do("POST", "/api/v1/auth/logout", "", fresh, true), 204, "")
		expect(do("GET", "/api/v1/auth/me", "", fresh, false), 401, "UNAUTHENTICATED")
	})
}
