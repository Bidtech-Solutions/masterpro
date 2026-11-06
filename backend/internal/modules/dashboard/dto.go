package dashboard

import "github.com/google/uuid"

// PropertiesSummary rekap status listing (API.md §13).
type PropertiesSummary struct {
	Total    int64 `json:"total"`
	Draft    int64 `json:"draft"`
	Active   int64 `json:"active"`
	Sold     int64 `json:"sold"`
	Rented   int64 `json:"rented"`
	Inactive int64 `json:"inactive"`
}

// AgentsSummary rekap jumlah mitra agen (hanya untuk admin).
type AgentsSummary struct {
	Total  int64 `json:"total"`
	Active int64 `json:"active"`
}

// TotalsSummary akumulasi interaksi publik.
type TotalsSummary struct {
	ViewCount          int64 `json:"view_count"`
	WhatsappClickCount int64 `json:"whatsapp_click_count"`
}

// TopViewedProperty properti terpopuler berdasarkan impresi tayang.
type TopViewedProperty struct {
	ID                 uuid.UUID `json:"id"`
	Code               string    `json:"code"`
	Title              string    `json:"title"`
	PropertyType       string    `json:"property_type"`
	CityName           string    `json:"city_name"`
	District           *string   `json:"district"`
	ViewCount          int32     `json:"view_count"`
	WhatsappClickCount int32     `json:"whatsapp_click_count"`
	CoverImageURL      *string   `json:"cover_image_url"`
}

// RecentProperty properti yang baru saja diperbarui.
type RecentProperty struct {
	ID        uuid.UUID `json:"id"`
	Code      string    `json:"code"`
	Title     string    `json:"title"`
	Status    string    `json:"status"`
	UpdatedAt string    `json:"updated_at"`
}

// DashboardSummaryResponse payload GET /dashboard/summary (API.md §13).
type DashboardSummaryResponse struct {
	Properties      PropertiesSummary   `json:"properties"`
	Agents          *AgentsSummary      `json:"agents,omitempty"`
	Totals          TotalsSummary       `json:"totals"`
	TopViewed       []TopViewedProperty `json:"top_viewed"`
	RecentlyUpdated []RecentProperty    `json:"recently_updated"`
}

