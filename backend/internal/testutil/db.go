// Package testutil menyediakan helper untuk test integrasi berbasis PostgreSQL.
//
// Test integrasi hanya berjalan bila TEST_DATABASE_URL diisi (CI menyediakannya lewat service
// container). Database tersebut akan dikosongkan & dimigrasi ulang — jangan arahkan ke DB nyata.
package testutil

import (
	"context"
	"os"
	"testing"

	"gorm.io/gorm"

	"github.com/bidtech-solutions/masterpro/backend/internal/database"
)

// DSN mengembalikan TEST_DATABASE_URL atau melewati test bila kosong.
func DSN(t *testing.T) string {
	t.Helper()
	dsn := os.Getenv("TEST_DATABASE_URL")
	if dsn == "" {
		t.Skip("TEST_DATABASE_URL tidak diisi — lewati test integrasi")
	}
	return dsn
}

// FreshDB memigrasi ulang skema dari nol dan mengembalikan koneksi GORM.
func FreshDB(t *testing.T) *gorm.DB {
	t.Helper()
	dsn := DSN(t)
	if err := database.MigrateDown(dsn); err != nil {
		t.Fatalf("migrate down: %v", err)
	}
	if err := database.MigrateUp(dsn); err != nil {
		t.Fatalf("migrate up: %v", err)
	}
	db, err := database.Open(context.Background(), dsn, false)
	if err != nil {
		t.Fatalf("open db: %v", err)
	}
	t.Cleanup(func() {
		if sqlDB, err := db.DB(); err == nil {
			_ = sqlDB.Close()
		}
	})
	return db
}
