package property

import (
	"time"

	"github.com/bidtech-solutions/masterpro/backend/internal/models"
)

// PublicListQuery query GET /public/properties (API.md §7.1). Nilai multi dipisah koma.
type PublicListQuery struct {
	Q               string   `form:"q" binding:"omitempty,max=100"`
	ListingType     string   `form:"listing_type" binding:"omitempty,oneof=sale rent"`
	MarketType      string   `form:"market_type" binding:"omitempty,oneof=primary secondary"`
	PropertyType    string   `form:"property_type" binding:"omitempty,max=200"`
	Province        string   `form:"province" binding:"omitempty,max=80"`
	City            string   `form:"city" binding:"omitempty,max=500"`
	MinPrice        *int64   `form:"min_price" binding:"omitempty,min=0"`
	MaxPrice        *int64   `form:"max_price" binding:"omitempty,min=0"`
	MinLandArea     *float64 `form:"min_land_area" binding:"omitempty,min=0"`
	MaxLandArea     *float64 `form:"max_land_area" binding:"omitempty,min=0"`
	MinBuildingArea *float64 `form:"min_building_area" binding:"omitempty,min=0"`
	MaxBuildingArea *float64 `form:"max_building_area" binding:"omitempty,min=0"`
	Bedrooms        *int     `form:"bedrooms" binding:"omitempty,min=0,max=50"`
	Bathrooms       *int     `form:"bathrooms" binding:"omitempty,min=0,max=50"`
	Certificate     string   `form:"certificate" binding:"omitempty,max=100"`
	Furnishing      string   `form:"furnishing" binding:"omitempty,max=100"`
	Sort            string   `form:"sort" binding:"omitempty,oneof=newest price_asc price_desc popular land_area_desc"`
}

// RefMini referensi ringkas (tipe properti).
type RefMini struct {
	ID     int16  `json:"id"`
	Slug   string `json:"slug"`
	NameID string `json:"name_id"`
	NameEN string `json:"name_en"`
}

// PlaceMini kota/provinsi ringkas.
type PlaceMini struct {
	ID   int32  `json:"id"`
	Slug string `json:"slug"`
	Name string `json:"name"`
}

// Location objek `location` PropertyCard.
type Location struct {
	District *string   `json:"district"`
	City     PlaceMini `json:"city"`
	Province PlaceMini `json:"province"`
}

// ImageMini gambar cover.
type ImageMini struct {
	URL    string `json:"url"`
	Width  int32  `json:"width"`
	Height int32  `json:"height"`
}

// AgentContact agen pada PropertyCard (API.md §4.3).
type AgentContact struct {
	AgentCode      string `json:"agent_code"`
	Name           string `json:"name"`
	WhatsappNumber string `json:"whatsapp_number"`
}

// Card PropertyCard (API.md §4.3).
type Card struct {
	ID                string             `json:"id"`
	Code              string             `json:"code"`
	Slug              string             `json:"slug"`
	Title             string             `json:"title"`
	ListingType       models.ListingType `json:"listing_type"`
	MarketType        models.MarketType  `json:"market_type"`
	PropertyType      RefMini            `json:"property_type"`
	Price             int64              `json:"price"`
	RentPeriod        *models.RentPeriod `json:"rent_period"`
	IsPriceNegotiable bool               `json:"is_price_negotiable"`
	Location          Location           `json:"location"`
	LandArea          *float64           `json:"land_area"`
	BuildingArea      *float64           `json:"building_area"`
	Bedrooms          *int16             `json:"bedrooms"`
	Bathrooms         *int16             `json:"bathrooms"`
	TotalRooms        *int16             `json:"total_rooms"`
	CoverImage        *ImageMini         `json:"cover_image"`
	ImageCount        int64              `json:"image_count"`
	Agent             AgentContact       `json:"agent"`
	PublishedAt       *time.Time         `json:"published_at"`
}
