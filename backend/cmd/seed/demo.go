package main

import (
	"bytes"
	"context"
	"embed"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/bidtech-solutions/masterpro/backend/internal/config"
	"github.com/bidtech-solutions/masterpro/backend/internal/models"
	"github.com/bidtech-solutions/masterpro/backend/internal/pkg/security"
	"github.com/bidtech-solutions/masterpro/backend/internal/pkg/slug"
	"github.com/bidtech-solutions/masterpro/backend/internal/storage"
)

// Foto demo dari Unsplash (lisensi Unsplash), sudah dikonversi ke WebP 1600 px.
//
//go:embed demo/*.webp
var demoImages embed.FS

const (
	demoAgentEmail    = "agen.demo@masterpro.local"
	demoAgentPassword = "AgenDemo123"
	cityBatam         = 2171
	provinceKepri     = 21
)

type demoListing struct {
	title, district, image string
	listing                models.ListingType
	market                 models.MarketType
	typeID                 int16
	price                  int64
	period                 models.RentPeriod
	land, building         float64
	beds, baths            int16
	width, height          int32
}

var demoListings = []demoListing{
	{"Rumah Minimalis Modern 2 Lantai", "Batam Kota", "rumah-batam-centre", models.ListingSale, models.MarketSecondary, 1, 1_450_000_000, "", 120, 140, 3, 2, 1600, 1200},
	{"Cluster Premium Palm Spring Golf View", "Batam Kota", "cluster-palm-spring", models.ListingSale, models.MarketPrimary, 1, 3_800_000_000, "", 200, 260, 4, 4, 1600, 1067},
	{"Rumah Asri Dekat Hutan Kota Tiban", "Sekupang", "rumah-tiban", models.ListingSale, models.MarketSecondary, 1, 2_200_000_000, "", 180, 190, 4, 3, 1600, 1067},
	{"Rumah Mewah dengan Kolam Renang Sekupang", "Sekupang", "rumah-sekupang", models.ListingSale, models.MarketPrimary, 1, 4_200_000_000, "", 300, 350, 5, 5, 1600, 1061},
	{"Villa Tropis Nyaman Sukajadi", "Batam Kota", "villa-sukajadi", models.ListingRent, models.MarketSecondary, 1, 150_000_000, models.RentYearly, 250, 220, 4, 3, 1600, 1067},
	{"Unit 2BR Hook Apartemen Formosa", "Lubuk Baja", "apartemen-formosa", models.ListingRent, models.MarketSecondary, 2, 120_000_000, models.RentYearly, 0, 72, 2, 1, 1600, 1067},
	{"Studio Apartemen Siap Huni Nagoya", "Lubuk Baja", "studio-nagoya", models.ListingRent, models.MarketSecondary, 2, 4_500_000, models.RentMonthly, 0, 28, 1, 1, 1600, 1190},
}

// seedDemo membuat 1 agen demo + 7 listing tayang beserta fotonya. Hanya untuk development.
func seedDemo(ctx context.Context, cfg config.Config, db *gorm.DB) error {
	if cfg.IsProduction() {
		return errors.New("data demo tidak boleh dibuat di produksi")
	}
	var count int64
	db.WithContext(ctx).Model(&models.User{}).Where("lower(email) = ?", demoAgentEmail).Count(&count)
	if count > 0 {
		fmt.Println("Data demo sudah ada — tidak ada perubahan.")
		return nil
	}
	store, err := storage.New(storage.Config{
		Endpoint: cfg.S3.Endpoint, AccessKey: cfg.S3.AccessKey, SecretKey: cfg.S3.SecretKey,
		Bucket: cfg.S3.Bucket, Region: cfg.S3.Region, UseSSL: cfg.S3.UseSSL, PublicURL: cfg.MediaPublicURL,
	})
	if err != nil {
		return err
	}
	if err := store.EnsureBucket(ctx); err != nil {
		return err
	}
	hash, err := security.HashPassword(demoAgentPassword)
	if err != nil {
		return err
	}

	now := time.Now().UTC()
	return db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		phone := "081234567890"
		u := models.User{ID: uuid.Must(uuid.NewV7()), Name: "Budi Santoso", Email: demoAgentEmail, Phone: &phone,
			PasswordHash: hash, Role: models.RoleAgent, Status: models.UserActive,
			PasswordChangedAt: now, CreatedAt: now, UpdatedAt: now}
		if err := tx.Create(&u).Error; err != nil {
			return err
		}
		var seq int64
		if err := tx.Raw("SELECT nextval('agent_code_seq')").Scan(&seq).Error; err != nil {
			return err
		}
		area := "Batam Kota, Sekupang, Lubuk Baja"
		agent := models.Agent{ID: uuid.Must(uuid.NewV7()), UserID: u.ID, AgentCode: fmt.Sprintf("AG-%04d", seq),
			WhatsappNumber: "6281234567890", ServiceArea: &area, JoinedAt: &now, CreatedAt: now, UpdatedAt: now}
		if err := tx.Create(&agent).Error; err != nil {
			return err
		}

		for i, d := range demoListings {
			if err := createDemoListing(ctx, tx, store, agent.ID, u.ID, d, now.Add(-time.Duration(i)*time.Hour)); err != nil {
				return fmt.Errorf("listing %q: %w", d.title, err)
			}
		}
		fmt.Printf("Data demo dibuat: agen %s (password %s) + %d listing.\n", demoAgentEmail, demoAgentPassword, len(demoListings))
		return nil
	})
}

func createDemoListing(ctx context.Context, tx *gorm.DB, store *storage.Client, agentID, userID uuid.UUID, d demoListing, published time.Time) error {
	var seq int64
	if err := tx.Raw("SELECT nextval('property_code_seq')").Scan(&seq).Error; err != nil {
		return err
	}
	s, err := slug.ForProperty(d.title)
	if err != nil {
		return err
	}
	district := d.district
	shm := models.CertSHM
	p := models.Property{
		ID: uuid.Must(uuid.NewV7()), Code: fmt.Sprintf("MP-%06d", seq), Slug: s,
		AgentID: agentID, CreatedBy: userID,
		ListingType: d.listing, MarketType: d.market, PropertyTypeID: d.typeID, Status: models.StatusActive,
		Title:       d.title,
		Description: d.title + " — listing demo untuk development. Lokasi strategis, lingkungan nyaman, dan akses mudah ke fasilitas umum.",
		Price:       d.price, IsPriceNegotiable: d.listing == models.ListingSale,
		ProvinceID: provinceKepri, CityID: cityBatam, District: &district,
		BuildingArea: &d.building, Bedrooms: &d.beds, Bathrooms: &d.baths,
		PublishedAt: &published, CreatedAt: published, UpdatedAt: published,
	}
	if d.land > 0 {
		p.LandArea = &d.land
	}
	if d.listing == models.ListingRent {
		period := d.period
		p.RentPeriod = &period
	} else {
		p.Certificate = &shm
	}
	if err := tx.Omit("Agent", "PropertyType", "Province", "City", "Images", "Facilities").Create(&p).Error; err != nil {
		return err
	}

	data, err := demoImages.ReadFile("demo/" + d.image + ".webp")
	if err != nil {
		return err
	}
	key := fmt.Sprintf("properties/%s/%s.webp", p.ID, uuid.Must(uuid.NewV7()))
	if err := store.Put(ctx, key, "image/webp", bytes.NewReader(data), int64(len(data))); err != nil {
		return err
	}
	img := models.PropertyImage{ID: uuid.Must(uuid.NewV7()), PropertyID: p.ID, ObjectKey: key,
		Width: d.width, Height: d.height, SizeBytes: int32(len(data)), IsCover: true, CreatedAt: published} //nolint:gosec // ukuran file demo kecil
	return tx.Create(&img).Error
}
