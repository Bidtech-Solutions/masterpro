// Package database membuka koneksi PostgreSQL (GORM) dan menjalankan migrasi (PRD §10.3).
package database

import (
	"context"
	"fmt"
	"log"
	"log/slog"
	"os"
	"time"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// Open membuka koneksi GORM dengan retry (Postgres mungkin belum siap saat container start).
func Open(ctx context.Context, dsn string, debug bool) (*gorm.DB, error) {
	level := logger.Warn
	if debug {
		level = logger.Info
	}
	cfg := &gorm.Config{
		Logger: logger.New(log.New(os.Stdout, "", log.LstdFlags), logger.Config{
			SlowThreshold:             500 * time.Millisecond,
			LogLevel:                  level,
			IgnoreRecordNotFoundError: true, // "tidak ditemukan" adalah alur normal, bukan error
		}),
		NowFunc:                func() time.Time { return time.Now().UTC() },
		SkipDefaultTransaction: true,
		TranslateError:         true,
	}

	var lastErr error
	for attempt := 1; attempt <= 10; attempt++ {
		db, err := gorm.Open(postgres.Open(dsn), cfg)
		if err == nil {
			sqlDB, _ := db.DB()
			sqlDB.SetMaxOpenConns(20)
			sqlDB.SetMaxIdleConns(5)
			sqlDB.SetConnMaxLifetime(30 * time.Minute)
			if err = sqlDB.PingContext(ctx); err == nil {
				return db, nil
			}
		}
		lastErr = err
		slog.Warn("database belum siap, mencoba lagi", "attempt", attempt, "error", err)
		select {
		case <-ctx.Done():
			return nil, ctx.Err()
		case <-time.After(time.Duration(attempt) * time.Second):
		}
	}
	return nil, fmt.Errorf("koneksi database gagal: %w", lastErr)
}

// Ping memeriksa koneksi (dipakai health check).
func Ping(ctx context.Context, db *gorm.DB) error {
	sqlDB, err := db.DB()
	if err != nil {
		return err
	}
	return sqlDB.PingContext(ctx)
}
