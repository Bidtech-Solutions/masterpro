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

// PublicEventRequest body POST /public/properties/:slug/events (API.md §7.4).
type PublicEventRequest struct {
	Type string `json:"type" binding:"required,oneof=view whatsapp_click"`
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

// DetailAgent agen pada PropertyDetail (API.md §4.4).
type DetailAgent struct {
	AgentCode      string  `json:"agent_code"`
	Name           string  `json:"name"`
	PhotoURL       *string `json:"photo_url"`
	WhatsappNumber string  `json:"whatsapp_number"`
}

// DetailImage gambar pada PropertyDetail (API.md §4.2, §4.4).
type DetailImage struct {
	ID        string `json:"id"`
	URL       string `json:"url"`
	Width     int32  `json:"width"`
	Height    int32  `json:"height"`
	SortOrder int16  `json:"sort_order"`
	IsCover   bool   `json:"is_cover"`
}

// DetailFacility fasilitas properti (API.md §4.1, §4.4).
type DetailFacility struct {
	ID     int16  `json:"id"`
	Slug   string `json:"slug"`
	NameID string `json:"name_id"`
	NameEN string `json:"name_en"`
	Icon   string `json:"icon"`
}

// Detail PropertyDetail (API.md §4.4).
type Detail struct {
	ID                string              `json:"id"`
	Code              string              `json:"code"`
	Slug              string              `json:"slug"`
	Title             string              `json:"title"`
	ListingType       models.ListingType  `json:"listing_type"`
	MarketType        models.MarketType   `json:"market_type"`
	PropertyType      RefMini             `json:"property_type"`
	Price             int64               `json:"price"`
	RentPeriod        *models.RentPeriod  `json:"rent_period"`
	IsPriceNegotiable bool                `json:"is_price_negotiable"`
	Location          Location            `json:"location"`
	LandArea          *float64            `json:"land_area"`
	BuildingArea      *float64            `json:"building_area"`
	Bedrooms          *int16              `json:"bedrooms"`
	Bathrooms         *int16              `json:"bathrooms"`
	TotalRooms        *int16              `json:"total_rooms"`
	CoverImage        *ImageMini          `json:"cover_image"`
	ImageCount        int64               `json:"image_count"`
	PublishedAt       *time.Time          `json:"published_at"`
	Description       string              `json:"description"`
	Address           *string             `json:"address"`
	Latitude          *float64            `json:"latitude"`
	Longitude         *float64            `json:"longitude"`
	MaidBedrooms      *int16              `json:"maid_bedrooms"`
	Floors            *int16              `json:"floors"`
	FloorLevel        *int16              `json:"floor_level"`
	Carports          *int16              `json:"carports"`
	Garages           *int16              `json:"garages"`
	ElectricityVA     *int32              `json:"electricity_va"`
	WaterSource       *string             `json:"water_source"`
	Certificate       *models.Certificate `json:"certificate"`
	Furnishing        *models.Furnishing  `json:"furnishing"`
	Facing            *models.Facing      `json:"facing"`
	YearBuilt         *int16              `json:"year_built"`
	VideoURL          *string             `json:"video_url"`
	Facilities        []DetailFacility    `json:"facilities"`
	Images            []DetailImage       `json:"images"`
	Agent             DetailAgent         `json:"agent"`
	UpdatedAt         time.Time           `json:"updated_at"`
}

// --- Dashboard DTOs (docs/API.md §4.5, §12) ---

// DashboardListQuery query GET /properties (API.md §12.1).
type DashboardListQuery struct {
	Q            string  `form:"q" binding:"omitempty,max=100"`
	Status       string  `form:"status" binding:"omitempty,max=100"`
	ListingType  string  `form:"listing_type" binding:"omitempty,oneof=sale rent"`
	MarketType   string  `form:"market_type" binding:"omitempty,oneof=primary secondary"`
	PropertyType string  `form:"property_type" binding:"omitempty,max=200"`
	City         string  `form:"city" binding:"omitempty,max=100"`
	AgentID      *string `form:"agent_id" binding:"omitempty,uuid"`
	MinPrice     *int64  `form:"min_price" binding:"omitempty,min=0"`
	MaxPrice     *int64  `form:"max_price" binding:"omitempty,min=0"`
	CreatedFrom  string  `form:"created_from" binding:"omitempty,datetime=2006-01-02"`
	CreatedTo    string  `form:"created_to" binding:"omitempty,datetime=2006-01-02"`
	Sort         string  `form:"sort" binding:"omitempty,oneof=newest price_asc price_desc popular land_area_desc"`
}

// DashboardAgent ringkas pada PropertyCard dashboard (API.md §4.5).
type DashboardAgent struct {
	ID             string  `json:"id"`
	AgentCode      string  `json:"agent_code"`
	Name           string  `json:"name"`
	PhotoURL       *string `json:"photo_url,omitempty"`
	WhatsappNumber string  `json:"whatsapp_number,omitempty"`
	Status         string  `json:"status,omitempty"`
}

// UserMini pembuat/pengubah entitas.
type UserMini struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

// DashboardPropertyItem item tabel dashboard GET /properties (API.md §4.5).
type DashboardPropertyItem struct {
	ID                 string                `json:"id"`
	Code               string                `json:"code"`
	Slug               string                `json:"slug"`
	Title              string                `json:"title"`
	Status             models.PropertyStatus `json:"status"`
	ListingType        models.ListingType    `json:"listing_type"`
	MarketType         models.MarketType     `json:"market_type"`
	PropertyType       RefMini               `json:"property_type"`
	Price              int64                 `json:"price"`
	RentPeriod         *models.RentPeriod    `json:"rent_period"`
	IsPriceNegotiable  bool                  `json:"is_price_negotiable"`
	Location           Location              `json:"location"`
	LandArea           *float64              `json:"land_area"`
	BuildingArea       *float64              `json:"building_area"`
	Bedrooms           *int16                `json:"bedrooms"`
	Bathrooms          *int16                `json:"bathrooms"`
	TotalRooms         *int16                `json:"total_rooms"`
	CoverImage         *ImageMini            `json:"cover_image"`
	ImageCount         int64                 `json:"image_count"`
	Agent              DashboardAgent        `json:"agent"`
	ViewCount          int32                 `json:"view_count"`
	WhatsappClickCount int32                 `json:"whatsapp_click_count"`
	PublishedAt        *time.Time            `json:"published_at"`
	CreatedAt          time.Time             `json:"created_at"`
	UpdatedAt          time.Time             `json:"updated_at"`
}

// PropertyDashboardDetail detail lengkap listing dashboard (API.md §4.5).
type PropertyDashboardDetail struct {
	Detail
	Status             models.PropertyStatus `json:"status"`
	Agent              DashboardAgent        `json:"agent"`
	ViewCount          int32                 `json:"view_count"`
	WhatsappClickCount int32                 `json:"whatsapp_click_count"`
	IsFeatured         bool                  `json:"is_featured"`
	PublicURL          *string               `json:"public_url"`
	ClosedAt           *time.Time            `json:"closed_at"`
	CreatedBy          UserMini              `json:"created_by"`
	UpdatedBy          *UserMini             `json:"updated_by"`
	CreatedAt          time.Time             `json:"created_at"`
}

// CreatePropertyRequest payload POST /properties (API.md §12.2).
type CreatePropertyRequest struct {
	AgentID           *string             `json:"agent_id" binding:"omitempty,uuid"`
	ListingType       models.ListingType  `json:"listing_type" binding:"required,oneof=sale rent"`
	MarketType        models.MarketType   `json:"market_type" binding:"required,oneof=primary secondary"`
	PropertyTypeID    int16               `json:"property_type_id" binding:"required,min=1"`
	Title             string              `json:"title" binding:"required,min=5,max=160"`
	Description       string              `json:"description"`
	Price             int64               `json:"price" binding:"required,gt=0"`
	RentPeriod        *models.RentPeriod  `json:"rent_period" binding:"omitempty,oneof=monthly yearly"`
	IsPriceNegotiable bool                `json:"is_price_negotiable"`
	ProvinceID        int16               `json:"province_id" binding:"required,min=1"`
	CityID            int32               `json:"city_id" binding:"required,min=1"`
	District          *string             `json:"district" binding:"omitempty,max=100"`
	Address           *string             `json:"address" binding:"omitempty,max=255"`
	Latitude          *float64            `json:"latitude" binding:"omitempty,latitude"`
	Longitude         *float64            `json:"longitude" binding:"omitempty,longitude"`
	LandArea          *float64            `json:"land_area" binding:"omitempty,gt=0"`
	BuildingArea      *float64            `json:"building_area" binding:"omitempty,gt=0"`
	Bedrooms          *int16              `json:"bedrooms" binding:"omitempty,min=0,max=50"`
	Bathrooms         *int16              `json:"bathrooms" binding:"omitempty,min=0,max=50"`
	MaidBedrooms      *int16              `json:"maid_bedrooms" binding:"omitempty,min=0,max=20"`
	Floors            *int16              `json:"floors" binding:"omitempty,min=1,max=100"`
	FloorLevel        *int16              `json:"floor_level" binding:"omitempty,min=1,max=100"`
	TotalRooms        *int16              `json:"total_rooms" binding:"omitempty,min=1,max=200"`
	Carports          *int16              `json:"carports" binding:"omitempty,min=0,max=20"`
	Garages           *int16              `json:"garages" binding:"omitempty,min=0,max=20"`
	ElectricityVA     *int32              `json:"electricity_va" binding:"omitempty,min=0"`
	WaterSource       *string             `json:"water_source" binding:"omitempty,max=40"`
	Certificate       *models.Certificate `json:"certificate" binding:"omitempty,oneof=shm hgb girik ajb strata other"`
	Furnishing        *models.Furnishing  `json:"furnishing" binding:"omitempty,oneof=unfurnished semi_furnished full_furnished"`
	Facing            *models.Facing      `json:"facing" binding:"omitempty,oneof=north south east west northeast northwest southeast southwest"`
	YearBuilt         *int16              `json:"year_built" binding:"omitempty,min=1800,max=2100"`
	VideoURL          *string             `json:"video_url" binding:"omitempty,url,max=255"`
	FacilityIDs       []int16             `json:"facility_ids"`
}

// UpdatePropertyRequest payload PATCH /properties/:id (API.md §12.4).
type UpdatePropertyRequest struct {
	AgentID           *string             `json:"agent_id" binding:"omitempty,uuid"`
	ListingType       *models.ListingType `json:"listing_type" binding:"omitempty,oneof=sale rent"`
	MarketType        *models.MarketType  `json:"market_type" binding:"omitempty,oneof=primary secondary"`
	PropertyTypeID    *int16              `json:"property_type_id" binding:"omitempty,min=1"`
	Title             *string             `json:"title" binding:"omitempty,min=5,max=160"`
	Description       *string             `json:"description"`
	Price             *int64              `json:"price" binding:"omitempty,gt=0"`
	RentPeriod        *models.RentPeriod  `json:"rent_period" binding:"omitempty,oneof=monthly yearly"`
	IsPriceNegotiable *bool               `json:"is_price_negotiable"`
	ProvinceID        *int16              `json:"province_id" binding:"omitempty,min=1"`
	CityID            *int32              `json:"city_id" binding:"omitempty,min=1"`
	District          *string             `json:"district" binding:"omitempty,max=100"`
	Address           *string             `json:"address" binding:"omitempty,max=255"`
	Latitude          *float64            `json:"latitude" binding:"omitempty,latitude"`
	Longitude         *float64            `json:"longitude" binding:"omitempty,longitude"`
	LandArea          *float64            `json:"land_area" binding:"omitempty,gt=0"`
	BuildingArea      *float64            `json:"building_area" binding:"omitempty,gt=0"`
	Bedrooms          *int16              `json:"bedrooms" binding:"omitempty,min=0,max=50"`
	Bathrooms         *int16              `json:"bathrooms" binding:"omitempty,min=0,max=50"`
	MaidBedrooms      *int16              `json:"maid_bedrooms" binding:"omitempty,min=0,max=20"`
	Floors            *int16              `json:"floors" binding:"omitempty,min=1,max=100"`
	FloorLevel        *int16              `json:"floor_level" binding:"omitempty,min=1,max=100"`
	TotalRooms        *int16              `json:"total_rooms" binding:"omitempty,min=1,max=200"`
	Carports          *int16              `json:"carports" binding:"omitempty,min=0,max=20"`
	Garages           *int16              `json:"garages" binding:"omitempty,min=0,max=20"`
	ElectricityVA     *int32              `json:"electricity_va" binding:"omitempty,min=0"`
	WaterSource       *string             `json:"water_source" binding:"omitempty,max=40"`
	Certificate       *models.Certificate `json:"certificate" binding:"omitempty,oneof=shm hgb girik ajb strata other"`
	Furnishing        *models.Furnishing  `json:"furnishing" binding:"omitempty,oneof=unfurnished semi_furnished full_furnished"`
	Facing            *models.Facing      `json:"facing" binding:"omitempty,oneof=north south east west northeast northwest southeast southwest"`
	YearBuilt         *int16              `json:"year_built" binding:"omitempty,min=1800,max=2100"`
	VideoURL          *string             `json:"video_url" binding:"omitempty,url,max=255"`
	FacilityIDs       *[]int16            `json:"facility_ids"`
}

// UpdateStatusRequest payload PATCH /properties/:id/status (API.md §12.6).
type UpdateStatusRequest struct {
	Status models.PropertyStatus `json:"status" binding:"required,oneof=draft active sold rented inactive"`
}

// ReorderImagesRequest payload PATCH /properties/:id/images (API.md §12.8).
type ReorderImagesRequest struct {
	Order        []string `json:"order" binding:"required,min=1"`
	CoverImageID string   `json:"cover_image_id" binding:"required,uuid"`
}

// FailedUploadItem item foto yang gagal diunggah (API.md §12.7).
type FailedUploadItem struct {
	Filename string `json:"filename"`
	Code     string `json:"code"`
	Message  string `json:"message"`
}

// ImageUploadResult respons POST /properties/:id/images (API.md §12.7).
type ImageUploadResult struct {
	Uploaded []DetailImage      `json:"uploaded"`
	Failed   []FailedUploadItem `json:"failed"`
}
