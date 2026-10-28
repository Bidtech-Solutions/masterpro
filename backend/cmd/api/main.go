// Command api menjalankan REST API MasterPro.
//
// Subcommand `healthcheck` dipakai HEALTHCHECK Docker (image distroless tanpa curl/wget).
package main

import (
	"context"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"strconv"
	"time"

	"github.com/bidtech-solutions/masterpro/backend/internal/app"
	"github.com/bidtech-solutions/masterpro/backend/internal/config"
)

// version diisi saat build: -ldflags "-X main.version=<git sha>".
var version = "dev"

func main() {
	if len(os.Args) > 1 && os.Args[1] == "healthcheck" {
		os.Exit(healthcheck())
	}
	cfg, err := config.Load()
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
	app.SetupLogger(cfg.LogLevel)
	if err := app.Run(cfg, version); err != nil {
		slog.Error("API berhenti dengan error", "error", err)
		os.Exit(1)
	}
}

func healthcheck() int {
	port, err := strconv.Atoi(os.Getenv("APP_PORT"))
	if err != nil || port <= 0 {
		port = 8080
	}
	ctx, cancel := context.WithTimeout(context.Background(), 4*time.Second)
	defer cancel()
	url := fmt.Sprintf("http://127.0.0.1:%d/api/v1/health", port)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil) //nolint:gosec // hanya localhost, port tervalidasi angka
	if err != nil {
		return 1
	}
	resp, err := http.DefaultClient.Do(req) //nolint:gosec // lihat di atas
	if err != nil {
		return 1
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return 1
	}
	return 0
}
