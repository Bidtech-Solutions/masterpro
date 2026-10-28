// Package app merangkai dependency dan menjalankan server HTTP dengan graceful shutdown.
package app

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/bidtech-solutions/masterpro/backend/internal/config"
	"github.com/bidtech-solutions/masterpro/backend/internal/database"
	apihttp "github.com/bidtech-solutions/masterpro/backend/internal/http"
	"github.com/bidtech-solutions/masterpro/backend/internal/pkg/security"
	"github.com/bidtech-solutions/masterpro/backend/internal/pkg/validation"
	"github.com/bidtech-solutions/masterpro/backend/internal/storage"
)

// SetupLogger memasang slog JSON global sesuai LOG_LEVEL.
func SetupLogger(level string) {
	var l slog.Level
	if err := l.UnmarshalText([]byte(level)); err != nil {
		l = slog.LevelInfo
	}
	slog.SetDefault(slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: l})))
}

// Run menjalankan API sampai menerima SIGINT/SIGTERM.
func Run(cfg config.Config, version string) error {
	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	if err := validation.Setup(); err != nil {
		return err
	}
	if cfg.RunMigrations {
		if err := database.MigrateUp(cfg.DB.DSN()); err != nil {
			return err
		}
	}
	db, err := database.Open(ctx, cfg.DB.DSN(), cfg.LogLevel == "debug")
	if err != nil {
		return err
	}
	if sqlDB, err := db.DB(); err == nil {
		defer sqlDB.Close()
	}

	store, err := storage.New(storage.Config{
		Endpoint: cfg.S3.Endpoint, AccessKey: cfg.S3.AccessKey, SecretKey: cfg.S3.SecretKey,
		Bucket: cfg.S3.Bucket, Region: cfg.S3.Region, UseSSL: cfg.S3.UseSSL, PublicURL: cfg.MediaPublicURL,
	})
	if err != nil {
		return err
	}
	if err := store.EnsureBucket(ctx); err != nil {
		return err
	}

	tokens, err := security.NewTokenIssuer(cfg.JWTSecret, cfg.AccessTTL)
	if err != nil {
		return err
	}
	router, err := apihttp.NewRouter(apihttp.Deps{Config: cfg, DB: db, Storage: store, Tokens: tokens, Version: version})
	if err != nil {
		return err
	}

	srv := &http.Server{
		Addr:              fmt.Sprintf(":%d", cfg.Port),
		Handler:           router,
		ReadHeaderTimeout: 10 * time.Second,
		ReadTimeout:       2 * time.Minute, // upload foto
		WriteTimeout:      2 * time.Minute, // ekspor Excel
		IdleTimeout:       2 * time.Minute,
	}
	errCh := make(chan error, 1)
	go func() {
		slog.Info("API berjalan", "addr", srv.Addr, "env", cfg.Env, "version", version)
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			errCh <- err
		}
		close(errCh)
	}()

	select {
	case err := <-errCh:
		return err
	case <-ctx.Done():
	}
	slog.Info("mematikan server...")
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 20*time.Second)
	defer cancel()
	return srv.Shutdown(shutdownCtx)
}
