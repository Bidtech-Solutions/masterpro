// Package pagination menangani parameter `page`/`per_page` dan meta respons (docs/API.md §1).
package pagination

import (
	"strconv"

	"github.com/gin-gonic/gin"
)

// Batas default sesuai API.md §1.
const (
	PublicDefault    = 12
	PublicMax        = 48
	DashboardDefault = 20
	DashboardMax     = 100
)

// Params adalah hasil parsing query paginasi.
type Params struct {
	Page    int
	PerPage int
}

// Offset untuk query SQL.
func (p Params) Offset() int { return (p.Page - 1) * p.PerPage }

// Meta adalah objek `meta` pada respons berpaginasi.
type Meta struct {
	Page       int   `json:"page"`
	PerPage    int   `json:"per_page"`
	Total      int64 `json:"total"`
	TotalPages int   `json:"total_pages"`
}

// Parse membaca `page` & `per_page`; nilai tidak valid diganti default, nilai terlalu besar dipotong ke max.
func Parse(c *gin.Context, def, maxPerPage int) Params {
	page, err := strconv.Atoi(c.Query("page"))
	if err != nil || page < 1 {
		page = 1
	}
	perPage, err := strconv.Atoi(c.Query("per_page"))
	if err != nil || perPage < 1 {
		perPage = def
	}
	if perPage > maxPerPage {
		perPage = maxPerPage
	}
	return Params{Page: page, PerPage: perPage}
}

// NewMeta menghitung meta dari total baris.
func NewMeta(p Params, total int64) Meta {
	pages := int((total + int64(p.PerPage) - 1) / int64(p.PerPage))
	return Meta{Page: p.Page, PerPage: p.PerPage, Total: total, TotalPages: pages}
}
