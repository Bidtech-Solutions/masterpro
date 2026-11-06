package property

import (
	"context"
	"errors"
	"fmt"
	"image"
	_ "image/jpeg"
	_ "image/png"
	"mime/multipart"
	"net/http"
	"path/filepath"
	"strings"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/bidtech-solutions/masterpro/backend/internal/http/middleware"
	"github.com/bidtech-solutions/masterpro/backend/internal/models"
	"github.com/bidtech-solutions/masterpro/backend/internal/pkg/apperror"
	"github.com/bidtech-solutions/masterpro/backend/internal/pkg/pagination"
	"github.com/bidtech-solutions/masterpro/backend/internal/revalidate"
	"github.com/bidtech-solutions/masterpro/backend/internal/storage"
)

// Service aturan bisnis listing.
type Service interface {
	ListPublic(ctx context.Context, q PublicListQuery, p pagination.Params) ([]Card, pagination.Meta, error)
	GetPublicBySlug(ctx context.Context, slug string) (*Detail, error)
	ListSimilar(ctx context.Context, slug string, limit int) ([]Card, error)
	TrackPublicEvent(ctx context.Context, slug string, eventType string) error

	// Dashboard CRUD (API.md §12)
	ListDashboard(ctx context.Context, principal middleware.Principal, q DashboardListQuery, p pagination.Params) ([]DashboardPropertyItem, pagination.Meta, error)
	GetDetail(ctx context.Context, principal middleware.Principal, id uuid.UUID) (*PropertyDashboardDetail, error)
	Create(ctx context.Context, principal middleware.Principal, req CreatePropertyRequest) (*PropertyDashboardDetail, error)
	Update(ctx context.Context, principal middleware.Principal, id uuid.UUID, req UpdatePropertyRequest) (*PropertyDashboardDetail, error)
	UpdateStatus(ctx context.Context, principal middleware.Principal, id uuid.UUID, status models.PropertyStatus) (*PropertyDashboardDetail, error)
	Delete(ctx context.Context, principal middleware.Principal, id uuid.UUID) error
	UploadImages(ctx context.Context, principal middleware.Principal, propertyID uuid.UUID, files []*multipart.FileHeader) (*ImageUploadResult, error)
	ReorderImages(ctx context.Context, principal middleware.Principal, propertyID uuid.UUID, req ReorderImagesRequest) ([]DetailImage, error)
	DeleteImage(ctx context.Context, principal middleware.Principal, propertyID uuid.UUID, imageID uuid.UUID) error
}

type service struct {
	repo           Repository
	storage        *storage.Client
	reval          *revalidate.Client
	mediaPublicURL string
	sitePublicURL  string
}

// NewService membuat service.
func NewService(repo Repository, store *storage.Client, reval *revalidate.Client, mediaPublicURL, sitePublicURL string) Service {
	return &service{
		repo:           repo,
		storage:        store,
		reval:          reval,
		mediaPublicURL: strings.TrimRight(mediaPublicURL, "/"),
		sitePublicURL:  strings.TrimRight(sitePublicURL, "/"),
	}
}

func (s *service) ListPublic(ctx context.Context, q PublicListQuery, p pagination.Params) ([]Card, pagination.Meta, error) {
	if q.MinPrice != nil && q.MaxPrice != nil && *q.MinPrice > *q.MaxPrice {
		return nil, pagination.Meta{}, apperror.Validation(apperror.FieldError{
			Field: "min_price", Code: "max", Message: "Harga minimum tidak boleh melebihi harga maksimum",
		})
	}
	cards, total, err := s.repo.ListPublic(ctx, q, p)
	if err != nil {
		return nil, pagination.Meta{}, apperror.Internal(err)
	}
	if cards == nil {
		cards = []Card{}
	}
	return cards, pagination.NewMeta(p, total), nil
}

func (s *service) GetPublicBySlug(ctx context.Context, slug string) (*Detail, error) {
	slug = strings.TrimSpace(slug)
	if slug == "" {
		return nil, apperror.NotFound("Listing tidak ditemukan")
	}
	detail, err := s.repo.GetPublicBySlug(ctx, slug)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, apperror.NotFound("Listing tidak ditemukan")
		}
		return nil, apperror.Internal(err)
	}
	return detail, nil
}

func (s *service) ListSimilar(ctx context.Context, slug string, limit int) ([]Card, error) {
	slug = strings.TrimSpace(slug)
	if slug == "" {
		return []Card{}, nil
	}
	cards, err := s.repo.ListSimilar(ctx, slug, limit)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return []Card{}, nil
		}
		return nil, apperror.Internal(err)
	}
	if cards == nil {
		cards = []Card{}
	}
	return cards, nil
}

func (s *service) TrackPublicEvent(ctx context.Context, slug string, eventType string) error {
	slug = strings.TrimSpace(slug)
	if slug == "" {
		return apperror.NotFound("Listing tidak ditemukan")
	}
	if eventType != "view" && eventType != "whatsapp_click" {
		return apperror.Validation(apperror.FieldError{
			Field: "type", Code: "oneof", Message: "Tipe event harus view atau whatsapp_click",
		})
	}
	if err := s.repo.IncrementPublicCounter(ctx, slug, eventType); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return apperror.NotFound("Listing tidak ditemukan")
		}
		return apperror.Internal(err)
	}
	return nil
}

// --- Dashboard Implementations ---

func (s *service) ListDashboard(ctx context.Context, principal middleware.Principal, q DashboardListQuery, p pagination.Params) ([]DashboardPropertyItem, pagination.Meta, error) {
	var agentID *uuid.UUID
	if principal.Role == models.RoleAgent {
		aid, err := s.repo.GetAgentIDByUserID(ctx, principal.UserID)
		if err != nil {
			return nil, pagination.Meta{}, apperror.Internal(err)
		}
		if aid == nil {
			return []DashboardPropertyItem{}, pagination.NewMeta(p, 0), nil
		}
		agentID = aid
	}

	items, total, err := s.repo.ListDashboard(ctx, agentID, q, p)
	if err != nil {
		return nil, pagination.Meta{}, apperror.Internal(err)
	}
	return items, pagination.NewMeta(p, total), nil
}

func (s *service) GetDetail(ctx context.Context, principal middleware.Principal, id uuid.UUID) (*PropertyDashboardDetail, error) {
	var agentID *uuid.UUID
	if principal.Role == models.RoleAgent {
		aid, err := s.repo.GetAgentIDByUserID(ctx, principal.UserID)
		if err != nil {
			return nil, apperror.Internal(err)
		}
		if aid == nil {
			return nil, apperror.NotFound("Listing tidak ditemukan")
		}
		agentID = aid
	}

	prop, err := s.repo.GetByID(ctx, id, agentID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, apperror.NotFound("Listing tidak ditemukan")
		}
		return nil, apperror.Internal(err)
	}

	return s.toDashboardDetail(prop), nil
}

func (s *service) Create(ctx context.Context, principal middleware.Principal, req CreatePropertyRequest) (*PropertyDashboardDetail, error) {
	var targetAgentID uuid.UUID
	if principal.Role == models.RoleAgent {
		aid, err := s.repo.GetAgentIDByUserID(ctx, principal.UserID)
		if err != nil {
			return nil, apperror.Internal(err)
		}
		if aid == nil {
			return nil, apperror.Forbidden()
		}
		targetAgentID = *aid
	} else {
		if req.AgentID == nil || *req.AgentID == "" {
			firstAid, err := s.repo.GetFirstActiveAgentID(ctx)
			if err != nil || firstAid == nil {
				return nil, apperror.Validation(apperror.FieldError{
					Field: "agent_id", Code: "required", Message: "Agen wajib dipilih oleh admin",
				})
			}
			targetAgentID = *firstAid
		} else {
			aid, err := uuid.Parse(*req.AgentID)
			if err != nil {
				return nil, apperror.Validation(apperror.FieldError{
					Field: "agent_id", Code: "invalid", Message: "Format ID agen tidak valid",
				})
			}
			targetAgentID = aid
		}
	}

	pt, err := s.repo.GetPropertyType(ctx, req.PropertyTypeID)
	if err != nil {
		return nil, apperror.Validation(apperror.FieldError{
			Field: "property_type_id", Code: "not_found", Message: "Tipe properti tidak ditemukan",
		})
	}

	if req.ListingType == models.ListingSale && !pt.AllowSale {
		return nil, apperror.New(http.StatusUnprocessableEntity, "TYPE_NOT_ALLOWED_FOR_LISTING", "Tipe properti ini tidak mengizinkan penjualan")
	}
	if req.ListingType == models.ListingRent && !pt.AllowRent {
		return nil, apperror.New(http.StatusUnprocessableEntity, "TYPE_NOT_ALLOWED_FOR_LISTING", "Tipe properti ini tidak mengizinkan penyewaan")
	}
	if req.ListingType == models.ListingRent && req.RentPeriod == nil {
		return nil, apperror.Validation(apperror.FieldError{
			Field: "rent_period", Code: "required", Message: "Periode sewa wajib diisi untuk listing sewa",
		})
	}

	ok, err := s.repo.CheckCityInProvince(ctx, req.CityID, req.ProvinceID)
	if err != nil || !ok {
		return nil, apperror.Validation(apperror.FieldError{
			Field: "city_id", Code: "invalid_province", Message: "Kota tidak berada di provinsi yang dipilih",
		})
	}

	if req.VideoURL != nil && *req.VideoURL != "" {
		v := *req.VideoURL
		if !strings.Contains(v, "youtube.com") && !strings.Contains(v, "youtu.be") {
			return nil, apperror.Validation(apperror.FieldError{
				Field: "video_url", Code: "invalid_domain", Message: "URL video hanya boleh dari YouTube",
			})
		}
	}

	if pt.Slug == "tanah" && (req.Bedrooms != nil || req.Bathrooms != nil || req.BuildingArea != nil || req.Floors != nil || req.FloorLevel != nil) {
		return nil, apperror.New(http.StatusUnprocessableEntity, "not_allowed_for_type", "Spesifikasi bangunan tidak diizinkan untuk tipe tanah")
	}
	if pt.Slug != "apartemen" && req.FloorLevel != nil {
		return nil, apperror.New(http.StatusUnprocessableEntity, "not_allowed_for_type", "Lantai unit (floor_level) hanya untuk tipe apartemen")
	}

	prop := models.Property{
		ID:                uuid.New(),
		AgentID:           targetAgentID,
		CreatedBy:         principal.UserID,
		ListingType:       req.ListingType,
		MarketType:        req.MarketType,
		PropertyTypeID:    req.PropertyTypeID,
		Status:            models.StatusDraft,
		Title:             strings.TrimSpace(req.Title),
		Description:       strings.TrimSpace(req.Description),
		Price:             req.Price,
		RentPeriod:        req.RentPeriod,
		IsPriceNegotiable: req.IsPriceNegotiable,
		ProvinceID:        req.ProvinceID,
		CityID:            req.CityID,
		District:          req.District,
		Address:           req.Address,
		Latitude:          req.Latitude,
		Longitude:         req.Longitude,
		LandArea:          req.LandArea,
		BuildingArea:      req.BuildingArea,
		Bedrooms:          req.Bedrooms,
		Bathrooms:         req.Bathrooms,
		MaidBedrooms:      req.MaidBedrooms,
		Floors:            req.Floors,
		FloorLevel:        req.FloorLevel,
		TotalRooms:        req.TotalRooms,
		Carports:          req.Carports,
		Garages:           req.Garages,
		ElectricityVA:     req.ElectricityVA,
		WaterSource:       req.WaterSource,
		Certificate:       req.Certificate,
		Furnishing:        req.Furnishing,
		Facing:            req.Facing,
		YearBuilt:         req.YearBuilt,
		VideoURL:          req.VideoURL,
		CreatedAt:         time.Now().UTC(),
		UpdatedAt:         time.Now().UTC(),
	}

	if err := s.repo.Create(ctx, &prop, req.FacilityIDs); err != nil {
		return nil, apperror.Internal(err)
	}

	if s.reval != nil {
		s.reval.Trigger(revalidate.TagPropertiesList)
	}

	return s.GetDetail(ctx, principal, prop.ID)
}

func (s *service) Update(ctx context.Context, principal middleware.Principal, id uuid.UUID, req UpdatePropertyRequest) (*PropertyDashboardDetail, error) {
	var agentID *uuid.UUID
	if principal.Role == models.RoleAgent {
		if req.AgentID != nil {
			return nil, apperror.Forbidden()
		}
		aid, err := s.repo.GetAgentIDByUserID(ctx, principal.UserID)
		if err != nil {
			return nil, apperror.Internal(err)
		}
		if aid == nil {
			return nil, apperror.NotFound("Listing tidak ditemukan")
		}
		agentID = aid
	}

	existing, err := s.repo.GetByID(ctx, id, agentID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, apperror.NotFound("Listing tidak ditemukan")
		}
		return nil, apperror.Internal(err)
	}

	if req.Title != nil {
		existing.Title = strings.TrimSpace(*req.Title)
	}
	if req.Description != nil {
		existing.Description = strings.TrimSpace(*req.Description)
	}
	if req.Price != nil {
		existing.Price = *req.Price
	}
	if req.ListingType != nil {
		existing.ListingType = *req.ListingType
	}
	if req.MarketType != nil {
		existing.MarketType = *req.MarketType
	}
	if req.PropertyTypeID != nil {
		existing.PropertyTypeID = *req.PropertyTypeID
	}
	if req.RentPeriod != nil {
		existing.RentPeriod = req.RentPeriod
	}
	if req.IsPriceNegotiable != nil {
		existing.IsPriceNegotiable = *req.IsPriceNegotiable
	}
	if req.ProvinceID != nil {
		existing.ProvinceID = *req.ProvinceID
	}
	if req.CityID != nil {
		existing.CityID = *req.CityID
	}
	if req.District != nil {
		existing.District = req.District
	}
	if req.Address != nil {
		existing.Address = req.Address
	}
	if req.Latitude != nil {
		existing.Latitude = req.Latitude
	}
	if req.Longitude != nil {
		existing.Longitude = req.Longitude
	}
	if req.LandArea != nil {
		existing.LandArea = req.LandArea
	}
	if req.BuildingArea != nil {
		existing.BuildingArea = req.BuildingArea
	}
	if req.Bedrooms != nil {
		existing.Bedrooms = req.Bedrooms
	}
	if req.Bathrooms != nil {
		existing.Bathrooms = req.Bathrooms
	}
	if req.MaidBedrooms != nil {
		existing.MaidBedrooms = req.MaidBedrooms
	}
	if req.Floors != nil {
		existing.Floors = req.Floors
	}
	if req.FloorLevel != nil {
		existing.FloorLevel = req.FloorLevel
	}
	if req.TotalRooms != nil {
		existing.TotalRooms = req.TotalRooms
	}
	if req.Carports != nil {
		existing.Carports = req.Carports
	}
	if req.Garages != nil {
		existing.Garages = req.Garages
	}
	if req.ElectricityVA != nil {
		existing.ElectricityVA = req.ElectricityVA
	}
	if req.WaterSource != nil {
		existing.WaterSource = req.WaterSource
	}
	if req.Certificate != nil {
		existing.Certificate = req.Certificate
	}
	if req.Furnishing != nil {
		existing.Furnishing = req.Furnishing
	}
	if req.Facing != nil {
		existing.Facing = req.Facing
	}
	if req.YearBuilt != nil {
		existing.YearBuilt = req.YearBuilt
	}
	if req.VideoURL != nil {
		existing.VideoURL = req.VideoURL
	}
	if principal.IsAdmin() && req.AgentID != nil && *req.AgentID != "" {
		if aid, err := uuid.Parse(*req.AgentID); err == nil {
			existing.AgentID = aid
		}
	}

	if existing.Status == models.StatusActive {
		errs := s.validatePublishRequirements(existing)
		if len(errs) > 0 {
			return nil, apperror.New(http.StatusUnprocessableEntity, apperror.CodePublishRequirementsNotMet, "Perubahan membuat listing tidak lagi memenuhi syarat tayang").WithDetails(errs...)
		}
	}

	existing.UpdatedBy = &principal.UserID
	existing.UpdatedAt = time.Now().UTC()

	if err := s.repo.Update(ctx, existing, req.FacilityIDs, agentID); err != nil {
		return nil, apperror.Internal(err)
	}

	if s.reval != nil {
		s.reval.Trigger(revalidate.TagPropertiesList, revalidate.PropertyTag(existing.Slug))
	}

	return s.GetDetail(ctx, principal, id)
}

func (s *service) UpdateStatus(ctx context.Context, principal middleware.Principal, id uuid.UUID, status models.PropertyStatus) (*PropertyDashboardDetail, error) {
	var agentID *uuid.UUID
	if principal.Role == models.RoleAgent {
		aid, err := s.repo.GetAgentIDByUserID(ctx, principal.UserID)
		if err != nil {
			return nil, apperror.Internal(err)
		}
		if aid == nil {
			return nil, apperror.NotFound("Listing tidak ditemukan")
		}
		agentID = aid
	}

	existing, err := s.repo.GetByID(ctx, id, agentID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, apperror.NotFound("Listing tidak ditemukan")
		}
		return nil, apperror.Internal(err)
	}

	valid := false
	switch existing.Status {
	case models.StatusDraft:
		valid = (status == models.StatusActive || status == models.StatusInactive)
	case models.StatusActive:
		valid = (status == models.StatusSold || status == models.StatusRented || status == models.StatusInactive)
	case models.StatusInactive:
		valid = (status == models.StatusActive || status == models.StatusDraft)
	case models.StatusSold, models.StatusRented:
		valid = (status == models.StatusInactive || status == models.StatusDraft || status == models.StatusActive)
	}
	if !valid {
		msg := fmt.Sprintf("Transisi status dari '%s' ke '%s' tidak diizinkan", existing.Status, status)
		if existing.Status == models.StatusDraft && (status == models.StatusSold || status == models.StatusRented) {
			msg = "Listing draf harus ditayangkan (active) terlebih dahulu sebelum dapat ditandai terjual atau tersewa"
		}
		return nil, apperror.New(http.StatusConflict, apperror.CodeInvalidStatusTransition, msg)
	}

	if status == models.StatusSold && existing.ListingType != models.ListingSale {
		return nil, apperror.New(http.StatusUnprocessableEntity, "INVALID_LISTING_TYPE_STATUS", "Status 'Terjual' hanya berlaku untuk properti bertipe Jual")
	}
	if status == models.StatusRented && existing.ListingType != models.ListingRent {
		return nil, apperror.New(http.StatusUnprocessableEntity, "INVALID_LISTING_TYPE_STATUS", "Status 'Tersewa' hanya berlaku untuk properti bertipe Sewa")
	}

	if status == models.StatusActive {
		errs := s.validatePublishRequirements(existing)
		if len(errs) > 0 {
			return nil, apperror.New(http.StatusUnprocessableEntity, apperror.CodePublishRequirementsNotMet, "Listing belum memenuhi syarat untuk ditayangkan").WithDetails(errs...)
		}
	}

	if err := s.repo.UpdateStatus(ctx, id, status, principal.UserID, agentID); err != nil {
		return nil, apperror.Internal(err)
	}

	if s.reval != nil {
		s.reval.Trigger(revalidate.TagPropertiesList, revalidate.PropertyTag(existing.Slug))
	}

	return s.GetDetail(ctx, principal, id)
}

func (s *service) Delete(ctx context.Context, principal middleware.Principal, id uuid.UUID) error {
	if !principal.IsAdmin() {
		return apperror.Forbidden()
	}

	existing, err := s.repo.GetByID(ctx, id, nil)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return apperror.NotFound("Listing tidak ditemukan")
		}
		return apperror.Internal(err)
	}

	if err := s.repo.SoftDelete(ctx, id, principal.UserID); err != nil {
		return apperror.Internal(err)
	}

	if s.reval != nil {
		s.reval.Trigger(revalidate.TagPropertiesList, revalidate.PropertyTag(existing.Slug))
	}

	return nil
}

func (s *service) UploadImages(ctx context.Context, principal middleware.Principal, propertyID uuid.UUID, files []*multipart.FileHeader) (*ImageUploadResult, error) {
	var agentID *uuid.UUID
	if principal.Role == models.RoleAgent {
		aid, err := s.repo.GetAgentIDByUserID(ctx, principal.UserID)
		if err != nil {
			return nil, apperror.Internal(err)
		}
		if aid == nil {
			return nil, apperror.NotFound("Listing tidak ditemukan")
		}
		agentID = aid
	}

	prop, err := s.repo.GetByID(ctx, propertyID, agentID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, apperror.NotFound("Listing tidak ditemukan")
		}
		return nil, apperror.Internal(err)
	}

	count, err := s.repo.CountImages(ctx, propertyID)
	if err != nil {
		return nil, apperror.Internal(err)
	}
	if count+int64(len(files)) > 20 {
		return nil, apperror.New(http.StatusUnprocessableEntity, "IMAGE_LIMIT_EXCEEDED", "Total foto listing melebihi batas maksimal 20 foto")
	}

	result := &ImageUploadResult{
		Uploaded: []DetailImage{},
		Failed:   []FailedUploadItem{},
	}

	var newImages []models.PropertyImage
	for _, fh := range files {
		ext := strings.ToLower(filepath.Ext(fh.Filename))
		var contentType string
		switch ext {
		case ".jpg", ".jpeg":
			contentType = "image/jpeg"
		case ".png":
			contentType = "image/png"
		case ".webp":
			contentType = "image/webp"
		default:
			result.Failed = append(result.Failed, FailedUploadItem{
				Filename: fh.Filename,
				Code:     "UNSUPPORTED_MEDIA_TYPE",
				Message:  "Format harus JPG, PNG, atau WebP",
			})
			continue
		}

		if fh.Size > 10*1024*1024 {
			result.Failed = append(result.Failed, FailedUploadItem{
				Filename: fh.Filename,
				Code:     "FILE_TOO_LARGE",
				Message:  "Ukuran file maksimal 10 MB",
			})
			continue
		}

		f, err := fh.Open()
		if err != nil {
			result.Failed = append(result.Failed, FailedUploadItem{
				Filename: fh.Filename, Code: "OPEN_FAILED", Message: "Gagal membaca file",
			})
			continue
		}

		cfg, _, err := image.DecodeConfig(f)
		width, height := int32(1200), int32(800)
		if err == nil && cfg.Width > 0 && cfg.Height > 0 {
			width = int32(cfg.Width)
			height = int32(cfg.Height)
		}
		_ = f.Close()

		f2, err := fh.Open()
		if err != nil {
			continue
		}
		imageID := uuid.New()
		key := fmt.Sprintf("properties/%s/%s%s", propertyID, imageID, ext)

		if err := s.storage.Put(ctx, key, contentType, f2, fh.Size); err != nil {
			_ = f2.Close()
			result.Failed = append(result.Failed, FailedUploadItem{
				Filename: fh.Filename, Code: "STORAGE_FAILED", Message: "Gagal menyimpan ke penyimpanan objek",
			})
			continue
		}
		_ = f2.Close()

		newImg := models.PropertyImage{
			ID:         imageID,
			PropertyID: propertyID,
			ObjectKey:  key,
			Width:      width,
			Height:     height,
			SizeBytes:  int32(fh.Size),
		}
		newImages = append(newImages, newImg)
	}

	if len(newImages) > 0 {
		if err := s.repo.AddImages(ctx, propertyID, newImages, agentID); err != nil {
			return nil, apperror.Internal(err)
		}

		for _, img := range newImages {
			result.Uploaded = append(result.Uploaded, DetailImage{
				ID:        img.ID.String(),
				URL:       fmt.Sprintf("%s/%s", s.mediaPublicURL, img.ObjectKey),
				Width:     img.Width,
				Height:    img.Height,
				SortOrder: img.SortOrder,
				IsCover:   img.IsCover,
			})
		}

		if prop.Status == models.StatusActive && s.reval != nil {
			s.reval.Trigger(revalidate.TagPropertiesList, revalidate.PropertyTag(prop.Slug))
		}
	}

	return result, nil
}

func (s *service) ReorderImages(ctx context.Context, principal middleware.Principal, propertyID uuid.UUID, req ReorderImagesRequest) ([]DetailImage, error) {
	var agentID *uuid.UUID
	if principal.Role == models.RoleAgent {
		aid, err := s.repo.GetAgentIDByUserID(ctx, principal.UserID)
		if err != nil {
			return nil, apperror.Internal(err)
		}
		if aid == nil {
			return nil, apperror.NotFound("Listing tidak ditemukan")
		}
		agentID = aid
	}

	coverUUID, err := uuid.Parse(req.CoverImageID)
	if err != nil {
		return nil, apperror.Validation(apperror.FieldError{
			Field: "cover_image_id", Code: "invalid", Message: "Format UUID cover tidak valid",
		})
	}

	orderUUIDs := make([]uuid.UUID, len(req.Order))
	for i, o := range req.Order {
		uid, err := uuid.Parse(o)
		if err != nil {
			return nil, apperror.Validation(apperror.FieldError{
				Field: fmt.Sprintf("order[%d]", i), Code: "invalid", Message: "Format UUID foto tidak valid",
			})
		}
		orderUUIDs[i] = uid
	}

	if err := s.repo.ReorderImages(ctx, propertyID, orderUUIDs, coverUUID, agentID); err != nil {
		return nil, apperror.New(http.StatusUnprocessableEntity, "INVALID_IMAGE_ORDER", err.Error())
	}

	prop, err := s.repo.GetByID(ctx, propertyID, agentID)
	if err != nil {
		return nil, apperror.Internal(err)
	}

	if prop.Status == models.StatusActive && s.reval != nil {
		s.reval.Trigger(revalidate.TagPropertiesList, revalidate.PropertyTag(prop.Slug))
	}

	images := make([]DetailImage, len(prop.Images))
	for i, img := range prop.Images {
		images[i] = DetailImage{
			ID:        img.ID.String(),
			URL:       fmt.Sprintf("%s/%s", s.mediaPublicURL, img.ObjectKey),
			Width:     img.Width,
			Height:    img.Height,
			SortOrder: img.SortOrder,
			IsCover:   img.IsCover,
		}
	}

	return images, nil
}

func (s *service) DeleteImage(ctx context.Context, principal middleware.Principal, propertyID uuid.UUID, imageID uuid.UUID) error {
	var agentID *uuid.UUID
	if principal.Role == models.RoleAgent {
		aid, err := s.repo.GetAgentIDByUserID(ctx, principal.UserID)
		if err != nil {
			return apperror.Internal(err)
		}
		if aid == nil {
			return apperror.NotFound("Listing tidak ditemukan")
		}
		agentID = aid
	}

	key, err := s.repo.DeleteImage(ctx, propertyID, imageID, agentID)
	if err != nil {
		if err.Error() == "CANNOT_DELETE_LAST_IMAGE_ACTIVE" {
			return apperror.New(http.StatusUnprocessableEntity, "PUBLISH_REQUIREMENTS_NOT_MET", "Foto terakhir tidak boleh dihapus saat listing aktif")
		}
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return apperror.NotFound("Foto tidak ditemukan")
		}
		return apperror.Internal(err)
	}

	if key != "" && s.storage != nil {
		_ = s.storage.Delete(ctx, key)
	}

	prop, err := s.repo.GetByID(ctx, propertyID, agentID)
	if err == nil && prop.Status == models.StatusActive && s.reval != nil {
		s.reval.Trigger(revalidate.TagPropertiesList, revalidate.PropertyTag(prop.Slug))
	}

	return nil
}

func (s *service) validatePublishRequirements(p *models.Property) []apperror.FieldError {
	var errs []apperror.FieldError

	if len(p.Images) == 0 {
		errs = append(errs, apperror.FieldError{
			Field: "images", Code: "required", Message: "Minimal 1 foto",
		})
	}
	if len(strings.TrimSpace(p.Title)) < 10 {
		errs = append(errs, apperror.FieldError{
			Field: "title", Code: "min", Message: "Judul minimal 10 karakter",
		})
	}
	if len(strings.TrimSpace(p.Description)) < 50 {
		errs = append(errs, apperror.FieldError{
			Field: "description", Code: "min", Message: "Deskripsi minimal 50 karakter",
		})
	}
	if p.Address == nil || strings.TrimSpace(*p.Address) == "" {
		errs = append(errs, apperror.FieldError{
			Field: "address", Code: "required", Message: "Alamat lengkap wajib diisi",
		})
	}
	if p.District == nil || strings.TrimSpace(*p.District) == "" {
		errs = append(errs, apperror.FieldError{
			Field: "district", Code: "required", Message: "Kecamatan wajib diisi",
		})
	}
	if p.ListingType == models.ListingSale && p.Certificate == nil {
		errs = append(errs, apperror.FieldError{
			Field: "certificate", Code: "required_for_type", Message: "Sertifikat wajib untuk properti dijual",
		})
	}
	if p.PropertyType != nil && p.PropertyType.Slug != "apartemen" && (p.LandArea == nil || *p.LandArea <= 0) {
		errs = append(errs, apperror.FieldError{
			Field: "land_area", Code: "required", Message: "Luas tanah wajib diisi",
		})
	}
	if p.PropertyType != nil && p.PropertyType.Slug != "tanah" && (p.BuildingArea == nil || *p.BuildingArea <= 0) {
		errs = append(errs, apperror.FieldError{
			Field: "building_area", Code: "required", Message: "Luas bangunan wajib diisi",
		})
	}

	return errs
}

func (s *service) toDashboardDetail(p *models.Property) *PropertyDashboardDetail {
	var cover *ImageMini
	detailImages := make([]DetailImage, len(p.Images))
	for i, img := range p.Images {
		url := fmt.Sprintf("%s/%s", s.mediaPublicURL, img.ObjectKey)
		detailImages[i] = DetailImage{
			ID:        img.ID.String(),
			URL:       url,
			Width:     img.Width,
			Height:    img.Height,
			SortOrder: img.SortOrder,
			IsCover:   img.IsCover,
		}
		if img.IsCover {
			cover = &ImageMini{URL: url, Width: img.Width, Height: img.Height}
		}
	}
	if cover == nil && len(detailImages) > 0 {
		cover = &ImageMini{URL: detailImages[0].URL, Width: detailImages[0].Width, Height: detailImages[0].Height}
	}

	var pubURL *string
	if p.Status == models.StatusActive {
		url := fmt.Sprintf("%s/id/properti/%s", s.sitePublicURL, p.Slug)
		pubURL = &url
	}

	facilities := make([]DetailFacility, len(p.Facilities))
	for i, f := range p.Facilities {
		facilities[i] = DetailFacility{
			ID:     f.ID,
			Slug:   f.Slug,
			NameID: f.NameID,
			NameEN: f.NameEN,
			Icon:   f.Icon,
		}
	}

	var agentPhoto *string
	agentStatus := "active"
	agentName := ""
	agentWhatsapp := ""
	agentCode := ""
	agentIDStr := p.AgentID.String()

	if p.Agent != nil {
		agentCode = p.Agent.AgentCode
		agentWhatsapp = p.Agent.WhatsappNumber
		if p.Agent.User != nil {
			agentName = p.Agent.User.Name
			agentStatus = string(p.Agent.User.Status)
			if p.Agent.User.AvatarKey != nil && *p.Agent.User.AvatarKey != "" {
				url := fmt.Sprintf("%s/%s", s.mediaPublicURL, *p.Agent.User.AvatarKey)
				agentPhoto = &url
			}
		}
	}

	var typeSlug, typeNameID, typeNameEN string
	if p.PropertyType != nil {
		typeSlug = p.PropertyType.Slug
		typeNameID = p.PropertyType.NameID
		typeNameEN = p.PropertyType.NameEN
	}

	var cityMini PlaceMini
	if p.City != nil {
		cityMini = PlaceMini{ID: p.City.ID, Slug: p.City.Slug, Name: p.City.Name}
	}

	var provMini PlaceMini
	if p.Province != nil {
		provMini = PlaceMini{ID: int32(p.Province.ID), Slug: p.Province.Slug, Name: p.Province.Name}
	}

	return &PropertyDashboardDetail{
		Detail: Detail{
			ID:          p.ID.String(),
			Code:        p.Code,
			Slug:        p.Slug,
			Title:       p.Title,
			ListingType: p.ListingType,
			MarketType:  p.MarketType,
			PropertyType: RefMini{
				ID:     p.PropertyTypeID,
				Slug:   typeSlug,
				NameID: typeNameID,
				NameEN: typeNameEN,
			},
			Price:             p.Price,
			RentPeriod:        p.RentPeriod,
			IsPriceNegotiable: p.IsPriceNegotiable,
			Location: Location{
				District: p.District,
				City:     cityMini,
				Province: provMini,
			},
			LandArea:      p.LandArea,
			BuildingArea:  p.BuildingArea,
			Bedrooms:      p.Bedrooms,
			Bathrooms:     p.Bathrooms,
			TotalRooms:    p.TotalRooms,
			CoverImage:    cover,
			ImageCount:    int64(len(p.Images)),
			PublishedAt:   p.PublishedAt,
			Description:   p.Description,
			Address:       p.Address,
			Latitude:      p.Latitude,
			Longitude:     p.Longitude,
			MaidBedrooms:  p.MaidBedrooms,
			Floors:        p.Floors,
			FloorLevel:    p.FloorLevel,
			Carports:      p.Carports,
			Garages:       p.Garages,
			ElectricityVA: p.ElectricityVA,
			WaterSource:   p.WaterSource,
			Certificate:   p.Certificate,
			Furnishing:    p.Furnishing,
			Facing:        p.Facing,
			YearBuilt:     p.YearBuilt,
			VideoURL:      p.VideoURL,
			Facilities:    facilities,
			Images:        detailImages,
			Agent: DetailAgent{
				AgentCode:      agentCode,
				Name:           agentName,
				PhotoURL:       agentPhoto,
				WhatsappNumber: agentWhatsapp,
			},
			UpdatedAt: p.UpdatedAt,
		},
		Status: p.Status,
		Agent: DashboardAgent{
			ID:             agentIDStr,
			AgentCode:      agentCode,
			Name:           agentName,
			PhotoURL:       agentPhoto,
			WhatsappNumber: agentWhatsapp,
			Status:         agentStatus,
		},
		ViewCount:          p.ViewCount,
		WhatsappClickCount: p.WhatsappClickCount,
		IsFeatured:         p.IsFeatured,
		PublicURL:          pubURL,
		ClosedAt:           p.ClosedAt,
		CreatedBy: UserMini{
			ID:   p.CreatedBy.String(),
			Name: agentName,
		},
		CreatedAt: p.CreatedAt,
	}
}
