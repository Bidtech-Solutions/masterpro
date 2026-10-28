// Command seed mengisi data awal. Idempoten — aman dijalankan berulang.
//
//	seed        membuat admin pertama dari env SEED_ADMIN_NAME, SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD (PRD §17.1)
//	seed demo   (development saja) membuat 1 agen demo + 7 listing tayang berfoto untuk mencoba website
//
// Lokal:     docker compose exec backend go run ./cmd/seed [demo]
// Produksi:  docker compose -f docker-compose.prod.yml exec -e SEED_ADMIN_...=... backend /app/seed
package main

import (
	"context"
	"errors"
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/bidtech-solutions/masterpro/backend/internal/config"
	"github.com/bidtech-solutions/masterpro/backend/internal/database"
	"github.com/bidtech-solutions/masterpro/backend/internal/models"
	"github.com/bidtech-solutions/masterpro/backend/internal/pkg/security"
	"github.com/bidtech-solutions/masterpro/backend/internal/pkg/validation"
)

func main() {
	if err := run(); err != nil {
		fmt.Fprintln(os.Stderr, "seed gagal:", err)
		os.Exit(1)
	}
}

func run() error {
	cfg, err := config.Load()
	if err != nil {
		return err
	}
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
	defer cancel()
	if err := database.MigrateUp(cfg.DB.DSN()); err != nil {
		return err
	}
	db, err := database.Open(ctx, cfg.DB.DSN(), false)
	if err != nil {
		return err
	}
	if len(os.Args) > 1 && os.Args[1] == "demo" {
		return seedDemo(ctx, cfg, db)
	}
	return seedAdmin(ctx, db)
}

func seedAdmin(ctx context.Context, db *gorm.DB) error {
	name := strings.TrimSpace(os.Getenv("SEED_ADMIN_NAME"))
	email := strings.ToLower(strings.TrimSpace(os.Getenv("SEED_ADMIN_EMAIL")))
	password := os.Getenv("SEED_ADMIN_PASSWORD")
	if name == "" || email == "" || password == "" {
		return errors.New("SEED_ADMIN_NAME, SEED_ADMIN_EMAIL, dan SEED_ADMIN_PASSWORD wajib diisi")
	}
	if !validation.IsStrongPassword(password) {
		return errors.New("SEED_ADMIN_PASSWORD harus 8–72 karakter dan memuat huruf serta angka")
	}

	var existing models.User
	err := db.WithContext(ctx).Where("lower(email) = ?", email).Take(&existing).Error
	if err == nil {
		fmt.Printf("Admin %s sudah ada — tidak ada perubahan.\n", email)
		return nil
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return err
	}
	hash, err := security.HashPassword(password)
	if err != nil {
		return err
	}
	now := time.Now().UTC()
	u := models.User{
		ID: uuid.Must(uuid.NewV7()), Name: name, Email: email, PasswordHash: hash,
		Role: models.RoleAdmin, Status: models.UserActive,
		PasswordChangedAt: now, CreatedAt: now, UpdatedAt: now,
	}
	if err := db.WithContext(ctx).Create(&u).Error; err != nil {
		return err
	}
	fmt.Printf("Admin %s dibuat. Segera ganti password setelah login pertama.\n", email)
	return nil
}
