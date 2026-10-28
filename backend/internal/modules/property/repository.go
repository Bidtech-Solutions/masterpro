package property

import (
	"context"
	"strings"
	"time"

	"gorm.io/gorm"

	"github.com/bidtech-solutions/masterpro/backend/internal/models"
	"github.com/bidtech-solutions/masterpro/backend/internal/pkg/pagination"
	"github.com/bidtech-solutions/masterpro/backend/internal/storage"
)

// Repository akses data listing.
type Repository interface {
	ListPublic(ctx context.Context, q PublicListQuery, p pagination.Params) ([]Card, int64, error)
}

type gormRepository struct {
	db       *gorm.DB
	mediaURL string
}

// NewRepository membuat repository GORM. mediaURL = MEDIA_PUBLIC_URL untuk URL gambar.
func NewRepository(db *gorm.DB, mediaURL string) Repository {
	return &gormRepository{db: db, mediaURL: mediaURL}
}

// publicBase: listing yang memenuhi visibilitas publik (PRD §7.2) beserta join yang dibutuhkan kartu.
func (r *gormRepository) publicBase(ctx context.Context) *gorm.DB {
	return r.db.WithContext(ctx).Table("properties p").
		Joins("JOIN property_types pt ON pt.id = p.property_type_id").
		Joins("JOIN cities c ON c.id = p.city_id").
		Joins("JOIN provinces pr ON pr.id = p.province_id").
		Joins("JOIN agents a ON a.id = p.agent_id").
		Joins("JOIN users u ON u.id = a.user_id").
		Where("p.status = ? AND p.deleted_at IS NULL AND u.status = ?", models.StatusActive, models.UserActive)
}

var publicSort = map[string]string{
	"":               "p.published_at DESC NULLS LAST, p.id DESC",
	"newest":         "p.published_at DESC NULLS LAST, p.id DESC",
	"price_asc":      "p.price ASC, p.id DESC",
	"price_desc":     "p.price DESC, p.id DESC",
	"popular":        "p.view_count DESC, p.published_at DESC NULLS LAST, p.id DESC",
	"land_area_desc": "p.land_area DESC NULLS LAST, p.id DESC",
}

type cardRow struct {
	ID, Code, Slug, Title               string
	ListingType                         models.ListingType
	MarketType                          models.MarketType
	Price                               int64
	RentPeriod                          *models.RentPeriod
	IsPriceNegotiable                   bool
	District                            *string
	LandArea, BuildingArea              *float64
	Bedrooms, Bathrooms, TotalRooms     *int16
	PublishedAt                         *time.Time
	PtID                                int16
	PtSlug, PtNameID, PtNameEN          string
	CityID                              int32
	CitySlug, CityName                  string
	ProvinceID                          int32
	ProvinceSlug, ProvinceName          string
	AgentCode, AgentName, AgentWhatsapp string
	CoverKey                            *string
	CoverWidth, CoverHeight             *int32
	ImageCount                          int64
}

const cardColumns = `p.id, p.code, p.slug, p.title, p.listing_type, p.market_type, p.price, p.rent_period,
	p.is_price_negotiable, p.district, p.land_area, p.building_area, p.bedrooms, p.bathrooms, p.total_rooms, p.published_at,
	pt.id AS pt_id, pt.slug AS pt_slug, pt.name_id AS pt_name_id, pt.name_en AS pt_name_en,
	c.id AS city_id, c.slug AS city_slug, c.name AS city_name,
	pr.id AS province_id, pr.slug AS province_slug, pr.name AS province_name,
	a.agent_code, u.name AS agent_name, a.whatsapp_number AS agent_whatsapp,
	img.object_key AS cover_key, img.width AS cover_width, img.height AS cover_height,
	(SELECT COUNT(*) FROM property_images pi WHERE pi.property_id = p.id) AS image_count`

const coverJoin = `LEFT JOIN LATERAL (
	SELECT object_key, width, height FROM property_images
	WHERE property_id = p.id ORDER BY is_cover DESC, sort_order ASC LIMIT 1) img ON true`

func (r *gormRepository) ListPublic(ctx context.Context, q PublicListQuery, p pagination.Params) ([]Card, int64, error) {
	base := applyPublicFilters(r.publicBase(ctx), q)

	var total int64
	if err := base.Session(&gorm.Session{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}
	var rows []cardRow
	err := base.Session(&gorm.Session{}).Select(cardColumns).Joins(coverJoin).
		Order(publicSort[q.Sort]).Limit(p.PerPage).Offset(p.Offset()).
		Scan(&rows).Error
	if err != nil {
		return nil, 0, err
	}
	cards := make([]Card, len(rows))
	for i, row := range rows {
		cards[i] = r.toCard(row)
	}
	return cards, total, nil
}

func applyPublicFilters(db *gorm.DB, q PublicListQuery) *gorm.DB {
	if s := strings.TrimSpace(q.Q); len(s) >= 2 {
		like := "%" + escapeLike(s) + "%"
		db = db.Where("(p.search_vector @@ websearch_to_tsquery('simple', ?) OR p.title ILIKE ? OR c.name ILIKE ?)", s, like, like)
	}
	if q.ListingType != "" {
		db = db.Where("p.listing_type = ?", q.ListingType)
	}
	if q.MarketType != "" {
		db = db.Where("p.market_type = ?", q.MarketType)
	}
	if v := splitList(q.PropertyType); len(v) > 0 {
		db = db.Where("pt.slug IN ?", v)
	}
	if q.Province != "" {
		db = db.Where("pr.slug = ?", q.Province)
	}
	if v := splitList(q.City); len(v) > 0 {
		db = db.Where("c.slug IN ?", v)
	}
	if q.MinPrice != nil {
		db = db.Where("p.price >= ?", *q.MinPrice)
	}
	if q.MaxPrice != nil {
		db = db.Where("p.price <= ?", *q.MaxPrice)
	}
	if q.MinLandArea != nil {
		db = db.Where("p.land_area >= ?", *q.MinLandArea)
	}
	if q.MaxLandArea != nil {
		db = db.Where("p.land_area <= ?", *q.MaxLandArea)
	}
	if q.MinBuildingArea != nil {
		db = db.Where("p.building_area >= ?", *q.MinBuildingArea)
	}
	if q.MaxBuildingArea != nil {
		db = db.Where("p.building_area <= ?", *q.MaxBuildingArea)
	}
	if q.Bedrooms != nil {
		db = db.Where("p.bedrooms >= ?", *q.Bedrooms)
	}
	if q.Bathrooms != nil {
		db = db.Where("p.bathrooms >= ?", *q.Bathrooms)
	}
	if v := splitList(q.Certificate); len(v) > 0 {
		db = db.Where("p.certificate::text IN ?", v)
	}
	if v := splitList(q.Furnishing); len(v) > 0 {
		db = db.Where("p.furnishing::text IN ?", v)
	}
	return db
}

func (r *gormRepository) toCard(row cardRow) Card {
	c := Card{
		ID: row.ID, Code: row.Code, Slug: row.Slug, Title: row.Title,
		ListingType: row.ListingType, MarketType: row.MarketType,
		PropertyType: RefMini{ID: row.PtID, Slug: row.PtSlug, NameID: row.PtNameID, NameEN: row.PtNameEN},
		Price:        row.Price, RentPeriod: row.RentPeriod, IsPriceNegotiable: row.IsPriceNegotiable,
		Location: Location{
			District: row.District,
			City:     PlaceMini{ID: row.CityID, Slug: row.CitySlug, Name: row.CityName},
			Province: PlaceMini{ID: row.ProvinceID, Slug: row.ProvinceSlug, Name: row.ProvinceName},
		},
		LandArea: row.LandArea, BuildingArea: row.BuildingArea,
		Bedrooms: row.Bedrooms, Bathrooms: row.Bathrooms, TotalRooms: row.TotalRooms,
		ImageCount:  row.ImageCount,
		Agent:       AgentContact{AgentCode: row.AgentCode, Name: row.AgentName, WhatsappNumber: row.AgentWhatsapp},
		PublishedAt: row.PublishedAt,
	}
	if row.CoverKey != nil {
		img := &ImageMini{URL: storage.URL(r.mediaURL, *row.CoverKey)}
		if row.CoverWidth != nil {
			img.Width = *row.CoverWidth
		}
		if row.CoverHeight != nil {
			img.Height = *row.CoverHeight
		}
		c.CoverImage = img
	}
	return c
}

// splitList memecah "a,b, c" menjadi slice tanpa elemen kosong (maks 20 nilai).
func splitList(s string) []string {
	var out []string
	for _, v := range strings.Split(s, ",") {
		if v = strings.TrimSpace(v); v != "" && len(out) < 20 {
			out = append(out, v)
		}
	}
	return out
}

func escapeLike(s string) string {
	return strings.NewReplacer(`\`, `\\`, `%`, `\%`, `_`, `\_`).Replace(s)
}
