package report_test

import (
	"context"
	"errors"
	"net/http"
	"testing"
	"time"

	"github.com/google/uuid"

	"github.com/bidtech-solutions/masterpro/backend/internal/http/middleware"
	"github.com/bidtech-solutions/masterpro/backend/internal/models"
	"github.com/bidtech-solutions/masterpro/backend/internal/modules/report"
	"github.com/bidtech-solutions/masterpro/backend/internal/pkg/apperror"
)

type mockRepo struct {
	rows []report.ExportPropertyRow
	err  error
}

func (m *mockRepo) GetPropertiesForExport(ctx context.Context, q report.ExportQuery) ([]report.ExportPropertyRow, error) {
	if m.err != nil {
		return nil, m.err
	}
	return m.rows, nil
}

func (m *mockRepo) GetSummaryStats(ctx context.Context) (*report.SummaryStats, error) {
	return &report.SummaryStats{
		ActiveCount: 5,
		DraftCount:  2,
		SoldCount:   1,
		RentedCount: 1,
		TotalCount:  9,
		SaleCount:   6,
		RentCount:   3,
	}, nil
}

func (m *mockRepo) GetUserName(ctx context.Context, userID uuid.UUID) (string, error) {
	return "Admin Uji", nil
}

func TestExportProperties_Success(t *testing.T) {
	mock := &mockRepo{
		rows: []report.ExportPropertyRow{
			{
				Code:             "MP-000001",
				Title:            "Rumah Minimalis Modern",
				Slug:             "rumah-minimalis-modern",
				ListingType:      "Jual",
				MarketType:       "Sekunder",
				PropertyTypeName: "Rumah",
				Province:         "Kepulauan Riau",
				City:             "Kota Batam",
				District:         "Batam Kota",
				Address:          "Jl. Sudirman No. 1",
				Price:            1500000000,
				Status:           "Tayang",
				AgentName:        "Budi Santoso",
				AgentCode:        "AGT-001",
				AgentWhatsapp:    "081234567890",
				CreatedAt:        time.Now(),
				UpdatedAt:        time.Now(),
			},
		},
	}

	svc := report.NewService(mock, "http://localhost")
	principal := middleware.Principal{
		UserID: uuid.New(),
		Role:   models.RoleAdmin,
	}

	f, filename, err := svc.ExportProperties(context.Background(), principal, report.ExportQuery{})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	defer f.Close()

	if filename == "" {
		t.Errorf("expected filename, got empty")
	}

	sheets := f.GetSheetList()
	if len(sheets) < 2 {
		t.Errorf("expected at least 2 sheets, got %d", len(sheets))
	}
}

func TestExportProperties_TooLarge(t *testing.T) {
	// 10.001 rows should trigger EXPORT_TOO_LARGE
	manyRows := make([]report.ExportPropertyRow, 10001)
	mock := &mockRepo{rows: manyRows}

	svc := report.NewService(mock, "http://localhost")
	principal := middleware.Principal{
		UserID: uuid.New(),
		Role:   models.RoleAdmin,
	}

	_, _, err := svc.ExportProperties(context.Background(), principal, report.ExportQuery{})
	if err == nil {
		t.Fatalf("expected error for >10,000 rows, got nil")
	}

	var appErr *apperror.Error
	if !errors.As(err, &appErr) {
		t.Fatalf("expected *apperror.Error, got %T", err)
	}
	if appErr.Status != http.StatusUnprocessableEntity {
		t.Errorf("expected HTTP 422, got %d", appErr.Status)
	}
	if appErr.Code != apperror.CodeExportTooLarge {
		t.Errorf("expected error code %s, got %s", apperror.CodeExportTooLarge, appErr.Code)
	}
}
