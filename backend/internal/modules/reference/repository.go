package reference

import (
	"context"
	"strings"

	"gorm.io/gorm"

	"github.com/bidtech-solutions/masterpro/backend/internal/models"
)

// Repository akses data referensi.
type Repository interface {
	PropertyTypes(ctx context.Context, listingType string) ([]PropertyTypeResponse, error)
	Facilities(ctx context.Context) ([]FacilityResponse, error)
	Provinces(ctx context.Context, hasListings bool) ([]ProvinceResponse, error)
	Cities(ctx context.Context, q CityQuery) ([]CityResponse, error)
}

type gormRepository struct{ db *gorm.DB }

// NewRepository membuat repository GORM.
func NewRepository(db *gorm.DB) Repository { return &gormRepository{db: db} }

func (r *gormRepository) PropertyTypes(ctx context.Context, listingType string) ([]PropertyTypeResponse, error) {
	q := r.db.WithContext(ctx).Table("property_types pt").
		Select(`pt.id, pt.slug, pt.name_id, pt.name_en, pt.allow_sale, pt.allow_rent,
			(SELECT COUNT(*) FROM properties p WHERE p.property_type_id = pt.id AND ` + models.PublicVisibleSQL + `) AS active_listing_count`).
		Order("pt.sort_order")
	switch listingType {
	case "sale":
		q = q.Where("pt.allow_sale")
	case "rent":
		q = q.Where("pt.allow_rent")
	}
	var out []PropertyTypeResponse
	return out, q.Scan(&out).Error
}

func (r *gormRepository) Facilities(ctx context.Context) ([]FacilityResponse, error) {
	var out []FacilityResponse
	err := r.db.WithContext(ctx).Table("facilities").
		Select("id, slug, name_id, name_en, icon").Order("sort_order").Scan(&out).Error
	return out, err
}

func (r *gormRepository) Provinces(ctx context.Context, hasListings bool) ([]ProvinceResponse, error) {
	q := r.db.WithContext(ctx).Table("provinces pr").Select("pr.id, pr.slug, pr.name").Order("pr.name")
	if hasListings {
		q = q.Where("EXISTS (SELECT 1 FROM properties p WHERE p.province_id = pr.id AND " + models.PublicVisibleSQL + ")")
	}
	var out []ProvinceResponse
	return out, q.Scan(&out).Error
}

func (r *gormRepository) Cities(ctx context.Context, f CityQuery) ([]CityResponse, error) {
	q := r.db.WithContext(ctx).Table("cities c").
		Joins("JOIN provinces pr ON pr.id = c.province_id").
		Select(`c.id, c.slug, c.name, c.kind, pr.id AS province_id, pr.slug AS province_slug, pr.name AS province_name,
			(SELECT COUNT(*) FROM properties p WHERE p.city_id = c.id AND ` + models.PublicVisibleSQL + `) AS active_listing_count`)
	if f.Province != "" {
		q = q.Where("pr.slug = ?", f.Province)
	}
	if s := strings.TrimSpace(f.Q); len(s) >= 2 {
		q = q.Where("c.name ILIKE ?", "%"+escapeLike(s)+"%")
	}
	if f.HasListings {
		q = q.Where("EXISTS (SELECT 1 FROM properties p WHERE p.city_id = c.id AND " + models.PublicVisibleSQL + ")")
	}
	limit := f.Limit
	if limit == 0 {
		limit = 50
	}
	var rows []struct {
		CityResponse
		ProvinceID   int16
		ProvinceSlug string
		ProvinceName string
	}
	if err := q.Order("active_listing_count DESC, c.name ASC").Limit(limit).Scan(&rows).Error; err != nil {
		return nil, err
	}
	out := make([]CityResponse, len(rows))
	for i, row := range rows {
		c := row.CityResponse
		c.Province = ProvinceResponse{ID: row.ProvinceID, Slug: row.ProvinceSlug, Name: row.ProvinceName}
		out[i] = c
	}
	return out, nil
}

// escapeLike meloloskan karakter wildcard LIKE pada input pengguna.
func escapeLike(s string) string {
	return strings.NewReplacer(`\`, `\\`, `%`, `\%`, `_`, `\_`).Replace(s)
}
