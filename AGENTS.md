# AGENTS.md — Aturan untuk AI Coding Agent (MasterPro)

Proyek ini dikerjakan kolaboratif oleh tim Bidtech dan beberapa AI agent. Aturan di bawah **wajib** dipatuhi oleh setiap agent (Claude Code, Codex, Cursor, dll.).

## 1. Baca Dulu

Sebelum mengubah kode, baca bagian yang relevan dari:

| Dokumen | Isi |
|---|---|
| `docs/PRD.md` | Kebutuhan (ID seperti `PRP-03`), aturan bisnis §7, arsitektur §10, **struktur proyek §12**, **skema DB §13**, env §14, Docker/Traefik §15, CI/CD §16, konvensi §18 |
| `docs/API.md` | Kontrak REST API — sumber kebenaran endpoint, field, dan kode error |
| `docs/DESIGN.md` | Token desain, komponen, layout halaman |

Bila permintaan pengguna bertentangan dengan dokumen ini, **berhenti dan tanyakan** — jangan memilih sendiri.

## 2. Aturan Keras

1. **Struktur folder baku** (PRD §12). Jangan membuat folder level atas baru, memindahkan, atau mengganti nama folder. File baru ditempatkan sesuai aturan PRD §12.4.
2. **Docs-first.** Perubahan kontrak API, skema DB, env, struktur, atau versi mayor dependency → perbarui `docs/*` dalam perubahan yang sama, sebelum kode.
3. **Migrasi**: hanya file SQL baru di `backend/migrations/` (`NNNNNN_nama.up.sql` + `.down.sql`). Jangan mengedit migrasi yang sudah ada di `main`. `AutoMigrate` GORM dilarang.
4. **Lapisan backend**: handler → service → repository. Handler tidak menyentuh GORM; antar-modul lewat interface service.
5. **Frontend**: panggilan API hanya lewat `src/lib/api/*`; konstanta bisnis hanya di `src/config/*`; tidak ada string UI hardcoded (pakai `messages/id.json` & `messages/en.json`, kunci keduanya harus identik); Server Component default.
6. **JSON `snake_case`**, uang integer rupiah, waktu ISO 8601 UTC.
7. **Keamanan**: jangan commit secret/`.env`; jangan log password, token, atau cookie; jangan melemahkan aturan auth/CSRF/rate limit tanpa instruksi eksplisit.
8. **Jangan** menjalankan perintah destruktif (`docker volume rm`, `docker system prune --volumes`, `DROP`, `rm -rf` di luar folder build) tanpa izin eksplisit.
9. Jangan menambah dependency baru bila kebutuhan bisa dipenuhi stack yang ada (PRD §11). Bila perlu, sebutkan alasannya di ringkasan perubahan.

## 3. Perintah

```bash
# Seluruh stack lokal
cp .env.example .env
docker compose up -d --build
docker compose exec backend go run ./cmd/seed        # admin pertama (SEED_ADMIN_* di .env)
docker compose exec backend go run ./cmd/seed demo   # opsional: agen + 7 listing demo berfoto

# Frontend (di folder frontend/)
pnpm lint && pnpm typecheck && pnpm test && pnpm format:check   # typecheck = next typegen + tsc

# Backend (di folder backend/)
make lint && make test                               # gofmt, vet, golangci-lint, go test -race
make test-integration                                # + test Postgres (DB masterpro_test dikosongkan!)
make migrate-new name=add_xxx                        # membuat pasangan file migrasi baru
```

URL lokal: `http://localhost/id` · `http://localhost/dashboard` · `http://localhost/api/v1/health` · `http://media.localhost`.

Pola acuan saat membuat modul baru: backend `internal/modules/auth` (lengkap dengan test) dan `internal/modules/property` (query publik); frontend `src/app/[locale]/page.tsx` (Server Component + `lib/api/endpoints.ts`) dan `src/components/dashboard/login-form.tsx` (Client Component + `lib/api/client.ts`). Status tiap modul backend tertulis di `doc.go`-nya.

## 4. Definition of Done

- [ ] Sesuai ID kebutuhan di PRD dan kontrak di API.md.
- [ ] Lint, typecheck, format, dan test lulus untuk bagian yang disentuh.
- [ ] Test ditambahkan untuk logika baru (service BE, fungsi murni FE) atau regresi bug.
- [ ] Teks UI baru ada di kedua file `messages/*.json`.
- [ ] Dokumen diperbarui bila kontrak/skema/struktur/env berubah.
- [ ] Tidak ada secret, `console.log`, atau kode mati yang tertinggal.
- [ ] Ringkasan perubahan menyebut file yang diubah, ID kebutuhan, dan hal yang belum selesai.

## 5. Commit & Branch

Conventional Commits dengan scope `web | dashboard | api | db | infra | docs`, mis. `feat(api): tambah ekspor excel properti`. Branch `feat/<scope>-<deskripsi>`. Jangan push langsung ke `main`.
