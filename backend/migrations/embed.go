// Package migrations menyimpan file migrasi SQL (golang-migrate) yang di-embed ke binary API.
//
// Aturan (PRD §12.4): file yang sudah di-merge ke main tidak boleh diedit — buat pasangan
// file baru `NNNNNN_deskripsi.up.sql` / `.down.sql` (gunakan `make migrate-new name=...`).
package migrations

import "embed"

// FS berisi semua file *.sql di folder ini.
//
//go:embed *.sql
var FS embed.FS
