// Package agent — manajemen agen oleh admin (membuat users + agents dalam satu transaksi).
//
// Kebutuhan: AGT-01..AGT-04 (docs/PRD.md §6.4). Kontrak: docs/API.md §11
// (GET/POST /agents, GET /agents/options, GET/PATCH /agents/{id}, POST /agents/{id}/photo).
//
// Status: BELUM DIIMPLEMENTASI. Kode agen dari sequence agent_code_seq: "AG-" + lpad(4).
package agent
