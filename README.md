
# MasterPro Real Estate

Website katalog properti **masterpro.co.id** (publik, `/id` & `/en`) dan **Dashboard MasterPro** (`/dashboard`, admin & agen). Dikerjakan oleh tim Bidtech.

|          |                                                                                |
| -------- | ------------------------------------------------------------------------------ |
| Frontend | Next.js 16 (App Router, ISR, next-intl), Tailwind CSS 4 — `frontend/`       |
| Backend  | Go 1.26, Gin, GORM, PostgreSQL 17, RustFS (S3) — `backend/`                 |
| Infra    | Docker Compose, Traefik v3.7, GitHub Actions → GHCR → VPS `/opt/masterpro` |

**Wajib dibaca sebelum menulis kode:** [`AGENTS.md`](./AGENTS.md) (aturan kolaborasi, juga untuk AI agent) → [`docs/PRD.md`](./docs/PRD.md) → [`docs/API.md`](./docs/API.md) → [`docs/DESIGN.md`](./docs/DESIGN.md). Struktur folder & kontrak API bersifat **baku**; perubahan wajib *docs-first*.

---

## Mulai cepat (lokal)

Prasyarat: Docker Desktop / Docker Engine + Compose v2. Port **80** harus bebas.

```bash
cp .env.example .env
docker compose up -d --build

docker compose exec backend go run ./cmd/seed        # admin: admin@masterpro.local / AdminLokal123
docker compose exec backend go run ./cmd/seed demo   # opsional: agen demo + 7 listing berfoto
```

| URL                            | Isi                                                                                   |
| ------------------------------ | ------------------------------------------------------------------------------------- |
| http://localhost/id            | Website (Beranda) — `/en` untuk bahasa Inggris                                     |
| http://localhost/dashboard     | Dashboard (login admin di atas, atau `agen.demo@masterpro.local` / `AgenDemo123`) |
| http://localhost/api/v1/health | Health API                                                                            |
| http://media.localhost         | Media RustFS (lewat Traefik)                                                          |
| http://localhost:9001          | Console RustFS (`S3_ACCESS_KEY` / `S3_SECRET_KEY`)                                |
| http://localhost:8081          | Dashboard Traefik                                                                     |
| `127.0.0.1:5432`             | PostgreSQL (`masterpro` + `masterpro_test`)                                       |

Frontend & backend berjalan dengan hot reload (`next dev`, `air`). Setelah mengubah `package.json`/`go.mod`: `docker compose up -d --build frontend backend`.

> `*.localhost` otomatis mengarah ke 127.0.0.1 di Chrome, Edge, Firefox, dan curl. Bila browser Anda tidak, tambahkan `127.0.0.1 media.localhost` ke file hosts.

## Perintah harian

```bash
# frontend/
pnpm install
pnpm lint && pnpm typecheck && pnpm test && pnpm format:check

# backend/
make lint            # gofmt + go vet + golangci-lint
make test            # unit test
make test-integration   # unit + integrasi ke Postgres lokal (DB masterpro_test dikosongkan)
make migrate-new name=add_xxx
```

CI menjalankan perintah yang sama; PR tidak bisa di-merge bila merah.

## Status scaffold (28 Okt 2026)

| Area            | Sudah                                                                                                                                                                                                                        | Berikutnya (ID kebutuhan)                                                                                                                                                     |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Backend fondasi | config, migrasi (skema + 38 provinsi & 514 kab/kota), router, middleware (request id, log, recovery, CORS, CSRF, auth, RBAC, rate limit, body limit), envelope & kode error, storage RustFS, revalidasi ISR, audit log, seed | —                                                                                                                                                                            |
| Backend modul   | `auth` (login/refresh/logout/me, rotasi & reuse detection, lockout), `reference`, `GET /public/properties`                                                                                                             | detail/serupa/event/sitemap publik, `account`, `user`, `agent`, properti dashboard + foto (`imaging`), `report` Excel, `dashboard` — lihat `doc.go` tiap modul |
| Website         | layout, header/footer, i18n `/id` `/en`, **Beranda sesuai desain Stitch**, katalog dasar + paginasi, Daftar Agen (komisi), 404, robots, sitemap, llms.txt, llms-full.txt, security.txt                             | filter & pencarian katalog (WEB-P-01..07), halaman detail (WEB-D-*), konten Daftar Agen (WEB-A-02..06)                                                                        |
| Dashboard       | login (+ refresh senyap), guard sesi, shell sidebar, logout                                                                                                                                                                  | semua halaman modul (PRP-*, AGT-*, USR-*, ACC-*)                                                                                                                          |
| Infra           | Dockerfile dev & produksi, compose lokal & produksi + Traefik, workflow CI/CD                                                                                                                                                | VPS produksi (lihat PRD §19 R-01)                                                                                                                                            |

Item yang masih menunggu konten/keputusan klien ditandai **[KONFIRMASI KLIEN]** di kode & PRD (kontak di `frontend/src/config/site.ts`, logo partner di `frontend/public/partners/` masih placeholder, logo MasterPro masih PNG hasil olahan).

---

## GitHub Secrets & Variables

Isi di **GitHub → repo → Settings → Secrets and variables → Actions**. Disarankan membuat *Environment* `production` (Settings → Environments) dan menyimpan semua nilai di sana, opsional dengan *required reviewers* agar deploy perlu persetujuan.

### Secrets

| Nama                  | Isi                                                                        | Cara membuat                                                                                                                                                |
| --------------------- | -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `VPS_HOST`          | IP publik / hostname VPS                                                   | dari penyedia VPS                                                                                                                                           |
| `VPS_PORT`          | Port SSH, mis. `22`                                                      |                                                                                                                                                             |
| `VPS_USER`          | User deploy, mis. `deploy`                                               | `adduser deploy && usermod -aG docker deploy` (jangan `root`)                                                                                           |
| `VPS_SSH_KEY`       | **Private key** deploy (isi lengkap termasuk baris `-----BEGIN…`) | `ssh-keygen -t ed25519 -C "github-actions-masterpro" -f masterpro_deploy` → isi `masterpro_deploy.pub` ke `/home/deploy/.ssh/authorized_keys` di VPS |
| `VPS_KNOWN_HOSTS`   | Fingerprint host VPS                                                       | `ssh-keyscan -p 22 <VPS_HOST>` (cocokkan dengan `ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub` di VPS)                                              |
| `POSTGRES_PASSWORD` | Password database                                                          | `openssl rand -base64 32 \| tr -d '/+='`                                                                                                                   |
| `JWT_SECRET`        | Kunci tanda tangan JWT (≥ 64 karakter)                                    | `openssl rand -base64 64 \| tr -d '\n'`                                                                                                                    |
| `S3_ACCESS_KEY`     | Access key RustFS                                                          | `openssl rand -hex 10`                                                                                                                                    |
| `S3_SECRET_KEY`     | Secret key RustFS                                                          | `openssl rand -base64 30 \| tr -d '/+='`                                                                                                                   |
| `REVALIDATE_SECRET` | Secret revalidasi ISR backend → frontend                                  | `openssl rand -hex 32`                                                                                                                                    |

### Variables

| Nama             | Nilai                     |
| ---------------- | ------------------------- |
| `DOMAIN`       | `masterpro.co.id`       |
| `MEDIA_DOMAIN` | `media.masterpro.co.id` |

Catatan penting:

- `GITHUB_TOKEN` (otomatis) dipakai CI untuk **push** image ke GHCR dan untuk `docker login` sementara di VPS saat deploy (lalu `docker logout`); tidak perlu membuat PAT atau secret `GHCR_*`. Pastikan *Settings → Actions → General → Workflow permissions* mengizinkan workflow menulis packages (workflow sudah meminta `packages: write`).
- `POSTGRES_PASSWORD` hanya dipakai saat volume database **pertama kali** dibuat. Mengganti secret setelahnya juga butuh `ALTER USER masterpro PASSWORD '…'` di database.
- Jangan pernah menaruh nilai di atas di repo, issue, atau chat. File `.env` di VPS dibuat ulang setiap deploy (izin `600`, salinan sebelumnya di `.env.previous`).

## Deploy pertama

1. VPS tujuan harus sudah menjalankan Traefik (saat ini container `Traefik-Proxy` di network `traefik-network`, entrypoint `websecure`, certresolver `letsencrypt`). Stack MasterPro **tidak membawa Traefik sendiri**; ia bergabung ke Traefik itu. Bila nama-nama tersebut berbeda, ubah di `docker-compose.prod.yml` (network, `entrypoints`, `tls.certresolver`).
2. Sebagai root: buat user `deploy` (grup `docker`) lalu `install -d -m 750 -o deploy -g deploy /opt/masterpro`.
3. DNS `A` untuk `masterpro.co.id`, `www`, dan `media` → IP VPS. Ketiganya harus sudah mengarah ke VPS saat pertama deploy, karena sertifikat Let's Encrypt diminta untuk semuanya. Traefik memakai TLS challenge, jadi bila memakai Cloudflare, set awan **abu-abu (DNS only)** sampai sertifikat terbit, lalu boleh dinyalakan.
4. Isi semua Secrets & Variables di atas, lalu merge ke `main` → workflow **MasterPro CI/CD** membangun, mendorong image, dan men-deploy.
5. Buat admin pertama di VPS:
   ```bash
   cd /opt/masterpro
   docker compose -f docker-compose.prod.yml exec \
     -e SEED_ADMIN_NAME="Admin MasterPro" -e SEED_ADMIN_EMAIL=admin@masterpro.co.id -e SEED_ADMIN_PASSWORD='GantiSegera123' \
     mp-backend /app/seed
   ```

Rollback: ubah `IMAGE_TAG` di `/opt/masterpro/.env` ke SHA sebelumnya (atau `cp .env.previous .env`) lalu `docker compose -f docker-compose.prod.yml up -d`. Backup & pemantauan: PRD §17.

## Struktur

```
.github/workflows/masterpro.yml   CI/CD
frontend/                         Next.js (website + dashboard)
backend/                          Go API
docs/                             PRD, API, DESIGN (+ docs/stitch: referensi desain Stitch)
docker-compose.yml                stack lokal
docker-compose.prod.yml           stack produksi (memakai Traefik yang sudah ada di VPS)
.env.example                      seluruh env (tanpa rahasia)
AGENTS.md / CLAUDE.md             aturan agent
```

Detail lengkap: PRD §12.
