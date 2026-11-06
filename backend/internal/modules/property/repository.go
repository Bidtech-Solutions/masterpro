package property

import (
	"context"
	"errors"
	"fmt"
	"math"
	"strings"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/bidtech-solutions/masterpro/backend/internal/models"
	"github.com/bidtech-solutions/masterpro/backend/internal/pkg/pagination"
	"github.com/bidtech-solutions/masterpro/backend/internal/pkg/slug"
	"github.com/bidtech-solutions/masterpro/backend/internal/storage"
)

// Repository akses data listing.
type Repository interface {
	ListPublic(ctx context.Context, q PublicListQuery, p pagination.Params) ([]Card, int64, error)
	GetPublicBySlug(ctx context.Context, slug string) (*Detail, error)
	ListSimilar(ctx context.Context, slug string, limit int) ([]Card, error)
	IncrementPublicCounter(ctx context.Context, slug string, eventType string) error

	// Dashboard CRUD (API.md §12)
	GetAgentIDByUserID(ctx context.Context, userID uuid.UUID) (*uuid.UUID, error)
	ListDashboard(ctx context.Context, agentID *uuid.UUID, q DashboardListQuery, p pagination.Params) ([]DashboardPropertyItem, int64, error)
	GetByID(ctx context.Context, id uuid.UUID, agentID *uuid.UUID) (*models.Property, error)
	Create(ctx context.Context, prop *models.Property, facilityIDs []int16) error
	Update(ctx context.Context, prop *models.Property, facilityIDs *[]int16, agentID *uuid.UUID) error
	UpdateStatus(ctx context.Context, id uuid.UUID, status models.PropertyStatus, updaterID uuid.UUID, agentID *uuid.UUID) error
	SoftDelete(ctx context.Context, id uuid.UUID, deleterID uuid.UUID) error
	AddImages(ctx context.Context, propertyID uuid.UUID, images []models.PropertyImage, agentID *uuid.UUID) error
	ReorderImages(ctx context.Context, propertyID uuid.UUID, order []uuid.UUID, coverImageID uuid.UUID, agentID *uuid.UUID) error
	DeleteImage(ctx context.Context, propertyID uuid.UUID, imageID uuid.UUID, agentID *uuid.UUID) (string, error)
	CountImages(ctx context.Context, propertyID uuid.UUID) (int64, error)
	GetPropertyType(ctx context.Context, id int16) (*models.PropertyType, error)
	CheckCityInProvince(ctx context.Context, cityID int32, provinceID int16) (bool, error)
	GetFirstActiveAgentID(ctx context.Context) (*uuid.UUID, error)
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
	WHERE property_id = p.id ORDER BY is_cover DESC, sort_order ASC, created_at ASC LIMIT 1) img ON true`

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

func (r *gormRepository) GetPublicBySlug(ctx context.Context, slug string) (*Detail, error) {
	var p models.Property
	err := r.db.WithContext(ctx).
		Preload("PropertyType").
		Preload("City").
		Preload("Province").
		Preload("Agent.User").
		Preload("Images", func(db *gorm.DB) *gorm.DB {
			return db.Order("property_images.is_cover DESC, property_images.sort_order ASC, property_images.created_at ASC")
		}).
		Preload("Facilities", func(db *gorm.DB) *gorm.DB {
			return db.Order("facilities.sort_order ASC")
		}).
		Joins("JOIN agents a ON a.id = properties.agent_id").
		Joins("JOIN users u ON u.id = a.user_id").
		Where("properties.slug = ? AND properties.status = ? AND properties.deleted_at IS NULL AND u.status = ?",
			slug, models.StatusActive, models.UserActive).
		Take(&p).Error
	if err != nil {
		return nil, err
	}
	_ = r.db.WithContext(ctx).Model(&models.Property{}).
		Where("id = ?", p.ID).
		UpdateColumn("view_count", gorm.Expr("view_count + 1")).Error
	return r.toDetail(p), nil
}

func (r *gormRepository) IncrementPublicCounter(ctx context.Context, slug string, eventType string) error {
	col := "view_count"
	if eventType == "whatsapp_click" {
		col = "whatsapp_click_count"
	}
	res := r.db.WithContext(ctx).Table("properties").
		Where("slug = ? AND status = ? AND deleted_at IS NULL", slug, models.StatusActive).
		UpdateColumn(col, gorm.Expr(col+" + 1"))
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

func (r *gormRepository) ListSimilar(ctx context.Context, slug string, limit int) ([]Card, error) {
	if limit <= 0 || limit > 12 {
		limit = 8
	}
	var target models.Property
	err := r.db.WithContext(ctx).Select("id, city_id, province_id, property_type_id, listing_type, price").
		Where("slug = ? AND status = ? AND deleted_at IS NULL", slug, models.StatusActive).
		Take(&target).Error
	if err != nil {
		return nil, err
	}

	minPrice := int64(float64(target.Price) * 0.7)
	maxPrice := int64(float64(target.Price) * 1.3)

	var rows []cardRow
	orderClause := fmt.Sprintf(`CASE 
		WHEN pt.id = %d AND c.id = %d AND p.price BETWEEN %d AND %d THEN 1
		WHEN pt.id = %d AND c.id = %d THEN 2
		WHEN pt.id = %d AND pr.id = %d THEN 3
		ELSE 4 END, p.published_at DESC NULLS LAST, p.id DESC`,
		target.PropertyTypeID, target.CityID, minPrice, maxPrice,
		target.PropertyTypeID, target.CityID,
		target.PropertyTypeID, target.ProvinceID,
	)

	base := r.publicBase(ctx).Where("p.id != ? AND p.listing_type = ?", target.ID, target.ListingType)
	err = base.Select(cardColumns).Joins(coverJoin).
		Order(orderClause).Limit(limit).Scan(&rows).Error
	if err != nil {
		return nil, err
	}

	cards := make([]Card, len(rows))
	for i, row := range rows {
		cards[i] = r.toCard(row)
	}
	return cards, nil
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
		db = db.Where("p.certificate IN ?", v)
	}
	if v := splitList(q.Furnishing); len(v) > 0 {
		db = db.Where("p.furnishing IN ?", v)
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

func (r *gormRepository) toDetail(p models.Property) *Detail {
	d := &Detail{
		ID:                p.ID.String(),
		Code:              p.Code,
		Slug:              p.Slug,
		Title:             p.Title,
		ListingType:       p.ListingType,
		MarketType:        p.MarketType,
		Price:             p.Price,
		RentPeriod:        p.RentPeriod,
		IsPriceNegotiable: p.IsPriceNegotiable,
		LandArea:          p.LandArea,
		BuildingArea:      p.BuildingArea,
		Bedrooms:          p.Bedrooms,
		Bathrooms:         p.Bathrooms,
		TotalRooms:        p.TotalRooms,
		PublishedAt:       p.PublishedAt,
		Description:       p.Description,
		Address:           p.Address,
		Latitude:          p.Latitude,
		Longitude:         p.Longitude,
		MaidBedrooms:      p.MaidBedrooms,
		Floors:            p.Floors,
		FloorLevel:        p.FloorLevel,
		Carports:          p.Carports,
		Garages:           p.Garages,
		ElectricityVA:     p.ElectricityVA,
		WaterSource:       p.WaterSource,
		Certificate:       p.Certificate,
		Furnishing:        p.Furnishing,
		Facing:            p.Facing,
		YearBuilt:         p.YearBuilt,
		VideoURL:          p.VideoURL,
		UpdatedAt:         p.UpdatedAt,
		Facilities:        make([]DetailFacility, 0, len(p.Facilities)),
		Images:            make([]DetailImage, 0, len(p.Images)),
	}

	if p.PropertyType != nil {
		d.PropertyType = RefMini{
			ID:     p.PropertyType.ID,
			Slug:   p.PropertyType.Slug,
			NameID: p.PropertyType.NameID,
			NameEN: p.PropertyType.NameEN,
		}
	}
	d.Location = Location{
		District: p.District,
	}
	if p.City != nil {
		d.Location.City = PlaceMini{ID: p.City.ID, Slug: p.City.Slug, Name: p.City.Name}
	}
	if p.Province != nil {
		d.Location.Province = PlaceMini{ID: int32(p.Province.ID), Slug: p.Province.Slug, Name: p.Province.Name}
	}

	if p.Agent != nil {
		d.Agent = DetailAgent{
			AgentCode:      p.Agent.AgentCode,
			WhatsappNumber: p.Agent.WhatsappNumber,
		}
		if p.Agent.User != nil {
			d.Agent.Name = p.Agent.User.Name
			if p.Agent.User.AvatarKey != nil {
				url := storage.URL(r.mediaURL, *p.Agent.User.AvatarKey)
				d.Agent.PhotoURL = &url
			}
		}
	}

	for _, img := range p.Images {
		url := storage.URL(r.mediaURL, img.ObjectKey)
		d.Images = append(d.Images, DetailImage{
			ID:        img.ID.String(),
			URL:       url,
			Width:     img.Width,
			Height:    img.Height,
			SortOrder: img.SortOrder,
			IsCover:   img.IsCover,
		})
		if img.IsCover || d.CoverImage == nil {
			d.CoverImage = &ImageMini{
				URL:    url,
				Width:  img.Width,
				Height: img.Height,
			}
		}
	}
	d.ImageCount = int64(len(p.Images))

	for _, f := range p.Facilities {
		d.Facilities = append(d.Facilities, DetailFacility{
			ID:     f.ID,
			Slug:   f.Slug,
			NameID: f.NameID,
			NameEN: f.NameEN,
			Icon:   f.Icon,
		})
	}

	return d
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

// --- Dashboard Implementations (API.md §12) ---

func (r *gormRepository) GetAgentIDByUserID(ctx context.Context, userID uuid.UUID) (*uuid.UUID, error) {
	var agent models.Agent
	err := r.db.WithContext(ctx).Select("id").Where("user_id = ?", userID).Take(&agent).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &agent.ID, nil
}

func (r *gormRepository) ListDashboard(ctx context.Context, agentID *uuid.UUID, q DashboardListQuery, p pagination.Params) ([]DashboardPropertyItem, int64, error) {
	query := r.db.WithContext(ctx).Table("properties p").
		Joins("JOIN property_types pt ON pt.id = p.property_type_id").
		Joins("JOIN cities c ON c.id = p.city_id").
		Joins("JOIN provinces pr ON pr.id = p.province_id").
		Joins("JOIN agents a ON a.id = p.agent_id").
		Joins("JOIN users u ON u.id = a.user_id").
		Where("p.deleted_at IS NULL")

	if agentID != nil {
		query = query.Where("p.agent_id = ?", *agentID)
	} else if q.AgentID != nil && *q.AgentID != "" {
		if aid, err := uuid.Parse(*q.AgentID); err == nil {
			query = query.Where("p.agent_id = ?", aid)
		}
	}

	if q.Q != "" {
		like := "%" + escapeLike(strings.TrimSpace(q.Q)) + "%"
		query = query.Where("p.title ILIKE ? OR p.code ILIKE ? OR p.address ILIKE ?", like, like, like)
	}
	if q.Status != "" {
		statuses := splitList(q.Status)
		if len(statuses) > 0 {
			query = query.Where("p.status IN (?)", statuses)
		}
	}
	if q.ListingType != "" {
		query = query.Where("p.listing_type = ?", q.ListingType)
	}
	if q.MarketType != "" {
		query = query.Where("p.market_type = ?", q.MarketType)
	}
	if q.PropertyType != "" {
		types := splitList(q.PropertyType)
		if len(types) > 0 {
			query = query.Where("pt.slug IN (?)", types)
		}
	}
	if q.City != "" {
		cities := splitList(q.City)
		if len(cities) > 0 {
			query = query.Where("c.slug IN (?)", cities)
		}
	}
	if q.MinPrice != nil {
		query = query.Where("p.price >= ?", *q.MinPrice)
	}
	if q.MaxPrice != nil {
		query = query.Where("p.price <= ?", *q.MaxPrice)
	}
	if q.CreatedFrom != "" {
		if t, err := time.Parse("2006-01-02", q.CreatedFrom); err == nil {
			query = query.Where("p.created_at >= ?", t.UTC())
		}
	}
	if q.CreatedTo != "" {
		if t, err := time.Parse("2006-01-02", q.CreatedTo); err == nil {
			query = query.Where("p.created_at < ?", t.Add(24*time.Hour).UTC())
		}
	}

	var total int64
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	if total == 0 {
		return []DashboardPropertyItem{}, 0, nil
	}

	sortClause := "p.created_at DESC, p.id DESC"
	switch q.Sort {
	case "price_asc":
		sortClause = "p.price ASC, p.id DESC"
	case "price_desc":
		sortClause = "p.price DESC, p.id DESC"
	case "popular":
		sortClause = "p.view_count DESC, p.created_at DESC, p.id DESC"
	case "land_area_desc":
		sortClause = "p.land_area DESC NULLS LAST, p.id DESC"
	}

	type dashRow struct {
		ID                 string
		Code               string
		Slug               string
		Title              string
		Status             models.PropertyStatus
		ListingType        models.ListingType
		MarketType         models.MarketType
		Price              int64
		RentPeriod         *models.RentPeriod
		IsPriceNegotiable  bool
		District           *string
		CityID             int32
		CitySlug           string
		CityName           string
		ProvinceID         int16
		ProvinceSlug       string
		ProvinceName       string
		LandArea           *float64
		BuildingArea       *float64
		Bedrooms           *int16
		Bathrooms          *int16
		TotalRooms         *int16
		ViewCount          int32
		WhatsappClickCount int32
		PublishedAt        *time.Time
		CreatedAt          time.Time
		UpdatedAt          time.Time
		TypeID             int16
		TypeSlug           string
		TypeNameID         string
		TypeNameEN         string
		AgentID            string
		AgentCode          string
		AgentName          string
		AgentPhotoKey      *string
		AgentWhatsapp      string
		AgentStatus        string
		CoverKey           *string
		CoverWidth         *int32
		CoverHeight        *int32
		ImageCount         int64
	}

	var rows []dashRow
	err := query.Select(`
		p.id, p.code, p.slug, p.title, p.status, p.listing_type, p.market_type,
		p.price, p.rent_period, p.is_price_negotiable, p.district,
		c.id as city_id, c.slug as city_slug, c.name as city_name,
		pr.id as province_id, pr.slug as province_slug, pr.name as province_name,
		p.land_area, p.building_area, p.bedrooms, p.bathrooms, p.total_rooms,
		p.view_count, p.whatsapp_click_count, p.published_at, p.created_at, p.updated_at,
		pt.id as type_id, pt.slug as type_slug, pt.name_id as type_name_id, pt.name_en as type_name_en,
		a.id as agent_id, a.agent_code, u.name as agent_name, u.avatar_key as agent_photo_key, a.whatsapp_number as agent_whatsapp, u.status as agent_status,
		(SELECT pi.object_key FROM property_images pi WHERE pi.property_id = p.id ORDER BY pi.is_cover DESC, pi.sort_order ASC, pi.created_at ASC LIMIT 1) as cover_key,
		(SELECT pi.width FROM property_images pi WHERE pi.property_id = p.id ORDER BY pi.is_cover DESC, pi.sort_order ASC, pi.created_at ASC LIMIT 1) as cover_width,
		(SELECT pi.height FROM property_images pi WHERE pi.property_id = p.id ORDER BY pi.is_cover DESC, pi.sort_order ASC, pi.created_at ASC LIMIT 1) as cover_height,
		(SELECT COUNT(*) FROM property_images pi WHERE pi.property_id = p.id) as image_count
	`).Order(sortClause).
		Limit(p.PerPage).
		Offset(p.Offset()).
		Scan(&rows).Error

	if err != nil {
		return nil, 0, err
	}

	items := make([]DashboardPropertyItem, len(rows))
	for i, row := range rows {
		var cover *ImageMini
		if row.CoverKey != nil && *row.CoverKey != "" && row.CoverWidth != nil && row.CoverHeight != nil {
			cover = &ImageMini{
				URL:    fmt.Sprintf("%s/%s", strings.TrimRight(r.mediaURL, "/"), *row.CoverKey),
				Width:  *row.CoverWidth,
				Height: *row.CoverHeight,
			}
		}

		var agentPhoto *string
		if row.AgentPhotoKey != nil && *row.AgentPhotoKey != "" {
			url := fmt.Sprintf("%s/%s", strings.TrimRight(r.mediaURL, "/"), *row.AgentPhotoKey)
			agentPhoto = &url
		}

		items[i] = DashboardPropertyItem{
			ID:          row.ID,
			Code:        row.Code,
			Slug:        row.Slug,
			Title:       row.Title,
			Status:      row.Status,
			ListingType: row.ListingType,
			MarketType:  row.MarketType,
			PropertyType: RefMini{
				ID:     row.TypeID,
				Slug:   row.TypeSlug,
				NameID: row.TypeNameID,
				NameEN: row.TypeNameEN,
			},
			Price:             row.Price,
			RentPeriod:        row.RentPeriod,
			IsPriceNegotiable: row.IsPriceNegotiable,
			Location: Location{
				District: row.District,
				City:     PlaceMini{ID: row.CityID, Slug: row.CitySlug, Name: row.CityName},
				Province: PlaceMini{ID: int32(row.ProvinceID), Slug: row.ProvinceSlug, Name: row.ProvinceName},
			},
			LandArea:     row.LandArea,
			BuildingArea: row.BuildingArea,
			Bedrooms:     row.Bedrooms,
			Bathrooms:    row.Bathrooms,
			TotalRooms:   row.TotalRooms,
			CoverImage:   cover,
			ImageCount:   row.ImageCount,
			Agent: DashboardAgent{
				ID:             row.AgentID,
				AgentCode:      row.AgentCode,
				Name:           row.AgentName,
				PhotoURL:       agentPhoto,
				WhatsappNumber: row.AgentWhatsapp,
				Status:         row.AgentStatus,
			},
			ViewCount:          row.ViewCount,
			WhatsappClickCount: row.WhatsappClickCount,
			PublishedAt:        row.PublishedAt,
			CreatedAt:          row.CreatedAt,
			UpdatedAt:          row.UpdatedAt,
		}
	}

	return items, total, nil
}

func (r *gormRepository) GetByID(ctx context.Context, id uuid.UUID, agentID *uuid.UUID) (*models.Property, error) {
	var prop models.Property
	query := r.db.WithContext(ctx).
		Preload("PropertyType").
		Preload("Province").
		Preload("City").
		Preload("Facilities").
		Preload("Images", func(db *gorm.DB) *gorm.DB {
			return db.Order("is_cover DESC, sort_order ASC, created_at ASC")
		}).
		Preload("Agent.User").
		Where("id = ? AND deleted_at IS NULL", id)

	if agentID != nil {
		query = query.Where("agent_id = ?", *agentID)
	}

	if err := query.First(&prop).Error; err != nil {
		return nil, err
	}
	return &prop, nil
}

func (r *gormRepository) Create(ctx context.Context, prop *models.Property, facilityIDs []int16) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var seq int64
		if err := tx.Raw("SELECT nextval('property_code_seq')").Scan(&seq).Error; err != nil {
			return fmt.Errorf("nextval: %w", err)
		}
		prop.Code = fmt.Sprintf("MP-%06d", seq)

		slugStr, err := slug.ForProperty(prop.Title)
		if err != nil {
			return fmt.Errorf("slug: %w", err)
		}
		prop.Slug = slugStr

		if prop.ID == uuid.Nil {
			prop.ID = uuid.New()
		}
		prop.Status = models.StatusDraft

		if err := tx.Create(prop).Error; err != nil {
			return err
		}

		if len(facilityIDs) > 0 {
			type propFacility struct {
				PropertyID uuid.UUID `gorm:"column:property_id"`
				FacilityID int16     `gorm:"column:facility_id"`
			}
			pfs := make([]propFacility, len(facilityIDs))
			for i, fid := range facilityIDs {
				pfs[i] = propFacility{PropertyID: prop.ID, FacilityID: fid}
			}
			if err := tx.Table("property_facilities").Create(&pfs).Error; err != nil {
				return err
			}
		}

		return nil
	})
}

func (r *gormRepository) Update(ctx context.Context, prop *models.Property, facilityIDs *[]int16, agentID *uuid.UUID) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var existing models.Property
		q := tx.Where("id = ? AND deleted_at IS NULL", prop.ID)
		if agentID != nil {
			q = q.Where("agent_id = ?", *agentID)
		}
		if err := q.First(&existing).Error; err != nil {
			return err
		}

		if err := tx.Model(&existing).Updates(prop).Error; err != nil {
			return err
		}

		if facilityIDs != nil {
			if err := tx.Exec("DELETE FROM property_facilities WHERE property_id = ?", prop.ID).Error; err != nil {
				return err
			}
			if len(*facilityIDs) > 0 {
				type propFacility struct {
					PropertyID uuid.UUID `gorm:"column:property_id"`
					FacilityID int16     `gorm:"column:facility_id"`
				}
				pfs := make([]propFacility, len(*facilityIDs))
				for i, fid := range *facilityIDs {
					pfs[i] = propFacility{PropertyID: prop.ID, FacilityID: fid}
				}
				if err := tx.Table("property_facilities").Create(&pfs).Error; err != nil {
					return err
				}
			}
		}

		return nil
	})
}

func (r *gormRepository) UpdateStatus(ctx context.Context, id uuid.UUID, status models.PropertyStatus, updaterID uuid.UUID, agentID *uuid.UUID) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var existing models.Property
		q := tx.Where("id = ? AND deleted_at IS NULL", id)
		if agentID != nil {
			q = q.Where("agent_id = ?", *agentID)
		}
		if err := q.First(&existing).Error; err != nil {
			return err
		}

		updates := map[string]interface{}{
			"status":     status,
			"updated_by": updaterID,
			"updated_at": time.Now().UTC(),
		}

		now := time.Now().UTC()
		if status == models.StatusActive {
			if existing.PublishedAt == nil {
				updates["published_at"] = now
			}
			updates["closed_at"] = nil
		}
		if status == models.StatusSold || status == models.StatusRented {
			updates["closed_at"] = now
		}

		return tx.Model(&existing).Updates(updates).Error
	})
}

func (r *gormRepository) SoftDelete(ctx context.Context, id uuid.UUID, deleterID uuid.UUID) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var existing models.Property
		if err := tx.Where("id = ? AND deleted_at IS NULL", id).First(&existing).Error; err != nil {
			return err
		}

		now := time.Now().UTC()
		if err := tx.Model(&existing).Updates(map[string]interface{}{
			"deleted_at": now,
			"updated_by": deleterID,
			"updated_at": now,
		}).Error; err != nil {
			return err
		}

		audit := models.AuditLog{
			ActorUserID: &deleterID,
			Action:      "property.delete",
			EntityType:  "property",
			EntityID:    &id,
			CreatedAt:   now,
		}
		return tx.Create(&audit).Error
	})
}

func (r *gormRepository) AddImages(ctx context.Context, propertyID uuid.UUID, images []models.PropertyImage, agentID *uuid.UUID) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var prop models.Property
		q := tx.Where("id = ? AND deleted_at IS NULL", propertyID)
		if agentID != nil {
			q = q.Where("agent_id = ?", *agentID)
		}
		if err := q.First(&prop).Error; err != nil {
			return err
		}

		var count int64
		if err := tx.Model(&models.PropertyImage{}).Where("property_id = ?", propertyID).Count(&count).Error; err != nil {
			return err
		}

		if count+int64(len(images)) > 20 {
			return errors.New("IMAGE_LIMIT_EXCEEDED")
		}

		var hasCover bool
		if err := tx.Model(&models.PropertyImage{}).Select("COUNT(*) > 0").
			Where("property_id = ? AND is_cover = true", propertyID).Scan(&hasCover).Error; err != nil {
			return err
		}

		for i := range images {
			images[i].ID = uuid.New()
			images[i].PropertyID = propertyID
			order := count + int64(i) + 1
			if order > math.MaxInt16 || order < 0 {
				order = math.MaxInt16
			}
			images[i].SortOrder = int16(order)
			images[i].CreatedAt = time.Now().UTC()
			if !hasCover && i == 0 {
				images[i].IsCover = true
				hasCover = true
			}
		}

		return tx.Create(&images).Error
	})
}

func (r *gormRepository) ReorderImages(ctx context.Context, propertyID uuid.UUID, order []uuid.UUID, coverImageID uuid.UUID, agentID *uuid.UUID) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var prop models.Property
		q := tx.Where("id = ? AND deleted_at IS NULL", propertyID)
		if agentID != nil {
			q = q.Where("agent_id = ?", *agentID)
		}
		if err := q.First(&prop).Error; err != nil {
			return err
		}

		var existingImages []models.PropertyImage
		if err := tx.Where("property_id = ?", propertyID).Find(&existingImages).Error; err != nil {
			return err
		}
		if len(existingImages) != len(order) {
			return errors.New("order count mismatch")
		}

		idMap := make(map[uuid.UUID]bool, len(existingImages))
		for _, img := range existingImages {
			idMap[img.ID] = true
		}
		for _, id := range order {
			if !idMap[id] {
				return errors.New("invalid image id in order")
			}
		}
		if !idMap[coverImageID] {
			return errors.New("cover image not in listing")
		}

		for idx, imgID := range order {
			isCover := imgID == coverImageID
			if err := tx.Model(&models.PropertyImage{}).
				Where("id = ? AND property_id = ?", imgID, propertyID).
				Updates(map[string]interface{}{
					"sort_order": int16(idx + 1),
					"is_cover":   isCover,
				}).Error; err != nil {
				return err
			}
		}

		return nil
	})
}

func (r *gormRepository) DeleteImage(ctx context.Context, propertyID uuid.UUID, imageID uuid.UUID, agentID *uuid.UUID) (string, error) {
	var key string
	err := r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var prop models.Property
		q := tx.Where("id = ? AND deleted_at IS NULL", propertyID)
		if agentID != nil {
			q = q.Where("agent_id = ?", *agentID)
		}
		if err := q.First(&prop).Error; err != nil {
			return err
		}

		var count int64
		if err := tx.Model(&models.PropertyImage{}).Where("property_id = ?", propertyID).Count(&count).Error; err != nil {
			return err
		}
		if prop.Status == models.StatusActive && count <= 1 {
			return errors.New("CANNOT_DELETE_LAST_IMAGE_ACTIVE")
		}

		var img models.PropertyImage
		if err := tx.Where("id = ? AND property_id = ?", imageID, propertyID).First(&img).Error; err != nil {
			return err
		}
		key = img.ObjectKey

		if err := tx.Delete(&img).Error; err != nil {
			return err
		}

		if img.IsCover && count > 1 {
			var nextImg models.PropertyImage
			if err := tx.Where("property_id = ?", propertyID).Order("sort_order ASC").First(&nextImg).Error; err == nil {
				if err := tx.Model(&nextImg).Update("is_cover", true).Error; err != nil {
					return err
				}
			}
		}

		return nil
	})
	return key, err
}

func (r *gormRepository) CountImages(ctx context.Context, propertyID uuid.UUID) (int64, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&models.PropertyImage{}).Where("property_id = ?", propertyID).Count(&count).Error
	return count, err
}

func (r *gormRepository) GetPropertyType(ctx context.Context, id int16) (*models.PropertyType, error) {
	var pt models.PropertyType
	if err := r.db.WithContext(ctx).First(&pt, id).Error; err != nil {
		return nil, err
	}
	return &pt, nil
}

func (r *gormRepository) CheckCityInProvince(ctx context.Context, cityID int32, provinceID int16) (bool, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&models.City{}).Where("id = ? AND province_id = ?", cityID, provinceID).Count(&count).Error
	return count > 0, err
}

func (r *gormRepository) GetFirstActiveAgentID(ctx context.Context) (*uuid.UUID, error) {
	var agent models.Agent
	err := r.db.WithContext(ctx).Table("agents a").
		Joins("JOIN users u ON u.id = a.user_id").
		Where("u.status = ?", models.UserActive).
		Order("a.created_at ASC").
		Take(&agent).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &agent.ID, nil
}
