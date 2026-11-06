package report

import (
	"context"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/xuri/excelize/v2"

	"github.com/bidtech-solutions/masterpro/backend/internal/http/middleware"
	"github.com/bidtech-solutions/masterpro/backend/internal/pkg/apperror"
)

// Service antarmuka bisnis modul report.
type Service interface {
	ExportProperties(ctx context.Context, principal middleware.Principal, q ExportQuery) (*excelize.File, string, error)
}

type service struct {
	repo    Repository
	siteURL string
}

// NewService membuat instance Service baru.
func NewService(repo Repository, siteURL string) Service {
	return &service{
		repo:    repo,
		siteURL: siteURL,
	}
}

func (s *service) ExportProperties(ctx context.Context, principal middleware.Principal, q ExportQuery) (*excelize.File, string, error) {
	rows, err := s.repo.GetPropertiesForExport(ctx, q)
	if err != nil {
		return nil, "", apperror.Internal(err)
	}

	// Batas 10.000 baris per ekspor (PRD §6.6 & API.md §12.10)
	if len(rows) > 10000 {
		return nil, "", apperror.New(http.StatusUnprocessableEntity, apperror.CodeExportTooLarge, "Data properti yang diekspor melebihi batas maksimal 10.000 baris")
	}

	stats, err := s.repo.GetSummaryStats(ctx)
	if err != nil {
		return nil, "", apperror.Internal(err)
	}

	adminName, err := s.repo.GetUserName(ctx, principal.UserID)
	if err != nil || adminName == "" {
		adminName = "Admin MasterPro"
	}

	// Buat ringkasan filter
	var filterParts []string
	if q.Q != "" {
		filterParts = append(filterParts, fmt.Sprintf("Pencarian: '%s'", q.Q))
	}
	if q.Status != "" {
		filterParts = append(filterParts, fmt.Sprintf("Status: %s", q.Status))
	}
	if q.ListingType != "" {
		lt := "Dijual"
		if q.ListingType == "rent" {
			lt = "Disewa"
		}
		filterParts = append(filterParts, fmt.Sprintf("Transaksi: %s", lt))
	}
	if q.MarketType != "" {
		mt := "Sekunder"
		if q.MarketType == "primary" {
			mt = "Primer"
		}
		filterParts = append(filterParts, fmt.Sprintf("Pasar: %s", mt))
	}
	if q.PropertyType != "" {
		filterParts = append(filterParts, fmt.Sprintf("Tipe: %s", q.PropertyType))
	}
	if q.City != "" {
		filterParts = append(filterParts, fmt.Sprintf("Kota: %s", q.City))
	}

	filterDesc := "Semua Data Properti"
	if len(filterParts) > 0 {
		filterDesc = strings.Join(filterParts, " • ")
	}

	// Nama file: masterpro-properti-YYYYMMDD-HHmm.xlsx (WIB)
	wibLoc := time.FixedZone("WIB", 7*3600)
	filename := fmt.Sprintf("masterpro-properti-%s.xlsx", time.Now().In(wibLoc).Format("20060102-1504"))

	f, err := GenerateExcel(rows, stats, adminName, filterDesc, s.siteURL)
	if err != nil {
		return nil, "", apperror.Internal(err)
	}

	return f, filename, nil
}
