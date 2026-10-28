// Package audit mencatat aksi penting ke tabel audit_logs (PRD USR-06, PRP-08).
package audit

import (
	"context"
	"encoding/json"
	"log/slog"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/bidtech-solutions/masterpro/backend/internal/models"
)

// Entry satu catatan audit. Changes TIDAK boleh berisi password, token, atau data sensitif lain.
type Entry struct {
	ActorID    *uuid.UUID
	Action     string // mis. "user.password_reset", "property.status_changed"
	EntityType string // user | agent | property
	EntityID   *uuid.UUID
	Changes    map[string]any
	IP         string
	UserAgent  string
}

// Logger menulis audit log.
type Logger struct{ db *gorm.DB }

// New membuat logger audit.
func New(db *gorm.DB) *Logger { return &Logger{db: db} }

// Record menyimpan entry memakai tx (boleh nil → koneksi default). Kegagalan dicatat di log,
// tidak membatalkan aksi utama.
func (l *Logger) Record(ctx context.Context, tx *gorm.DB, e Entry) {
	db := tx
	if db == nil {
		db = l.db
	}
	row := models.AuditLog{
		ActorUserID: e.ActorID,
		Action:      e.Action,
		EntityType:  e.EntityType,
		EntityID:    e.EntityID,
	}
	if len(e.Changes) > 0 {
		row.Changes, _ = json.Marshal(e.Changes)
	}
	if e.IP != "" {
		row.IPAddress = &e.IP
	}
	if e.UserAgent != "" {
		ua := e.UserAgent
		if len(ua) > 255 {
			ua = ua[:255]
		}
		row.UserAgent = &ua
	}
	if err := db.WithContext(ctx).Create(&row).Error; err != nil {
		slog.ErrorContext(ctx, "gagal menulis audit log", "action", e.Action, "error", err)
	}
}
