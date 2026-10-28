# API.md — Kontrak REST API MasterPro v1

> **[KETETAPAN]** Dokumen ini adalah kontrak antara `backend/` dan `frontend/`. Endpoint, nama field, tipe, dan kode error **tidak boleh** berubah tanpa PR docs-first yang memperbarui dokumen ini terlebih dahulu. Tipe TypeScript di `frontend/src/types/*` dan DTO Go di `backend/internal/modules/*/dto.go` wajib mencerminkan dokumen ini.

Konteks produk, aturan bisnis, dan skema database: lihat [`PRD.md`](./PRD.md) (§7 aturan bisnis, §13 database).

---

## Daftar Isi

1. [Konvensi Umum](#1-konvensi-umum)
2. [Autentikasi & Keamanan](#2-autentikasi--keamanan)
3. [Format Respons & Error](#3-format-respons--error)
4. [Objek Data](#4-objek-data)
5. [Ringkasan Endpoint](#5-ringkasan-endpoint)
6. [Health](#6-health)
7. [Publik](#7-publik)
8. [Auth](#8-auth)
9. [Akun Saya](#9-akun-saya)
10. [Pengguna (Admin)](#10-pengguna-admin)
11. [Agen (Admin)](#11-agen-admin)
12. [Properti (Dashboard)](#12-properti-dashboard)
13. [Ringkasan Dashboard](#13-ringkasan-dashboard)

---

## 1. Konvensi Umum

| Item | Ketetapan |
|---|---|
| Base URL produksi | `https://masterpro.co.id/api/v1` |
| Base URL lokal | `http://localhost/api/v1` (via Traefik) · internal Docker: `http://backend:8080/api/v1` |
| Versi | Prefix path `/api/v1`. Perubahan *breaking* → `/api/v2`. Penambahan field opsional bukan breaking. |
| Format | `application/json; charset=utf-8`, kecuali upload (`multipart/form-data`) dan ekspor (`.xlsx`). |
| Penamaan field | `snake_case` |
| ID | UUID string untuk entitas (`users`, `agents`, `properties`, `property_images`); integer untuk data referensi. |
| Waktu | ISO 8601 UTC, mis. `2026-10-28T03:15:00Z`. Tanggal saja: `YYYY-MM-DD`. |
| Uang | Integer rupiah utuh (`1250000000`). Tidak ada desimal, tidak ada string berformat. |
| Luas | Angka desimal m² (`120.5`). |
| Nilai kosong | Field opsional tanpa nilai dikirim sebagai `null` (bukan dihilangkan) pada respons. |
| Paginasi | `page` (mulai 1), `per_page`. Default publik 12 (maks 48), dashboard 20 (maks 100). |
| Pencarian | `q` minimal 2 karakter; lebih pendek diabaikan. |
| Filter multi | Nilai dipisah koma: `status=active,draft`. |
| Header permintaan | `X-Request-ID` opsional (diteruskan); server selalu mengembalikan `X-Request-ID`. |
| Cache | Endpoint `/public/*` (GET): `Cache-Control: public, max-age=60, stale-while-revalidate=300`. Endpoint lain: `Cache-Control: no-store`. |
| Bahasa pesan error | Bahasa Indonesia. Frontend memetakan tampilan berdasarkan `error.code`, bukan `message`. |

### 1.1 Pemetaan Query URL Website → API

Website memakai kunci query pendek (PRD §5.0); `frontend/src/lib/api/endpoints.ts` memetakannya:

| URL website | Parameter API |
|---|---|
| `listing` | `listing_type` |
| `market` | `market_type` |
| `type` | `property_type` |
| lainnya (`city`, `province`, `q`, `min_price`, …) | sama |

---

## 2. Autentikasi & Keamanan

### 2.1 Cookie Sesi

| Cookie | Isi | Atribut |
|---|---|---|
| `mp_access` | JWT access token (TTL 15 menit) | `HttpOnly; Path=/; Max-Age=900; SameSite=Lax; Secure`* |
| `mp_refresh` | Refresh token opaque (TTL 7 hari, rotasi) | `HttpOnly; Path=/api/v1/auth; Max-Age=604800; SameSite=Lax; Secure`* |

\* `Secure` aktif bila `COOKIE_SECURE=true` (produksi).

Klien browser memanggil API dengan `credentials: 'include'`. Token **tidak pernah** dikirim di body respons atau disimpan di `localStorage`.

### 2.2 Perlindungan CSRF

Semua request **terautentikasi** dengan metode `POST`, `PUT`, `PATCH`, `DELETE` wajib menyertakan header:

```
X-Requested-With: XMLHttpRequest
```

Tanpa header → `403 CSRF_HEADER_MISSING`. Endpoint `/public/*` dan `POST /auth/login` dikecualikan.

### 2.3 Alur Refresh

1. Request dashboard mendapat `401` dengan `error.code = "TOKEN_EXPIRED"`.
2. Klien memanggil `POST /auth/refresh` sekali (request paralel menunggu promise yang sama).
3. Sukses → ulangi request asli. Gagal (`401 REFRESH_INVALID`) → arahkan ke `/dashboard/login?next=<url>`.

### 2.4 Otorisasi

| Label di dokumen | Arti |
|---|---|
| 🌐 Publik | Tanpa autentikasi |
| 🔐 Login | Admin atau agen |
| 👑 Admin | Hanya admin (`403 FORBIDDEN` untuk agen) |

Agen yang mengakses properti milik agen lain menerima `404 NOT_FOUND` (bukan 403), agar keberadaan data tidak bocor.

### 2.5 Rate Limit

| Endpoint | Batas | Kunci |
|---|---|---|
| Semua `/api/*` (Traefik) | 30 req/dtk, burst 60 | IP |
| `POST /auth/login` | 5/menit; 10 gagal dalam 15 menit → kunci email 15 menit | IP + email |
| `POST /auth/refresh` | 30/menit | IP |
| `POST /public/properties/{slug}/events` | 1 per jenis event per listing per 30 menit (sisanya diterima tapi tidak dihitung) | IP |
| Upload (`/images`, `/avatar`, `/photo`) | 30/menit | user |

Melebihi batas → `429 RATE_LIMITED` + header `Retry-After` (detik).

---

## 3. Format Respons & Error

### 3.1 Sukses

```json
{
  "success": true,
  "data": { },
  "meta": { "page": 1, "per_page": 12, "total": 128, "total_pages": 11 }
}
```

- `data`: objek atau array. `meta` hanya ada pada respons berpaginasi.
- `201 Created` untuk pembuatan, `204 No Content` (tanpa body) untuk aksi tanpa data balik, `202 Accepted` untuk event.

### 3.2 Error

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Data yang dikirim tidak valid",
    "details": [
      { "field": "price", "code": "required", "message": "Harga wajib diisi" },
      { "field": "land_area", "code": "required_for_type", "message": "Luas tanah wajib untuk tipe Rumah" }
    ]
  }
}
```

`details` hanya ada pada error validasi. `field` memakai nama field JSON (nested: `images[2]`).

### 3.3 Kode Error

| HTTP | `code` | Kapan |
|---|---|---|
| 400 | `BAD_REQUEST` | JSON rusak / query tidak bisa di-parse |
| 401 | `UNAUTHENTICATED` | Tidak ada / tidak valid access token |
| 401 | `TOKEN_EXPIRED` | Access token kedaluwarsa (klien harus refresh) |
| 401 | `INVALID_CREDENTIALS` | Email atau password salah |
| 401 | `REFRESH_INVALID` | Refresh token tidak ada, kedaluwarsa, dicabut, atau dipakai ulang |
| 401 | `INVALID_CURRENT_PASSWORD` | Password lama salah saat ganti password |
| 403 | `FORBIDDEN` | Peran tidak berhak |
| 403 | `ACCOUNT_INACTIVE` | Akun dinonaktifkan |
| 403 | `CSRF_HEADER_MISSING` | Header `X-Requested-With` tidak ada |
| 404 | `NOT_FOUND` | Resource tidak ada / bukan milik agen / listing publik tidak `active` |
| 409 | `EMAIL_TAKEN` | Email sudah dipakai |
| 409 | `INVALID_STATUS_TRANSITION` | Transisi status tidak diizinkan (PRD §7.2) |
| 409 | `LAST_ACTIVE_ADMIN` | Menonaktifkan admin aktif terakhir |
| 413 | `PAYLOAD_TOO_LARGE` | File > 10 MB atau body > 60 MB |
| 415 | `UNSUPPORTED_MEDIA_TYPE` | Bukan JPEG/PNG/WebP |
| 422 | `VALIDATION_ERROR` | Validasi field gagal |
| 422 | `PUBLISH_REQUIREMENTS_NOT_MET` | Menayangkan listing tanpa foto/field wajib (`details` berisi yang kurang) |
| 422 | `IMAGE_LIMIT_EXCEEDED` | Total foto > 20 |
| 422 | `IMAGE_TOO_SMALL` | Sisi terpendek < 600 px |
| 422 | `CANNOT_DEACTIVATE_SELF` | Admin menonaktifkan dirinya sendiri |
| 422 | `TYPE_NOT_ALLOWED_FOR_LISTING` | Mis. tanah untuk disewa |
| 422 | `EXPORT_TOO_LARGE` | Ekspor > 10.000 baris |
| 429 | `RATE_LIMITED` | Melebihi rate limit |
| 500 | `INTERNAL_ERROR` | Kesalahan server (detail hanya di log) |
| 503 | `SERVICE_UNAVAILABLE` | DB/storage tidak tersedia |

### 3.4 Kode Validasi (`details[].code`)

`required`, `required_for_type`, `not_allowed_for_type`, `min`, `max`, `min_length`, `max_length`, `email`, `oneof`, `uuid`, `url`, `phone_id`, `password_weak`, `mismatch`, `unique`, `exists`.

---

## 4. Objek Data

### 4.1 Referensi

```jsonc
// PropertyType
{ "id": 1, "slug": "rumah", "name_id": "Rumah", "name_en": "House", "allow_sale": true, "allow_rent": true }

// Facility
{ "id": 4, "slug": "kolam-renang", "name_id": "Kolam Renang", "name_en": "Swimming Pool", "icon": "waves" }

// Province
{ "id": 21, "slug": "kepulauan-riau", "name": "Kepulauan Riau" }

// City
{ "id": 2171, "slug": "kota-batam", "name": "Kota Batam", "kind": "kota",
  "province": { "id": 21, "slug": "kepulauan-riau", "name": "Kepulauan Riau" } }
```

### 4.2 Image

```json
{
  "id": "0192f0c4-8b7e-7c3a-9a51-2f6d1e0b9a10",
  "url": "https://media.masterpro.co.id/properties/0192f0c4-.../0192f0c5-....webp",
  "width": 2400,
  "height": 1600,
  "sort_order": 0,
  "is_cover": true
}
```

`url` = `MEDIA_PUBLIC_URL` + `/` + `object_key`. `width`/`height` dipakai `next/image`.

### 4.3 PropertyCard (publik, daftar)

```json
{
  "id": "0192f0c4-8b7e-7c3a-9a51-2f6d1e0b9a10",
  "code": "MP-000123",
  "slug": "rumah-minimalis-batam-centre-k3x9q2",
  "title": "Rumah Minimalis 2 Lantai di Batam Centre",
  "listing_type": "sale",
  "market_type": "secondary",
  "property_type": { "id": 1, "slug": "rumah", "name_id": "Rumah", "name_en": "House" },
  "price": 1250000000,
  "rent_period": null,
  "is_price_negotiable": true,
  "location": {
    "district": "Batam Kota",
    "city": { "id": 2171, "slug": "kota-batam", "name": "Kota Batam" },
    "province": { "id": 21, "slug": "kepulauan-riau", "name": "Kepulauan Riau" }
  },
  "land_area": 120,
  "building_area": 140,
  "bedrooms": 3,
  "bathrooms": 2,
  "total_rooms": null,
  "cover_image": { "url": "https://media.masterpro.co.id/properties/.../....webp", "width": 2400, "height": 1600 },
  "image_count": 12,
  "agent": { "agent_code": "AG-0007", "name": "Budi Santoso", "whatsapp_number": "6281234567890" },
  "published_at": "2026-10-20T02:00:00Z"
}
```

`agent` dimuat agar tombol *Hubungi Agen* di kartu (PRD WEB-H-02) dapat membentuk tautan WhatsApp tanpa request tambahan.

### 4.4 PropertyDetail (publik)

Semua field `PropertyCard`, ditambah:

```jsonc
{
  "description": "Rumah siap huni ...\nDekat sekolah dan pusat belanja.",
  "address": "Perumahan Contoh Indah Blok A No. 5",
  "latitude": 1.128,
  "longitude": 104.053,
  "maid_bedrooms": 1,
  "floors": 2,
  "floor_level": null,
  "carports": 2,
  "garages": 0,
  "electricity_va": 2200,
  "water_source": "PDAM",
  "certificate": "shm",
  "furnishing": "semi_furnished",
  "facing": "north",
  "year_built": 2019,
  "video_url": "https://www.youtube.com/watch?v=xxxx",
  "facilities": [ { "id": 1, "slug": "carport", "name_id": "Carport", "name_en": "Carport", "icon": "car" } ],
  "images": [ { "id": "...", "url": "...", "width": 2400, "height": 1600, "sort_order": 0, "is_cover": true } ],
  "agent": {                       // memperluas agent dari PropertyCard
    "agent_code": "AG-0007",
    "name": "Budi Santoso",
    "photo_url": "https://media.masterpro.co.id/avatars/.../....webp",
    "whatsapp_number": "6281234567890"
  },
  "updated_at": "2026-10-25T08:30:00Z"
}
```

Agen publik **tidak** memuat email, telepon pribadi, atau id internal.

### 4.5 Property (dashboard)

Semua field `PropertyDetail`, ditambah/diubah:

```json
{
  "status": "active",
  "agent": {
    "id": "0192...",
    "agent_code": "AG-0007",
    "name": "Budi Santoso",
    "photo_url": "...",
    "whatsapp_number": "6281234567890",
    "status": "active"
  },
  "view_count": 342,
  "whatsapp_click_count": 18,
  "is_featured": false,
  "public_url": "https://masterpro.co.id/id/properti/rumah-minimalis-batam-centre-k3x9q2",
  "closed_at": null,
  "created_by": { "id": "0192...", "name": "Budi Santoso" },
  "updated_by": { "id": "0192...", "name": "Admin MasterPro" },
  "created_at": "2026-10-19T09:00:00Z",
  "updated_at": "2026-10-25T08:30:00Z"
}
```

`public_url` bernilai `null` bila status bukan `active`. Daftar dashboard (`GET /properties`) mengembalikan versi ringkas: field `PropertyCard` + `status`, `agent` (id, agent_code, name), `view_count`, `whatsapp_click_count`, `created_at`, `updated_at`.

### 4.6 User

```json
{
  "id": "0192...",
  "name": "Budi Santoso",
  "email": "budi@contoh.id",
  "phone": "081234567890",
  "role": "agent",
  "status": "active",
  "avatar_url": "https://media.masterpro.co.id/avatars/.../....webp",
  "last_login_at": "2026-10-27T01:12:00Z",
  "created_at": "2026-09-01T03:00:00Z",
  "updated_at": "2026-10-27T01:12:00Z",
  "agent": {
    "id": "0192...",
    "agent_code": "AG-0007",
    "whatsapp_number": "6281234567890",
    "bio": "Spesialis properti Batam Centre.",
    "service_area": "Batam Kota, Nongsa",
    "joined_at": "2026-09-01"
  }
}
```

`agent` bernilai `null` untuk admin.

### 4.7 Agent (admin)

```json
{
  "id": "0192...",
  "agent_code": "AG-0007",
  "whatsapp_number": "6281234567890",
  "bio": "Spesialis properti Batam Centre.",
  "service_area": "Batam Kota, Nongsa",
  "joined_at": "2026-09-01",
  "user": {
    "id": "0192...",
    "name": "Budi Santoso",
    "email": "budi@contoh.id",
    "phone": "081234567890",
    "status": "active",
    "avatar_url": "...",
    "last_login_at": "2026-10-27T01:12:00Z"
  },
  "listing_counts": { "total": 14, "draft": 1, "active": 9, "sold": 3, "rented": 0, "inactive": 1 },
  "created_at": "2026-09-01T03:00:00Z",
  "updated_at": "2026-10-01T03:00:00Z"
}
```

### 4.8 Enum

| Field | Nilai |
|---|---|
| `role` | `admin`, `agent` |
| `status` (user) | `active`, `inactive` |
| `listing_type` | `sale`, `rent` |
| `market_type` | `primary`, `secondary` |
| `status` (properti) | `draft`, `active`, `sold`, `rented`, `inactive` |
| `rent_period` | `monthly`, `yearly` |
| `certificate` | `shm`, `hgb`, `strata`, `girik`, `ajb`, `ppjb`, `other` |
| `furnishing` | `unfurnished`, `semi_furnished`, `fully_furnished` |
| `facing` | `north`, `south`, `east`, `west`, `northeast`, `northwest`, `southeast`, `southwest` |
| `sort` publik | `newest` (default), `price_asc`, `price_desc`, `popular`, `land_area_desc` |
| `sort` dashboard | `updated` (default), `newest`, `oldest`, `price_asc`, `price_desc`, `popular` |

---

## 5. Ringkasan Endpoint

| Metode | Path | Akses | Keterangan |
|---|---|---|---|
| GET | `/health` | 🌐 | Status layanan |
| GET | `/public/properties` | 🌐 | Katalog + pencarian + filter |
| GET | `/public/properties/{slug}` | 🌐 | Detail listing aktif |
| GET | `/public/properties/{slug}/similar` | 🌐 | Properti serupa |
| POST | `/public/properties/{slug}/events` | 🌐 | Catat `view` / `whatsapp_click` |
| GET | `/public/property-types` | 🌐 | Tipe properti |
| GET | `/public/facilities` | 🌐 | Fasilitas |
| GET | `/public/locations/provinces` | 🌐 | Provinsi |
| GET | `/public/locations/cities` | 🌐 | Kabupaten/kota |
| GET | `/public/sitemap/properties` | 🌐 | Slug + `updated_at` untuk sitemap |
| POST | `/auth/login` | 🌐 | Login |
| POST | `/auth/refresh` | 🌐 (cookie) | Rotasi sesi |
| POST | `/auth/logout` | 🔐 | Logout |
| GET | `/auth/me` | 🔐 | Pengguna saat ini |
| PATCH | `/account/profile` | 🔐 | Ubah profil sendiri |
| POST | `/account/avatar` | 🔐 | Unggah foto profil |
| DELETE | `/account/avatar` | 🔐 | Hapus foto profil |
| PUT | `/account/password` | 🔐 | Ganti password sendiri |
| GET | `/users` | 👑 | Daftar akun |
| POST | `/users` | 👑 | Buat akun admin |
| GET | `/users/{id}` | 👑 | Detail akun |
| PATCH | `/users/{id}` | 👑 | Ubah akun |
| PATCH | `/users/{id}/status` | 👑 | Aktif/nonaktif |
| PUT | `/users/{id}/password` | 👑 | Reset password |
| GET | `/agents` | 👑 | Daftar agen |
| GET | `/agents/options` | 👑 | Daftar ringkas untuk pilihan |
| POST | `/agents` | 👑 | Buat agen + akun |
| GET | `/agents/{id}` | 👑 | Detail agen |
| PATCH | `/agents/{id}` | 👑 | Ubah agen |
| POST | `/agents/{id}/photo` | 👑 | Unggah foto agen |
| GET | `/properties` | 🔐 | Daftar listing (agen: miliknya) |
| POST | `/properties` | 🔐 | Buat listing (draf) |
| GET | `/properties/export` | 👑 | Ekspor Excel |
| GET | `/properties/{id}` | 🔐 | Detail listing |
| PATCH | `/properties/{id}` | 🔐 | Ubah listing |
| PATCH | `/properties/{id}/status` | 🔐 | Ubah status |
| DELETE | `/properties/{id}` | 👑 | Hapus (soft delete) |
| POST | `/properties/{id}/images` | 🔐 | Unggah foto |
| PATCH | `/properties/{id}/images` | 🔐 | Urutan & cover |
| DELETE | `/properties/{id}/images/{image_id}` | 🔐 | Hapus foto |
| GET | `/dashboard/summary` | 🔐 | Statistik ringkas |

Semua path di atas relatif terhadap `/api/v1`.

---

## 6. Health

### `GET /health` 🌐

```json
200 { "success": true, "data": { "status": "ok", "database": "ok", "storage": "ok", "version": "3f2a9c1" } }
503 { "success": false, "error": { "code": "SERVICE_UNAVAILABLE", "message": "Database tidak tersedia" } }
```

---

## 7. Publik

### 7.1 `GET /public/properties` 🌐

Hanya listing yang memenuhi visibilitas publik (PRD §7.2).

| Query | Tipe | Keterangan |
|---|---|---|
| `q` | string | Judul, kode, alamat, kecamatan, deskripsi, nama kota |
| `listing_type` | enum | `sale` \| `rent` |
| `market_type` | enum | `primary` \| `secondary` |
| `property_type` | slug, multi | mis. `rumah,ruko` |
| `province` | slug | |
| `city` | slug, multi | |
| `min_price`, `max_price` | int | rupiah |
| `min_land_area`, `max_land_area` | number | m² |
| `min_building_area`, `max_building_area` | number | m² |
| `bedrooms`, `bathrooms` | int | minimum |
| `certificate` | enum, multi | |
| `furnishing` | enum, multi | |
| `sort` | enum | lihat §4.8 |
| `page`, `per_page` | int | default 1, 12; maks 48 |

**200** → `data: PropertyCard[]` + `meta`.

### 7.2 `GET /public/properties/{slug}` 🌐

**200** → `data: PropertyDetail`. **404** bila tidak ada / tidak tayang.

### 7.3 `GET /public/properties/{slug}/similar` 🌐

Query: `limit` (default 8, maks 12). Kriteria: tipe & kota sama, `listing_type` sama, harga ±30%, bukan listing itu sendiri; bila kurang, dilengkapi tipe & `listing_type` sama di provinsi sama, lalu terbaru. **200** → `data: PropertyCard[]`.

### 7.4 `POST /public/properties/{slug}/events` 🌐

```json
{ "type": "view" }            // atau "whatsapp_click"
```

**202** tanpa body (selalu, termasuk saat dedup). **404** bila listing tidak tayang. **422** bila `type` tidak valid.

### 7.5 `GET /public/property-types` 🌐

Query: `listing_type` (opsional, menyaring `allow_sale`/`allow_rent`). **200** → `data: (PropertyType & { "active_listing_count": int })[]`, urut `sort_order`.

### 7.6 `GET /public/facilities` 🌐

**200** → `data: Facility[]`, urut `sort_order`.

### 7.7 `GET /public/locations/provinces` 🌐

Query: `has_listings` (`true` → hanya yang punya listing tayang). **200** → `data: Province[]`.

### 7.8 `GET /public/locations/cities` 🌐

| Query | Keterangan |
|---|---|
| `province` | slug provinsi |
| `q` | cari nama (trigram, min 2 karakter) |
| `has_listings` | `true` → hanya yang punya listing tayang |
| `limit` | default 50, maks 600 |

**200** → `data: (City & { "active_listing_count": int })[]`, urut `active_listing_count DESC, name ASC`.

### 7.9 `GET /public/sitemap/properties` 🌐

**200** → `data: [{ "slug": "...", "updated_at": "..." }]` — semua listing tayang (maks 50.000, urut `updated_at DESC`).

---

## 8. Auth

### 8.1 `POST /auth/login` 🌐

```json
{ "email": "admin@masterpro.co.id", "password": "rahasia123" }
```

**200** → set cookie `mp_access` & `mp_refresh`; body:

```json
{ "success": true, "data": { "user": { /* User */ }, "access_expires_at": "2026-10-28T03:30:00Z" } }
```

Error: `401 INVALID_CREDENTIALS`, `403 ACCOUNT_INACTIVE`, `422 VALIDATION_ERROR`, `429 RATE_LIMITED`. Sukses memperbarui `last_login_at`.

### 8.2 `POST /auth/refresh` 🌐 (cookie `mp_refresh`)

Body kosong. **200** → cookie baru; `data: { "access_expires_at": "..." }`. **401 REFRESH_INVALID** → cookie dihapus. Pemakaian ulang refresh token yang sudah dirotasi mencabut seluruh sesi dalam *family* tersebut. Pengecualian *race* multi-tab: token lama yang dipakai ≤ 30 detik setelah dirotasi → `401 REFRESH_INVALID` **tanpa** mencabut sesi dan **tanpa** menghapus cookie (cookie baru sudah diterima tab lain).

### 8.3 `POST /auth/logout` 🔐

**204**. Mencabut sesi saat ini & menghapus kedua cookie. Idempoten.

### 8.4 `GET /auth/me` 🔐

**200** → `data: User`.

---

## 9. Akun Saya

### 9.1 `PATCH /account/profile` 🔐

```json
{
  "name": "Budi Santoso",
  "phone": "081234567890",
  "whatsapp_number": "6281234567890",
  "bio": "Spesialis properti Batam Centre.",
  "service_area": "Batam Kota, Nongsa"
}
```

Semua field opsional. `whatsapp_number`, `bio`, `service_area` hanya untuk agen (diabaikan untuk admin). Validasi: `name` 2–120; `phone` pola `^(\+62|62|0)8[0-9]{7,12}$`; `whatsapp_number` pola `^62[0-9]{8,13}$` (frontend menormalkan `08…`/`+62…` → `62…`). **200** → `data: User`. Memicu revalidasi listing agen.

### 9.2 `POST /account/avatar` 🔐

`multipart/form-data`, field `file` (JPEG/PNG/WebP, ≤ 10 MB). Diproses jadi WebP persegi 512 px. **200** → `data: User`.

### 9.3 `DELETE /account/avatar` 🔐

**200** → `data: User` (`avatar_url: null`).

### 9.4 `PUT /account/password` 🔐

```json
{ "current_password": "lama123", "new_password": "BaruAman2026", "new_password_confirmation": "BaruAman2026" }
```

Aturan password: 8–72 karakter, minimal 1 huruf dan 1 angka, tidak sama dengan password lama. **204**. Sesi lain dicabut; sesi saat ini tetap. Error: `401 INVALID_CURRENT_PASSWORD`, `422 VALIDATION_ERROR`.

---

## 10. Pengguna (Admin)

### 10.1 `GET /users` 👑

Query: `q` (nama/email), `role`, `status`, `sort` (`newest` default, `name`, `last_login`), `page`, `per_page`. **200** → `data: User[]` + `meta`.

### 10.2 `POST /users` 👑

Membuat akun **admin**.

```json
{ "name": "Siti Admin", "email": "siti@masterpro.co.id", "phone": "081200000000", "password": "AwalAman2026" }
```

**201** → `data: User`. Error: `409 EMAIL_TAKEN`, `422`.

### 10.3 `GET /users/{id}` 👑

**200** → `data: User`.

### 10.4 `PATCH /users/{id}` 👑

```json
{ "name": "Siti Admin", "email": "siti.admin@masterpro.co.id", "phone": "081200000001" }
```

**200** → `data: User`. Error: `409 EMAIL_TAKEN`.

### 10.5 `PATCH /users/{id}/status` 👑

```json
{ "status": "inactive" }
```

**200** → `data: User`. Menonaktifkan mencabut semua sesi akun tsb. dan (untuk agen) memicu revalidasi listing-nya. Error: `422 CANNOT_DEACTIVATE_SELF`, `409 LAST_ACTIVE_ADMIN`.

### 10.6 `PUT /users/{id}/password` 👑

```json
{ "new_password": "ResetAman2026" }
```

**204**. Semua sesi akun tsb. dicabut. Dicatat di `audit_logs` (tanpa password).

---

## 11. Agen (Admin)

### 11.1 `GET /agents` 👑

Query: `q` (nama/email/kode/WhatsApp), `status` (status akun), `sort` (`newest` default, `name`, `listings`), `page`, `per_page`. **200** → `data: Agent[]` + `meta`.

### 11.2 `GET /agents/options` 👑

Untuk pilihan agen di form properti. Query: `q`, `status` (default `active`). **200**:

```json
{ "success": true, "data": [ { "id": "0192...", "agent_code": "AG-0007", "name": "Budi Santoso", "status": "active" } ] }
```

### 11.3 `POST /agents` 👑

Membuat `users` (role `agent`) + `agents` dalam **satu transaksi**.

```json
{
  "name": "Budi Santoso",
  "email": "budi@contoh.id",
  "phone": "081234567890",
  "password": "AwalAman2026",
  "whatsapp_number": "6281234567890",
  "bio": "Spesialis properti Batam Centre.",
  "service_area": "Batam Kota, Nongsa",
  "joined_at": "2026-09-01"
}
```

Wajib: `name`, `email`, `password`, `whatsapp_number`. `agent_code` dibuat otomatis. **201** → `data: Agent`. Error: `409 EMAIL_TAKEN`, `422`.

### 11.4 `GET /agents/{id}` 👑

**200** → `data: Agent`. Listing agen diambil lewat `GET /properties?agent_id={id}`.

### 11.5 `PATCH /agents/{id}` 👑

Field sama dengan §11.3 kecuali `password` (semua opsional). **200** → `data: Agent`. Memicu revalidasi listing agen.

### 11.6 `POST /agents/{id}/photo` 👑

`multipart/form-data`, field `file`. Menyimpan ke avatar akun agen. **200** → `data: Agent`.

---

## 12. Properti (Dashboard)

Cakupan data otomatis: **admin** = semua listing (tidak termasuk yang dihapus); **agen** = `agent_id` miliknya.

### 12.1 `GET /properties` 🔐

| Query | Keterangan |
|---|---|
| `q` | judul, kode, alamat |
| `status` | multi |
| `listing_type`, `market_type` | |
| `property_type` | slug, multi |
| `city` | slug |
| `agent_id` | 👑 saja (diabaikan untuk agen) |
| `min_price`, `max_price` | |
| `created_from`, `created_to` | `YYYY-MM-DD` (WIB, inklusif) |
| `sort` | lihat §4.8 |
| `page`, `per_page` | default 1, 20; maks 100 |

**200** → `data: PropertyListItem[]` (§4.5 versi ringkas) + `meta`.

### 12.2 `POST /properties` 🔐

Selalu membuat listing berstatus **`draft`** (foto diunggah setelahnya, lalu tayangkan via §12.6).

```json
{
  "agent_id": "0192...",
  "listing_type": "sale",
  "market_type": "secondary",
  "property_type_id": 1,
  "title": "Rumah Minimalis 2 Lantai di Batam Centre",
  "description": "Rumah siap huni ...",
  "price": 1250000000,
  "rent_period": null,
  "is_price_negotiable": true,
  "province_id": 21,
  "city_id": 2171,
  "district": "Batam Kota",
  "address": "Perumahan Contoh Indah Blok A No. 5",
  "latitude": 1.128,
  "longitude": 104.053,
  "land_area": 120,
  "building_area": 140,
  "bedrooms": 3,
  "bathrooms": 2,
  "maid_bedrooms": 1,
  "floors": 2,
  "floor_level": null,
  "total_rooms": null,
  "carports": 2,
  "garages": 0,
  "electricity_va": 2200,
  "water_source": "PDAM",
  "certificate": "shm",
  "furnishing": "semi_furnished",
  "facing": "north",
  "year_built": 2019,
  "video_url": "https://www.youtube.com/watch?v=xxxx",
  "facility_ids": [1, 3, 6]
}
```

- `agent_id`: wajib untuk admin; untuk agen diabaikan (diisi agen pemanggil).
- Draf hanya mewajibkan: `listing_type`, `market_type`, `property_type_id`, `title`, `price`, `province_id`, `city_id` (+ `rent_period` bila `rent`). Kelengkapan penuh dicek saat tayang (PRD §7.4).
- Field yang "tidak dipakai" untuk tipe tsb. → `422 not_allowed_for_type` bila diisi non-null.
- `city_id` harus milik `province_id`. `video_url` hanya domain `youtube.com`/`youtu.be`.
- Tipe tidak mengizinkan sewa → `422 TYPE_NOT_ALLOWED_FOR_LISTING`.

**201** → `data: Property`.

### 12.3 `GET /properties/{id}` 🔐

**200** → `data: Property`.

### 12.4 `PATCH /properties/{id}` 🔐

Body: field §12.2, semua opsional (`code`, `slug`, `status` tidak dapat diubah di sini). `agent_id` hanya diterima dari admin (agen → `403 FORBIDDEN`). Bila listing `active` dan perubahan membuat syarat tayang tidak terpenuhi → `422 PUBLISH_REQUIREMENTS_NOT_MET`. **200** → `data: Property`. Memicu revalidasi.

### 12.5 `DELETE /properties/{id}` 👑

**204**. Soft delete (`deleted_at`). Memicu revalidasi. Dicatat di audit.

### 12.6 `PATCH /properties/{id}/status` 🔐

```json
{ "status": "sold" }
```

Transisi sesuai PRD §7.2. **200** → `data: Property`. Error: `409 INVALID_STATUS_TRANSITION`, `422 PUBLISH_REQUIREMENTS_NOT_MET`:

```json
{
  "success": false,
  "error": {
    "code": "PUBLISH_REQUIREMENTS_NOT_MET",
    "message": "Listing belum memenuhi syarat untuk ditayangkan",
    "details": [
      { "field": "images", "code": "required", "message": "Minimal 1 foto" },
      { "field": "certificate", "code": "required_for_type", "message": "Sertifikat wajib untuk properti dijual" }
    ]
  }
}
```

### 12.7 `POST /properties/{id}/images` 🔐

`multipart/form-data`, field `files` (berulang, 1–20 file per request). Batas: 10 MB/file, 60 MB/request, total foto per listing ≤ 20.

**201**:

```json
{
  "success": true,
  "data": {
    "uploaded": [ { /* Image */ } ],
    "failed": [ { "filename": "IMG_0001.HEIC", "code": "UNSUPPORTED_MEDIA_TYPE", "message": "Format harus JPG, PNG, atau WebP" } ]
  }
}
```

Foto pertama pada listing tanpa cover otomatis menjadi cover. Total melebihi 20 → `422 IMAGE_LIMIT_EXCEEDED` (tidak ada yang diunggah).

### 12.8 `PATCH /properties/{id}/images` 🔐

```json
{ "order": ["id-foto-3", "id-foto-1", "id-foto-2"], "cover_image_id": "id-foto-3" }
```

`order` harus memuat **semua** id foto listing tsb. tepat sekali. **200** → `data: Image[]` (urut baru). Memicu revalidasi.

### 12.9 `DELETE /properties/{id}/images/{image_id}` 🔐

**204**. Objek di storage ikut dihapus. Bila cover dihapus, foto urutan pertama berikutnya menjadi cover. Menghapus foto terakhir dari listing `active` → `422 PUBLISH_REQUIREMENTS_NOT_MET`.

### 12.10 `GET /properties/export` 👑

Query: sama dengan §12.1 (tanpa `page`/`per_page`). Respons:

```
200 OK
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
Content-Disposition: attachment; filename="masterpro-properti-20261028-1015.xlsx"
```

Isi file sesuai PRD §6.6. Error: `422 EXPORT_TOO_LARGE`. Frontend mengunduh via `fetch` → `blob` (bukan tautan langsung) agar error JSON dapat ditampilkan.

---

## 13. Ringkasan Dashboard

### `GET /dashboard/summary` 🔐

Data dibatasi milik agen untuk peran agen.

```json
{
  "success": true,
  "data": {
    "properties": { "total": 124, "draft": 6, "active": 88, "sold": 17, "rented": 5, "inactive": 8 },
    "agents": { "total": 23, "active": 21 },
    "totals": { "view_count": 15320, "whatsapp_click_count": 812 },
    "top_viewed": [ { "id": "...", "code": "MP-000123", "title": "...", "view_count": 342, "whatsapp_click_count": 18, "cover_image": { } } ],
    "recently_updated": [ { "id": "...", "code": "MP-000140", "title": "...", "status": "draft", "updated_at": "..." } ]
  }
}
```

`agents` bernilai `null` untuk peran agen. `top_viewed` & `recently_updated` masing-masing maks 5.

---

## Lampiran A — Checklist Menambah Endpoint

1. Tambahkan ke dokumen ini (ringkasan §5 + detail) di PR yang sama.
2. Tambahkan DTO di `dto.go`, route di `routes.go` modul terkait, registrasi di `internal/http/router.go`.
3. Tambahkan tipe di `frontend/src/types/*` dan fungsi pemanggil di `frontend/src/lib/api/endpoints.ts`.
4. Test service (unit) + test handler untuk kode status utama.
