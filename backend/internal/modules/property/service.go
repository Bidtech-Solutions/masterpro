package property

import (
	"context"

	"github.com/bidtech-solutions/masterpro/backend/internal/pkg/apperror"
	"github.com/bidtech-solutions/masterpro/backend/internal/pkg/pagination"
)

// Service aturan bisnis listing.
type Service interface {
	ListPublic(ctx context.Context, q PublicListQuery, p pagination.Params) ([]Card, pagination.Meta, error)
}

type service struct{ repo Repository }

// NewService membuat service.
func NewService(repo Repository) Service { return &service{repo: repo} }

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
