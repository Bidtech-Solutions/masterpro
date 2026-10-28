package models

import (
	"time"

	"github.com/google/uuid"
)

// User tabel users.
type User struct {
	ID                uuid.UUID  `gorm:"type:uuid;primaryKey"`
	Name              string     `gorm:"size:120;not null"`
	Email             string     `gorm:"size:160;not null"`
	Phone             *string    `gorm:"size:20"`
	PasswordHash      string     `gorm:"size:100;not null"`
	Role              Role       `gorm:"type:user_role;not null"`
	Status            UserStatus `gorm:"type:user_status;not null"`
	AvatarKey         *string    `gorm:"size:255"`
	LastLoginAt       *time.Time
	PasswordChangedAt time.Time
	CreatedAt         time.Time
	UpdatedAt         time.Time

	Agent *Agent `gorm:"foreignKey:UserID"`
}

// IsActive true bila akun aktif.
func (u User) IsActive() bool { return u.Status == UserActive }

// Agent tabel agents (profil 1:1 dengan users ber-role agent).
type Agent struct {
	ID             uuid.UUID `gorm:"type:uuid;primaryKey"`
	UserID         uuid.UUID `gorm:"type:uuid;not null;uniqueIndex"`
	AgentCode      string    `gorm:"size:12;not null"`
	WhatsappNumber string    `gorm:"size:20;not null"`
	Bio            *string
	ServiceArea    *string `gorm:"size:160"`
	JoinedAt       *time.Time
	CreatedAt      time.Time
	UpdatedAt      time.Time

	User *User `gorm:"foreignKey:UserID"`
}

// RefreshToken tabel refresh_tokens. FamilyID = id sesi (klaim `sid` JWT).
type RefreshToken struct {
	ID         uuid.UUID `gorm:"type:uuid;primaryKey"`
	UserID     uuid.UUID `gorm:"type:uuid;not null"`
	FamilyID   uuid.UUID `gorm:"type:uuid;not null"`
	TokenHash  string    `gorm:"size:64;not null"`
	ExpiresAt  time.Time
	RevokedAt  *time.Time
	ReplacedBy *uuid.UUID `gorm:"type:uuid"`
	UserAgent  *string    `gorm:"size:255"`
	IPAddress  *string    `gorm:"type:inet"`
	CreatedAt  time.Time
}

// AuditLog tabel audit_logs.
type AuditLog struct {
	ID          int64      `gorm:"primaryKey"`
	ActorUserID *uuid.UUID `gorm:"type:uuid"`
	Action      string     `gorm:"size:60;not null"`
	EntityType  string     `gorm:"size:40;not null"`
	EntityID    *uuid.UUID `gorm:"type:uuid"`
	Changes     []byte     `gorm:"type:jsonb"`
	IPAddress   *string    `gorm:"type:inet"`
	UserAgent   *string    `gorm:"size:255"`
	CreatedAt   time.Time
}
