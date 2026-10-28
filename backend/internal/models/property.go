package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// PropertyType tabel property_types.
type PropertyType struct {
	ID        int16  `gorm:"primaryKey"`
	Slug      string `gorm:"size:30"`
	NameID    string `gorm:"column:name_id;size:50"`
	NameEN    string `gorm:"column:name_en;size:50"`
	AllowSale bool
	AllowRent bool
	SortOrder int16
}

// Facility tabel facilities.
type Facility struct {
	ID        int16  `gorm:"primaryKey"`
	Slug      string `gorm:"size:40"`
	NameID    string `gorm:"column:name_id;size:60"`
	NameEN    string `gorm:"column:name_en;size:60"`
	Icon      string `gorm:"size:40"`
	SortOrder int16
}

// Province tabel provinces.
type Province struct {
	ID   int16  `gorm:"primaryKey"`
	Code string `gorm:"size:2"`
	Name string `gorm:"size:80"`
	Slug string `gorm:"size:80"`
}

// City tabel cities.
type City struct {
	ID         int32 `gorm:"primaryKey"`
	ProvinceID int16
	Code       string `gorm:"size:5"`
	Name       string `gorm:"size:100"`
	Slug       string `gorm:"size:100"`
	Kind       string `gorm:"size:10"`

	Province *Province `gorm:"foreignKey:ProvinceID"`
}

// Property tabel properties. Field opsional bertipe pointer agar NULL tersimpan apa adanya.
type Property struct {
	ID        uuid.UUID  `gorm:"type:uuid;primaryKey"`
	Code      string     `gorm:"size:12"`
	Slug      string     `gorm:"size:100"`
	AgentID   uuid.UUID  `gorm:"type:uuid"`
	CreatedBy uuid.UUID  `gorm:"type:uuid"`
	UpdatedBy *uuid.UUID `gorm:"type:uuid"`

	ListingType    ListingType    `gorm:"type:listing_type"`
	MarketType     MarketType     `gorm:"type:market_type"`
	PropertyTypeID int16          `gorm:"column:property_type_id"`
	Status         PropertyStatus `gorm:"type:property_status"`

	Title             string `gorm:"size:160"`
	Description       string
	Price             int64
	RentPeriod        *RentPeriod `gorm:"type:rent_period"`
	IsPriceNegotiable bool

	ProvinceID int16
	CityID     int32
	District   *string  `gorm:"size:100"`
	Address    *string  `gorm:"size:255"`
	Latitude   *float64 `gorm:"type:numeric(9,6)"`
	Longitude  *float64 `gorm:"type:numeric(9,6)"`

	LandArea      *float64 `gorm:"type:numeric(10,2)"`
	BuildingArea  *float64 `gorm:"type:numeric(10,2)"`
	Bedrooms      *int16
	Bathrooms     *int16
	MaidBedrooms  *int16
	Floors        *int16
	FloorLevel    *int16
	TotalRooms    *int16
	Carports      *int16
	Garages       *int16
	ElectricityVA *int32       `gorm:"column:electricity_va"`
	WaterSource   *string      `gorm:"size:40"`
	Certificate   *Certificate `gorm:"type:certificate_type"`
	Furnishing    *Furnishing  `gorm:"type:furnishing_type"`
	Facing        *Facing      `gorm:"type:facing_direction"`
	YearBuilt     *int16
	VideoURL      *string `gorm:"size:255"`

	ViewCount          int32
	WhatsappClickCount int32
	IsFeatured         bool

	PublishedAt *time.Time
	ClosedAt    *time.Time
	CreatedAt   time.Time
	UpdatedAt   time.Time
	DeletedAt   gorm.DeletedAt

	// search_vector adalah kolom GENERATED; jangan dipetakan agar GORM tidak menulisnya.

	Agent        *Agent          `gorm:"foreignKey:AgentID"`
	PropertyType *PropertyType   `gorm:"foreignKey:PropertyTypeID"`
	Province     *Province       `gorm:"foreignKey:ProvinceID"`
	City         *City           `gorm:"foreignKey:CityID"`
	Images       []PropertyImage `gorm:"foreignKey:PropertyID"`
	Facilities   []Facility      `gorm:"many2many:property_facilities;joinForeignKey:PropertyID;joinReferences:FacilityID"`
}

// PropertyImage tabel property_images.
type PropertyImage struct {
	ID         uuid.UUID `gorm:"type:uuid;primaryKey"`
	PropertyID uuid.UUID `gorm:"type:uuid"`
	ObjectKey  string    `gorm:"size:255"`
	Width      int32
	Height     int32
	SizeBytes  int32
	SortOrder  int16
	IsCover    bool
	CreatedAt  time.Time
}
