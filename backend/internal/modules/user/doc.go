// Package user — manajemen akun oleh admin.
//
// Kebutuhan: USR-01..USR-06 (docs/PRD.md §6.2). Kontrak: docs/API.md §10
// (GET/POST /users, GET/PATCH /users/{id}, PATCH /users/{id}/status, PUT /users/{id}/password).
//
// Status: BELUM DIIMPLEMENTASI — saat ini hanya berisi DTO User bersama (dto.go) yang dipakai
// modul auth & account. Tambahkan routes.go, handler.go, service.go, repository.go sesuai PRD §12.3.
package user
