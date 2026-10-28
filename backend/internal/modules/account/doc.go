// Package account — profil & password milik pengguna yang login.
//
// Kebutuhan: ACC-01, ACC-02 (docs/PRD.md §6.3). Kontrak: docs/API.md §9
// (PATCH /account/profile, POST & DELETE /account/avatar, PUT /account/password).
//
// Status: BELUM DIIMPLEMENTASI. Ikuti pola modul auth/reference (routes.go, handler.go,
// service.go, repository.go, dto.go, *_test.go). Respons memakai user.ToResponse.
package account
