package report

import (
	"context"
	"strings"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Repository interface untuk modul report.
type Repository interface {
	GetPropertiesForExport(ctx context.Context, q ExportQuery) ([]ExportPropertyRow, error)
	GetSummaryStats(ctx context.Context) (*SummaryStats, error)
	GetUserName(ctx context.Context, userID uuid.UUID) (string, error)
}

type gormRepository struct {
	db *gorm.DB
}

// NewRepository membuat instance baru ReportRepository.
func NewRepository(db *gorm.DB) Repository {
	return &gormRepository{db: db}
}

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

func (r *gormRepository) GetPropertiesForExport(ctx context.Context, q ExportQuery) ([]ExportPropertyRow, error) {
	query := r.db.WithContext(ctx).Table("properties p").
		Joins("JOIN property_types pt ON pt.id = p.property_type_id").
		Joins("JOIN cities c ON c.id = p.city_id").
		Joins("JOIN provinces pr ON pr.id = p.province_id").
		Joins("JOIN agents a ON a.id = p.agent_id").
		Joins("JOIN users u ON u.id = a.user_id").
		Where("p.deleted_at IS NULL")

	if q.AgentID != nil && *q.AgentID != "" {
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
			query = query.Where("p.status IN ?", statuses)
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
			query = query.Where("pt.slug IN ?", types)
		}
	}

	if q.City != "" {
		normalizedCity := strings.ReplaceAll(strings.ToLower(strings.TrimSpace(q.City)), " ", "")
		query = query.Where(
			"c.slug = ? OR c.name ILIKE ? OR REPLACE(LOWER(c.name), ' ', '') LIKE ?",
			q.City,
			"%"+q.City+"%",
			"%"+normalizedCity+"%",
		)
	}

	if q.MinPrice != nil {
		query = query.Where("p.price >= ?", *q.MinPrice)
	}
	if q.MaxPrice != nil {
		query = query.Where("p.price <= ?", *q.MaxPrice)
	}

	if q.CreatedFrom != "" {
		if t, err := time.Parse("2006-01-02", q.CreatedFrom); err == nil {
			query = query.Where("p.created_at >= ?", t)
		}
	}
	if q.CreatedTo != "" {
		if t, err := time.Parse("2006-01-02", q.CreatedTo); err == nil {
			query = query.Where("p.created_at <= ?", t.Add(24*time.Hour-time.Nanosecond))
		}
	}

	sortClause := "p.created_at DESC, p.id DESC"
	switch q.Sort {
	case "price_asc":
		sortClause = "p.price ASC, p.id DESC"
	case "price_desc":
		sortClause = "p.price DESC, p.id DESC"
	case "popular":
		sortClause = "p.view_count DESC, p.id DESC"
	case "land_area_desc":
		sortClause = "p.land_area DESC NULLS LAST, p.id DESC"
	}

	type dbRow struct {
		Code               string
		Title              string
		Slug               string
		ListingType        string
		MarketType         string
		PropertyTypeName   string
		Province           string
		City               string
		District           *string
		Address            *string
		Price              int64
		RentPeriod         *string
		IsPriceNegotiable  bool
		LandArea           *float64
		BuildingArea       *float64
		Bedrooms           *int16
		Bathrooms          *int16
		Certificate        *string
		Furnishing         *string
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

	var rawRows []dbRow
	err := query.Select(`
		p.code, p.title, p.slug, p.listing_type, p.market_type,
		pt.name_id as property_type_name,
		pr.name as province, c.name as city, p.district, p.address,
		p.price, p.rent_period, p.is_price_negotiable,
		p.land_area, p.building_area, p.bedrooms, p.bathrooms,
		p.certificate, p.furnishing, p.status,
		u.name as agent_name, a.agent_code, a.whatsapp_number as agent_whatsapp,
		p.view_count, p.whatsapp_click_count,
		p.published_at, p.closed_at, p.created_at, p.updated_at
	`).Order(sortClause).
		Limit(10001). // Maksimal 10.000 (ambil 10.001 untuk cek overflow)
		Scan(&rawRows).Error

	if err != nil {
		return nil, err
	}

	rows := make([]ExportPropertyRow, len(rawRows))
	for i, r := range rawRows {
		district := "-"
		if r.District != nil && *r.District != "" {
			district = *r.District
		}
		address := "-"
		if r.Address != nil && *r.Address != "" {
			address = *r.Address
		}
		rentPeriod := "-"
		if r.RentPeriod != nil && *r.RentPeriod != "" {
			switch *r.RentPeriod {
			case "monthly":
				rentPeriod = "Bulan"
			case "yearly":
				rentPeriod = "Tahun"
			default:
				rentPeriod = *r.RentPeriod
			}
		}
		certificate := "-"
		if r.Certificate != nil && *r.Certificate != "" {
			certificate = strings.ToUpper(*r.Certificate)
		}
		furnishing := "-"
		if r.Furnishing != nil && *r.Furnishing != "" {
			switch *r.Furnishing {
			case "unfurnished":
				furnishing = "Unfurnished"
			case "semi_furnished":
				furnishing = "Semi Furnished"
			case "full_furnished":
				furnishing = "Full Furnished"
			default:
				furnishing = *r.Furnishing
			}
		}

		listingType := "Jual"
		if r.ListingType == "rent" {
			listingType = "Sewa"
		}

		marketType := "Sekunder"
		if r.MarketType == "primary" {
			marketType = "Primer"
		}

		statusLabel := r.Status
		switch r.Status {
		case "active":
			statusLabel = "Tayang"
		case "draft":
			statusLabel = "Draf"
		case "sold":
			statusLabel = "Terjual"
		case "rented":
			statusLabel = "Tersewa"
		case "inactive":
			statusLabel = "Nonaktif"
		}

		rows[i] = ExportPropertyRow{
			Code:               r.Code,
			Title:              r.Title,
			Slug:               r.Slug,
			ListingType:        listingType,
			MarketType:         marketType,
			PropertyTypeName:   r.PropertyTypeName,
			Province:           r.Province,
			City:               r.City,
			District:           district,
			Address:            address,
			Price:              r.Price,
			RentPeriod:         rentPeriod,
			IsPriceNegotiable:  r.IsPriceNegotiable,
			LandArea:           r.LandArea,
			BuildingArea:       r.BuildingArea,
			Bedrooms:           r.Bedrooms,
			Bathrooms:          r.Bathrooms,
			Certificate:        certificate,
			Furnishing:         furnishing,
			Status:             statusLabel,
			AgentName:          r.AgentName,
			AgentCode:          r.AgentCode,
			AgentWhatsapp:      r.AgentWhatsapp,
			ViewCount:          r.ViewCount,
			WhatsappClickCount: r.WhatsappClickCount,
			PublishedAt:        r.PublishedAt,
			ClosedAt:           r.ClosedAt,
			CreatedAt:          r.CreatedAt,
			UpdatedAt:          r.UpdatedAt,
		}
	}

	return rows, nil
}

func (r *gormRepository) GetSummaryStats(ctx context.Context) (*SummaryStats, error) {
	stats := &SummaryStats{}

	// Status counts
	type statusRow struct {
		Status string
		Count  int64
	}
	var statusRows []statusRow
	if err := r.db.WithContext(ctx).Table("properties").
		Select("status, count(*) as count").
		Where("deleted_at IS NULL").
		Group("status").
		Scan(&statusRows).Error; err != nil {
		return nil, err
	}
	for _, sr := range statusRows {
		stats.TotalCount += sr.Count
		switch sr.Status {
		case "draft":
			stats.DraftCount = sr.Count
		case "active":
			stats.ActiveCount = sr.Count
		case "sold":
			stats.SoldCount = sr.Count
		case "rented":
			stats.RentedCount = sr.Count
		case "inactive":
			stats.InactiveCount = sr.Count
		}
	}

	// Listing type counts
	type listingTypeRow struct {
		ListingType string
		Count       int64
	}
	var ltRows []listingTypeRow
	if err := r.db.WithContext(ctx).Table("properties").
		Select("listing_type, count(*) as count").
		Where("deleted_at IS NULL").
		Group("listing_type").
		Scan(&ltRows).Error; err != nil {
		return nil, err
	}
	for _, lr := range ltRows {
		switch lr.ListingType {
		case "sale":
			stats.SaleCount = lr.Count
		case "rent":
			stats.RentCount = lr.Count
		}
	}

	// Type counts
	type typeRow struct {
		NameID string
		Count  int64
	}
	var tRows []typeRow
	if err := r.db.WithContext(ctx).Table("property_types pt").
		Select("pt.name_id, count(p.id) as count").
		Joins("LEFT JOIN properties p ON p.property_type_id = pt.id AND p.deleted_at IS NULL").
		Group("pt.id, pt.name_id, pt.sort_order").
		Order("pt.sort_order ASC").
		Scan(&tRows).Error; err != nil {
		return nil, err
	}
	for _, tr := range tRows {
		stats.TypeCounts = append(stats.TypeCounts, TypeCount{
			TypeName: tr.NameID,
			Count:    tr.Count,
		})
	}

	// Agent stats
	type agentRow struct {
		Name        string
		AgentCode   string
		ActiveCount int64
		SoldCount   int64
		RentedCount int64
		DraftCount  int64
		TotalCount  int64
	}
	var aRows []agentRow
	if err := r.db.WithContext(ctx).Table("agents a").
		Select(`
			u.name, a.agent_code,
			count(CASE WHEN p.status = 'active' THEN 1 END) as active_count,
			count(CASE WHEN p.status = 'sold' THEN 1 END) as sold_count,
			count(CASE WHEN p.status = 'rented' THEN 1 END) as rented_count,
			count(CASE WHEN p.status = 'draft' THEN 1 END) as draft_count,
			count(p.id) as total_count
		`).
		Joins("JOIN users u ON u.id = a.user_id").
		Joins("LEFT JOIN properties p ON p.agent_id = a.id AND p.deleted_at IS NULL").
		Group("a.id, u.name, a.agent_code").
		Order("total_count DESC, u.name ASC").
		Scan(&aRows).Error; err != nil {
		return nil, err
	}
	for _, ar := range aRows {
		stats.AgentStats = append(stats.AgentStats, AgentStat{
			AgentName:   ar.Name,
			AgentCode:   ar.AgentCode,
			ActiveCount: ar.ActiveCount,
			SoldCount:   ar.SoldCount,
			RentedCount: ar.RentedCount,
			DraftCount:  ar.DraftCount,
			TotalCount:  ar.TotalCount,
		})
	}

	return stats, nil
}

func (r *gormRepository) GetUserName(ctx context.Context, userID uuid.UUID) (string, error) {
	var name string
	err := r.db.WithContext(ctx).Table("users").Select("name").Where("id = ?", userID).Scan(&name).Error
	if err != nil {
		return "", err
	}
	if name == "" {
		return "Admin", nil
	}
	return name, nil
}
