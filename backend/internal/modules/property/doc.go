// Package property — listing properti: katalog publik, CRUD dashboard, status, foto, event.
//
// Kebutuhan: WEB-H-02/03/05, WEB-P-*, WEB-D-*, PRP-01..PRP-11 (docs/PRD.md §5, §6.5, §7).
// Kontrak: docs/API.md §7.1–7.4, §7.9, §12.
//
// Status: SEBAGIAN — baru GET /public/properties (katalog publik, dipakai Beranda). Sisa endpoint
// publik & seluruh endpoint dashboard belum dibuat. Catatan penting:
//   - Visibilitas publik memakai models.PublicVisibleSQL.
//   - Kode listing dari property_code_seq: "MP-" + lpad(6); slug dari slug.ForProperty (immutable).
//   - Setiap perubahan memanggil revalidate.Client.Trigger(TagPropertiesList, PropertyTag(slug)).
//   - Agen hanya melihat listing miliknya; akses listing lain → 404 (API.md §2.4).
package property
