// Package reference — data referensi publik: tipe properti, fasilitas, provinsi, kota (API.md §7.5–7.8).
package reference

// PropertyTypeResponse API.md §4.1 + active_listing_count.
type PropertyTypeResponse struct {
	ID                 int16  `json:"id"`
	Slug               string `json:"slug"`
	NameID             string `json:"name_id"`
	NameEN             string `json:"name_en"`
	AllowSale          bool   `json:"allow_sale"`
	AllowRent          bool   `json:"allow_rent"`
	ActiveListingCount int64  `json:"active_listing_count"`
}

// FacilityResponse API.md §4.1.
type FacilityResponse struct {
	ID     int16  `json:"id"`
	Slug   string `json:"slug"`
	NameID string `json:"name_id"`
	NameEN string `json:"name_en"`
	Icon   string `json:"icon"`
}

// ProvinceResponse API.md §4.1.
type ProvinceResponse struct {
	ID   int16  `json:"id"`
	Slug string `json:"slug"`
	Name string `json:"name"`
}

// CityResponse API.md §4.1 + active_listing_count.
type CityResponse struct {
	ID                 int32            `json:"id"`
	Slug               string           `json:"slug"`
	Name               string           `json:"name"`
	Kind               string           `json:"kind"`
	Province           ProvinceResponse `json:"province"`
	ActiveListingCount int64            `json:"active_listing_count"`
}

// PropertyTypeQuery query GET /public/property-types.
type PropertyTypeQuery struct {
	ListingType string `form:"listing_type" binding:"omitempty,oneof=sale rent"`
}

// ProvinceQuery query GET /public/locations/provinces.
type ProvinceQuery struct {
	HasListings bool `form:"has_listings"`
}

// CityQuery query GET /public/locations/cities.
type CityQuery struct {
	Province    string `form:"province" binding:"omitempty,max=80"`
	Q           string `form:"q" binding:"omitempty,max=100"`
	HasListings bool   `form:"has_listings"`
	Limit       int    `form:"limit" binding:"omitempty,min=1,max=600"`
}
