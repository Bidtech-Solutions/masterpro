// Package models berisi struct GORM yang mencerminkan skema di migrations/ (PRD §13).
// Struct ini TIDAK dipakai untuk membuat tabel (AutoMigrate dilarang) — skema hanya lewat migrasi SQL.
package models

// Role peran akun.
type Role string

const (
	RoleAdmin Role = "admin"
	RoleAgent Role = "agent"
)

// UserStatus status akun.
type UserStatus string

const (
	UserActive   UserStatus = "active"
	UserInactive UserStatus = "inactive"
)

// ListingType jual/sewa.
type ListingType string

const (
	ListingSale ListingType = "sale"
	ListingRent ListingType = "rent"
)

// MarketType primary/secondary.
type MarketType string

const (
	MarketPrimary   MarketType = "primary"
	MarketSecondary MarketType = "secondary"
)

// PropertyStatus status listing (PRD §7.2).
type PropertyStatus string

const (
	StatusDraft    PropertyStatus = "draft"
	StatusActive   PropertyStatus = "active"
	StatusSold     PropertyStatus = "sold"
	StatusRented   PropertyStatus = "rented"
	StatusInactive PropertyStatus = "inactive"
)

// RentPeriod periode sewa.
type RentPeriod string

const (
	RentMonthly RentPeriod = "monthly"
	RentYearly  RentPeriod = "yearly"
)

// Certificate jenis sertifikat.
type Certificate string

const (
	CertSHM    Certificate = "shm"
	CertHGB    Certificate = "hgb"
	CertStrata Certificate = "strata"
	CertGirik  Certificate = "girik"
	CertAJB    Certificate = "ajb"
	CertPPJB   Certificate = "ppjb"
	CertOther  Certificate = "other"
)

// Furnishing kondisi perabot.
type Furnishing string

const (
	Unfurnished    Furnishing = "unfurnished"
	SemiFurnished  Furnishing = "semi_furnished"
	FullyFurnished Furnishing = "fully_furnished"
)

// Facing arah hadap.
type Facing string

// PublicVisibleSQL adalah kondisi visibilitas publik listing (PRD §7.2) untuk alias tabel `p`.
const PublicVisibleSQL = `p.status = 'active' AND p.deleted_at IS NULL AND EXISTS (
	SELECT 1 FROM agents a JOIN users u ON u.id = a.user_id
	WHERE a.id = p.agent_id AND u.status = 'active')`
