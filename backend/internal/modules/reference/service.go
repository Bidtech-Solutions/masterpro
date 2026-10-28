package reference

import (
	"context"

	"github.com/bidtech-solutions/masterpro/backend/internal/pkg/apperror"
)

// Service data referensi (tanpa aturan bisnis khusus; membungkus error repository).
type Service interface {
	PropertyTypes(ctx context.Context, q PropertyTypeQuery) ([]PropertyTypeResponse, error)
	Facilities(ctx context.Context) ([]FacilityResponse, error)
	Provinces(ctx context.Context, q ProvinceQuery) ([]ProvinceResponse, error)
	Cities(ctx context.Context, q CityQuery) ([]CityResponse, error)
}

type service struct{ repo Repository }

// NewService membuat service.
func NewService(repo Repository) Service { return &service{repo: repo} }

func (s *service) PropertyTypes(ctx context.Context, q PropertyTypeQuery) ([]PropertyTypeResponse, error) {
	return wrap(s.repo.PropertyTypes(ctx, q.ListingType))
}

func (s *service) Facilities(ctx context.Context) ([]FacilityResponse, error) {
	return wrap(s.repo.Facilities(ctx))
}

func (s *service) Provinces(ctx context.Context, q ProvinceQuery) ([]ProvinceResponse, error) {
	return wrap(s.repo.Provinces(ctx, q.HasListings))
}

func (s *service) Cities(ctx context.Context, q CityQuery) ([]CityResponse, error) {
	return wrap(s.repo.Cities(ctx, q))
}

// wrap memastikan slice kosong diserialisasi sebagai [] (bukan null) dan error menjadi INTERNAL.
func wrap[T any](v []T, err error) ([]T, error) {
	if err != nil {
		return nil, apperror.Internal(err)
	}
	if v == nil {
		v = []T{}
	}
	return v, nil
}
