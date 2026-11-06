package report

import "time"

// ExportQuery query GET /properties/export (API.md §12.10).
type ExportQuery struct {
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

// ExportPropertyRow merepresentasikan satu baris properti pada Sheet 1 (PRD §6.6).
type ExportPropertyRow struct {
	Code               string
	Title              string
	Slug               string
	ListingType        string
	MarketType         string
	PropertyTypeName   string
	Province           string
	City               string
	District           string
	Address            string
	Price              int64
	RentPeriod         string
	IsPriceNegotiable  bool
	LandArea           *float64
	BuildingArea       *float64
	Bedrooms           *int16
	Bathrooms          *int16
	Certificate        string
	Furnishing         string
	Status             string
	AgentName          string
	AgentCode          string
	AgentWhatsapp      string
	ViewCount          int32
	WhatsappClickCount int32
	PublishedAt        *time.Time
	ClosedAt           *time.Time
	CreatedAt          time.Time
	UpdatedAt          time.Time
}

// TypeCount rekapitulasi per tipe properti pada Sheet 2.
type TypeCount struct {
	TypeName string
	Count    int64
}

// AgentStat rekapitulasi performa per agen pada Sheet 2.
type AgentStat struct {
	AgentName   string
	AgentCode   string
	ActiveCount int64
	SoldCount   int64
	RentedCount int64
	DraftCount  int64
	TotalCount  int64
}

// SummaryStats ringkasan untuk Sheet 2 (PRD §6.6).
type SummaryStats struct {
	DraftCount    int64
	ActiveCount   int64
	SoldCount     int64
	RentedCount   int64
	InactiveCount int64
	TotalCount    int64

	SaleCount int64
	RentCount int64

	TypeCounts []TypeCount
	AgentStats []AgentStat
}
