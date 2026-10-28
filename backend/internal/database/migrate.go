package database

import (
	"errors"
	"fmt"
	"log/slog"
	"strings"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/pgx/v5" // driver pgx5://
	"github.com/golang-migrate/migrate/v4/source/iofs"

	"github.com/bidtech-solutions/masterpro/backend/migrations"
)

// newMigrator membuat instance golang-migrate dari file SQL ter-embed.
func newMigrator(dsn string) (*migrate.Migrate, error) {
	src, err := iofs.New(migrations.FS, ".")
	if err != nil {
		return nil, fmt.Errorf("baca migrasi: %w", err)
	}
	// golang-migrate memakai skema pgx5:// untuk driver pgx v5.
	pgxDSN := "pgx5://" + strings.TrimPrefix(dsn, "postgres://")
	m, err := migrate.NewWithSourceInstance("iofs", src, pgxDSN)
	if err != nil {
		return nil, fmt.Errorf("inisialisasi migrasi: %w", err)
	}
	return m, nil
}

// MigrateUp menjalankan semua migrasi yang belum diterapkan. Aman dijalankan paralel
// (golang-migrate memakai advisory lock Postgres).
func MigrateUp(dsn string) error {
	m, err := newMigrator(dsn)
	if err != nil {
		return err
	}
	defer m.Close()
	if err := m.Up(); err != nil && !errors.Is(err, migrate.ErrNoChange) {
		return fmt.Errorf("migrasi up: %w", err)
	}
	v, dirty, _ := m.Version()
	slog.Info("migrasi database selesai", "version", v, "dirty", dirty)
	return nil
}

// MigrateDown membatalkan semua migrasi. Hanya untuk test & development.
func MigrateDown(dsn string) error {
	m, err := newMigrator(dsn)
	if err != nil {
		return err
	}
	defer m.Close()
	if err := m.Down(); err != nil && !errors.Is(err, migrate.ErrNoChange) {
		return fmt.Errorf("migrasi down: %w", err)
	}
	return nil
}
