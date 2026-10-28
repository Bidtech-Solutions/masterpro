# DESIGN.md — Design System & Prompt Desain MasterPro

> Sumber kebenaran visual untuk website katalog dan dashboard MasterPro. Token di sini diterjemahkan 1:1 ke `frontend/src/styles/globals.css`. Bagian 10 berisi prompt siap pakai untuk AI design generator (Google Stitch, dsb.).
>
> Konteks produk: [`PRD.md`](./PRD.md). Kontrak data: [`API.md`](./API.md).
>
> **Referensi visual yang disetujui**: landing page hasil Google Stitch di [`stitch/home.png`](./stitch/home.png) + [`stitch/home.html`](./stitch/home.html), token ekspor Stitch di [`stitch/DESIGN.stitch.md`](./stitch/DESIGN.stitch.md). Bila ada perbedaan, **§0 di bawah menang** atas bagian lain dokumen ini, dan dokumen ini menang atas file `stitch/` (file Stitch hanya referensi, tidak diedit).

---

## 0. Keputusan Desain dari Stitch (disetujui 28 Okt 2026)

| Area | Keputusan | Implementasi |
|---|---|---|
| Font aksen | **Playfair Display** italic (500/600) untuk 1–3 kata penekanan di heading: "Master-nya Properti", "Terbaru", "Kami". Maksimal satu aksen per heading; tidak untuk body/tombol. | `--font-accent`, komponen `SectionHeading` prop `accent` |
| Header | Tinggi 80 px, putih, shadow tipis. Menu: Beranda · Properti · Daftar Agen (aktif: teks `blue-600` bold + garis bawah 2 px). Kanan: pill ID/EN + tombol primary **Masuk** (ikon login) ke dashboard. | `components/layout/site-header.tsx` |
| Hero | Foto full-bleed + overlay gradien `navy-950/90 → navy-900/75 → blue-700/40` (kiri→kanan) dan `navy-950/95` dari bawah. Judul putih, aksen `sky-300`. Tidak memakai pita dekoratif. | `components/home/hero-search.tsx`, foto `public/images/hero.jpg` |
| Kotak pencarian | Kartu putih radius 24 px. Tiga field ber-label overline uppercase `slate-500`: **Lokasi** (ikon pin), **Tipe Properti** (ikon gedung), **Rentang Harga** (ikon uang); field latar `slate-50`, border `slate-200`, fokus border `blue-600`. Tombol primary **Cari Properti** (ikon cari). Tanpa tab Beli/Sewa & chip kategori. | sda |
| Heading section | Plus Jakarta Sans 800 `navy-900` + kata aksen Playfair italic `blue-600`. Kanan: tombol pill "Lihat Semua →" (`blue-50`, teks `blue-700`, hover `blue-600` putih) + tombol panah bulat 40 px. | `components/common/section-heading.tsx` |
| Kartu ringkas (Beranda) | Radius 16 px, border `slate-200/80`, shadow `card` → `card-hover`; foto 4:3 zoom 1.05 saat hover; **harga `blue-600`** Plus Jakarta 800 dalam format lengkap (`Rp 1.450.000.000`, sewa + "/tahun"); judul 18 px bold `navy-900` (hover `blue-600`); lokasi `slate-500` + ikon pin; garis `slate-100`; dua tombol sama lebar: **Detail →** (secondary) dan **Hubungi Agen** (WhatsApp). 3 kartu terlihat di desktop. | `components/property/property-card.tsx` (`variant="compact"`) |
| Kartu katalog | Varian `full` = kartu ringkas + badge (Dijual/Disewa, Primary/Secondary) di kiri atas foto, jumlah foto di kanan atas, dan baris ikon spesifikasi (§6.3) di atas tombol. | `variant="full"` |
| Mitra | Judul "Mitra *Kami*" di tengah, marquee logo grayscale → berwarna saat hover, fade tepi, 28 dtk per putaran. | `components/home/partner-marquee.tsx` |
| CTA Populer | Banner gradien brand radius 24 px, lingkaran dekoratif putih transparan, foto arsitektur samar (mask gradien) di sisi kanan, tombol putih teks `navy-950`. | `components/home/popular-cta.tsx` |
| Footer | `navy-950`; 4 kolom (Brand · Tipe Properti · Kota Populer · Perusahaan), ikon kontak `sky-400`, judul kolom 20 px putih bold. | `components/layout/site-footer.tsx` |
| Ikon | Desain Stitch memakai Material Symbols; implementasi **tetap lucide-react** (padanan: `location_on`→`MapPin`, `apartment`→`Building2`, `payments`→`Banknote`, `search`→`Search`, `login`→`LogIn`, `chat`→`MessageCircle`, `arrow_forward`→`ArrowRight`). | — |
| Tombol WhatsApp | Stitch memakai teks putih di `#25D366` (kontras 2:1, gagal WCAG AA). **Ditetapkan** teks `#063B1D` (kontras 6,4:1). | token `whatsapp-foreground` |
| Latar halaman | Stitch `surface #FAF8FF`; ditetapkan `#FFFFFF` untuk section utama dan `blue-50` untuk section selang-seling (perbedaan tidak terlihat, menjaga token tetap sederhana). | — |

---

## 1. Esensi Brand

**MasterPro Real Estate** — perusahaan yang menaungi jaringan agen properti untuk jual (primary & secondary) dan sewa.

| Aspek | Arah |
|---|---|
| Kepribadian | Terpercaya · profesional · modern · sigap · ramah |
| Janji | "Temukan properti yang tepat, didampingi agen yang tepat." |
| Kesan visual | Bersih, lapang, foto properti sebagai bintang, aksen biru brand yang percaya diri |
| Hindari | Kesan murahan/iklan ramai, warna hijau dari template materi lama, gradien berlebihan, stok foto generik orang tersenyum |

### 1.1 Membaca Logo

Logo terdiri dari **pin lokasi** berbentuk pita biru yang melingkar membentuk tetesan, dengan **siluet rumah putih** (empat jendela) di tengahnya. Wordmark: **MASTER** (navy, tebal) + **PRO** (biru terang, tebal), di bawahnya **REAL ESTATE** (navy, huruf berjarak lebar).

Turunan desain dari logo:
- **Navy** = keahlian & kepercayaan → teks utama, header gelap, footer.
- **Biru terang** = profesional & dinamis → aksi utama, tautan, highlight.
- **Gradien cyan → biru** dari pita → hanya untuk aksen dekoratif (hero, CTA banner, ilustrasi), tidak untuk teks.
- **Pita melengkung** → motif dekoratif (lengkung lembut di sudut hero/CTA, pemisah section).
- **Pin lokasi** → ikon lokasi di seluruh UI; penanda "dekat Anda".
- **Sudut membulat** dari bentuk pin → radius lembut di kartu dan input.

### 1.2 Penggunaan Logo

- Area bebas minimum = tinggi huruf "M" di sekeliling logo.
- Ukuran minimum: logo lengkap 120 px lebar; di bawah itu pakai **logo-mark** (pin saja) — mis. favicon, avatar default.
- Di atas latar gelap/foto: varian putih (`logo-white.svg`) — **[minta ke klien]** versi SVG resmi berwarna, putih, dan mark.
- Jangan: mengubah warna wordmark, memberi bayangan/outline, memutar, atau meletakkan versi berwarna di atas foto ramai.

---

## 2. Warna

### 2.1 Palet Brand

| Token | Hex | Sumber / pemakaian |
|---|---|---|
| `navy-950` | `#071737` | Footer, overlay gelap |
| `navy-900` | `#0A1F4D` | Sidebar dashboard, teks judul besar |
| `navy-800` | `#0D2B6B` | Warna "MASTER" — heading, teks brand, badge *Dijual*, header tabel Excel |
| `navy-700` | `#163A85` | Hover elemen navy |
| `blue-700` | `#0957C3` | Hover/pressed tombol utama |
| `blue-600` | `#0B6BEA` | **Primary** — tombol utama, tautan, fokus, elemen aktif |
| `blue-500` | `#1E88F5` | Warna "PRO" — ikon, aksen besar, grafik (bukan teks kecil) |
| `blue-100` | `#DCEBFF` | Latar chip terpilih, highlight lembut |
| `blue-50` | `#EEF5FF` | Latar section selang-seling, hover baris tabel |
| `sky-400` | `#3FC1F5` | Ujung terang gradien |
| `sky-300` | `#5ECFFF` | Dekorasi pita, ilustrasi |

**Gradien brand**: `linear-gradient(135deg, #5ECFFF 0%, #1E88F5 45%, #0B6BEA 70%, #0D2B6B 100%)`.

> **Kontras**: teks putih di atas `blue-600` = 4,9:1 (lolos AA). Di atas `blue-500` hanya 3,6:1 → `blue-500` **tidak boleh** dipakai sebagai latar teks ukuran normal.

### 2.2 Netral

| Token | Hex | Pemakaian |
|---|---|---|
| `slate-900` | `#0F172A` | Teks body utama |
| `slate-700` | `#334155` | Teks sekunder |
| `slate-500` | `#64748B` | Teks bantu, placeholder, ikon non-aktif |
| `slate-300` | `#CBD5E1` | Border input |
| `slate-200` | `#E2E8F0` | Border kartu, pemisah |
| `slate-100` | `#F1F5F9` | Latar skeleton, field disabled |
| `slate-50` | `#F8FAFC` | Latar halaman dashboard |
| `white` | `#FFFFFF` | Latar halaman website, kartu |

### 2.3 Semantik & Status

| Makna | Token | Hex | Pemakaian |
|---|---|---|---|
| Sukses | `success` | `#16A34A` | Toast sukses, status *Tayang* |
| Peringatan | `warning` | `#D97706` | Status *Draf*, peringatan |
| Bahaya | `danger` | `#DC2626` | Hapus, error validasi |
| Info | `info` | `#0B6BEA` | Info, tautan |
| Aksen | `amber-400` | `#FBBF24` | Badge *Populer*/*Baru*, bintang — sangat hemat |

**Badge listing (website)**

| Badge | Latar | Teks |
|---|---|---|
| Dijual | `navy-800` | putih |
| Disewa | `#0E7490` (teal-700) | putih |
| Primary (baru) | `amber-50` `#FFFBEB` + border `amber-400` | `#92400E` |
| Secondary | `slate-100` | `slate-700` |
| Tipe properti | putih/90% + blur | `navy-800` |

**Status listing (dashboard)**

| Status | Latar | Teks | Titik |
|---|---|---|---|
| Draf | `#FEF3C7` | `#92400E` | `warning` |
| Tayang | `#DCFCE7` | `#166534` | `success` |
| Terjual | `#E0E7FF` | `#3730A3` | `#4F46E5` |
| Tersewa | `#CFFAFE` | `#155E75` | `#0891B2` |
| Nonaktif | `slate-100` | `slate-500` | `slate-400` |

### 2.4 Mode Gelap

Tidak ada di v1. Token tetap disusun semantik (`--color-primary`, `--color-surface`, …) agar mudah ditambah nanti.

---

## 3. Tipografi

| Peran | Font | Bobot |
|---|---|---|
| Heading, harga, angka besar, label tombol | **Plus Jakarta Sans** (Google Fonts, karya desainer Indonesia; geometris seperti wordmark logo) | 600, 700, 800 |
| Body, form, tabel | **Inter** | 400, 500, 600 |
| Aksen heading (§0) | **Playfair Display** italic | 500, 600 |

Dimuat via `next/font/google` (subset `latin`, `display: swap`). Angka harga & tabel memakai `font-variant-numeric: tabular-nums`.

| Token | Ukuran / tinggi baris | Pemakaian |
|---|---|---|
| `display` | 48/56 (mobile 34/42), 800 | Judul hero |
| `h1` | 36/44 (mobile 28/36), 700 | Judul halaman, judul detail properti |
| `h2` | 28/36 (mobile 22/30), 700 | Judul section |
| `h3` | 20/28, 700 | Judul kartu besar, sub-section |
| `price-lg` | 32/40, 800, `blue-600` | Harga di detail |
| `price` | 20/28, 800, `blue-600` | Harga di kartu |
| `body-lg` | 18/28, 400 | Subjudul hero, lead |
| `body` | 16/24, 400 | Teks umum (website) |
| `body-sm` | 14/20, 400/500 | Dashboard, meta kartu, form |
| `caption` | 12/16, 500 | Badge, label kecil, keterangan |
| `overline` | 12/16, 700, uppercase, tracking 0.12em | Label section kecil (meniru "REAL ESTATE") |

---

## 4. Layout, Spasi, Bentuk

| Item | Nilai |
|---|---|
| Grid spasi | Kelipatan 4 px (Tailwind default) |
| Lebar kontainer website | maks 1280 px, padding samping 16 px (mobile) / 24 px (tablet) / 32 px (desktop) |
| Jarak antar section website | 64 px mobile · 96 px desktop |
| Breakpoint | `sm 640` · `md 768` · `lg 1024` · `xl 1280` · `2xl 1536` |
| Grid kartu properti | 1 kolom (<640) · 2 (≥640) · 3 (≥1024) · 4 (≥1280, hanya di halaman tanpa sidebar) |
| Radius | `sm 8px` (badge, input kecil) · `md 12px` (input, tombol) · `lg 16px` (kartu) · `xl 24px` (kotak pencarian hero, banner CTA) · `full` (chip, avatar, pill) |
| Bayangan | `card`: `0 1px 2px rgba(13,43,107,.06), 0 4px 12px rgba(13,43,107,.06)` · `card-hover`: `0 8px 24px rgba(13,43,107,.12)` · `popover`: `0 12px 32px rgba(13,43,107,.16)` — bayangan bernuansa navy, bukan hitam |
| Border | 1 px `slate-200` |
| Fokus | ring 2 px `blue-600` + offset 2 px putih — selalu terlihat |

Dashboard: sidebar 264 px (collapsible jadi 72 px), topbar 64 px, konten padding 24 px, latar `slate-50`, kartu putih.

---

## 5. Ikon, Foto, Ilustrasi, Gerak

- **Ikon**: `lucide-react`, stroke 1.75, ukuran 16/20/24. Ikon spesifikasi: `BedDouble` (KT), `Bath` (KM), `LandPlot`/`Maximize` (LT), `Ruler`/`Home` (LB), `MapPin` (lokasi), `Car` (carport), `Zap` (listrik), `FileCheck` (sertifikat), `Building2` (apartemen/ruko), `DoorOpen` (kamar kos).
- **Foto properti**: rasio kartu 4:3, hero detail 16:10; `object-fit: cover`; placeholder `slate-100` + ikon rumah saat memuat; overlay gradien gelap tipis di bawah hanya bila ada teks di atas foto.
- **Hero**: foto arsitektur/hunian Indonesia yang terang (siang hari), dengan lengkung pita gradien brand di sisi kanan/bawah sebagai elemen khas.
- **Ilustrasi** (halaman Daftar Agen, empty state): gaya flat-isometrik sederhana dengan palet brand, garis lembut — bukan 3D berlebihan.
- **Gerak**: durasi 150–250 ms, `ease-out`. Hover kartu: naik 2 px + `card-hover`, foto zoom 1.03. Marquee partner 30–40 dtk per putaran. Semua animasi dimatikan pada `prefers-reduced-motion`.

---

## 6. Komponen Inti

### 6.1 Tombol

| Varian | Gaya | Pemakaian |
|---|---|---|
| Primary | latar `blue-600`, teks putih, hover `blue-700` | Cari, Simpan, Tayangkan |
| WhatsApp | latar `#25D366`, hover `#1EBE5A`, teks **`#063B1D`** (kontras), ikon WhatsApp | Hubungi agen / admin — satu-satunya pengecualian warna |
| Secondary | latar putih, border `slate-300`, teks `navy-800` | Aksi kedua |
| Navy | latar `navy-800`, teks putih | CTA di atas latar terang yang butuh bobot |
| Ghost | transparan, teks `blue-600` | Aksi tersier, "Lihat semua →" |
| Destructive | latar `danger`, teks putih | Hapus |

Tinggi: `sm 36` · `md 44` (default, area sentuh) · `lg 52` (hero). Radius `md`. Label Plus Jakarta Sans 600.

### 6.2 Input & Pencarian

- Input tinggi 44 px, radius `md`, border `slate-300`, fokus border + ring `blue-600`, label di atas (bukan placeholder sebagai label), pesan error merah 12 px di bawah.
- **Kotak pencarian hero**: kartu putih radius `xl`, bayangan `popover`, tab *Beli / Sewa* (pill) di atas; baris: Kata kunci (ikon cari) · Tipe properti (select) · Lokasi (kombobox dengan ikon pin) · tombol Primary *Cari* lebar. Mobile: field bertumpuk, tombol penuh.
- **Bar pencarian katalog**: versi horizontal ringkas, sticky di bawah header saat scroll.

### 6.3 Kartu Properti

```
┌─────────────────────────────┐
│ [Dijual] [Primary]   ⧉ 12   │  ← badge kiri atas, jumlah foto kanan atas
│        FOTO 4:3             │
│ [Rumah]                     │  ← badge tipe kiri bawah foto
├─────────────────────────────┤
│ Rp 1,25 M          Bisa nego│  ← price, blue-600
│ Rumah Minimalis 2 Lantai…   │  ← h3 16/24 600, maks 2 baris
│ 📍 Batam Kota, Kota Batam   │  ← body-sm slate-500
│ ─────────────────────────── │
│ 🛏 3   🛁 2   LT 120 m²  LB 140 m² │  ← ikon spesifikasi, caption
└─────────────────────────────┘
```

Sewa: harga + "/bulan" atau "/tahun" lebih kecil `slate-500`. Kos: tampilkan jumlah kamar. Tanah: hanya LT. Kartu seluruhnya satu tautan, radius `lg`, border `slate-200`.

### 6.4 Detail Properti

- **Galeri**: grid 2 kolom — kiri 1 foto besar (rasio 16:10), kanan 2×2 foto kecil; foto ke-5 berisi overlay "+N foto". Radius `lg` pada sudut luar grid. Lightbox latar `navy-950/95%`.
- **Kartu agen (sticky)**: kartu putih radius `lg`, harga besar di atas, avatar 56 px + nama + kode agen, tombol WhatsApp penuh, tombol Secondary "Bagikan", catatan kecil "Respon cepat via WhatsApp".
- **Tabel spesifikasi**: 2 kolom label–nilai, zebra `slate-50`, ikon di label.
- **Kalkulator KPR**: kartu `blue-50`, slider + input angka untuk DP/tenor/bunga, hasil cicilan besar `price-lg` `blue-600`, rincian kecil di bawah, disclaimer `caption`.

### 6.5 Partner Marquee

Logo abu-abu (grayscale, opasitas 70%) tinggi 32–40 px, berwarna penuh saat hover. Fade putih di kedua tepi.

### 6.6 Flowchart Pendaftaran Agen

Langkah bernomor dalam lingkaran gradien brand, dihubungkan garis putus-putus/lengkung pita; tiap langkah: ikon, judul, 1–2 kalimat. Desktop horizontal 6 langkah (bisa 2 baris 3-3 berbentuk ular), mobile vertikal timeline.

### 6.7 Tabel Komisi

Kartu putih; header `navy-800` teks putih; baris rentang harga + persentase besar `blue-600`; tabel pembagian berupa 5 kartu kecil (Agen Selling 40%, Agen Listing 30%, Manager 5%, Master Cool 5%, MasterPro 20%) dengan bar proporsi horizontal, plus keterangan peran.

### 6.8 Dashboard

- **Sidebar** `navy-900`: logo putih di atas, menu ikon+label (Ringkasan, Properti, Agen*, Pengguna*, Akun Saya) — *admin saja; item aktif latar `navy-700` + bar kiri `sky-300`; di bawah: kartu profil kecil + Keluar.
- **Topbar** putih: breadcrumb/judul halaman, tombol aksi utama halaman (mis. "+ Tambah Properti"), avatar menu.
- **Stat card**: ikon dalam lingkaran `blue-50`, angka besar Plus Jakarta Sans 700, label `slate-500`.
- **Data table**: header `slate-50` teks `slate-500` caption uppercase; baris 56 px dengan thumbnail 48×36 radius `sm`; hover `blue-50`; kolom aksi (ikon lihat, edit, menu ⋯); toolbar di atas (cari, filter, tombol ekspor); paginasi di bawah; state kosong & skeleton.
- **Form properti**: layout dua kolom (form kiri ~ 2/3, panel kanan sticky berisi status, agen, ringkasan kelengkapan & tombol Simpan Draf / Tayangkan); section dalam kartu bernomor; field spesifikasi berubah sesuai tipe; uploader foto dropzone + grid thumbnail yang bisa di-drag, badge "Cover".
- **Dialog konfirmasi** untuk aksi destruktif & perubahan status; toast (sonner) kanan atas.

---

## 7. Peta Halaman (Struktur Visual)

### 7.1 Website

| Halaman | Urutan blok |
|---|---|
| **Beranda** | Header → Hero (foto + pita gradien, judul, subjudul, kotak pencarian, chip kategori) → Dijual Terbaru (judul section + "Lihat semua", carousel kartu, panah) → Disewa Terbaru (latar `blue-50`) → Partner marquee ("Bermitra dengan bank terpercaya") → CTA Populer (banner gradien brand radius `xl`, ilustrasi pin/rumah, tombol putih) → Footer |
| **Properti** | Header → judul + bar pencarian sticky → baris: jumlah hasil, chip filter aktif, dropdown urutan → [sidebar filter 280 px | grid kartu 3 kolom] → paginasi → Footer |
| **Detail** | Header → breadcrumb → galeri → [kolom kiri: judul+badge+lokasi+kode, chip spesifikasi, deskripsi, tabel spesifikasi, fasilitas, video, lokasi/maps, kalkulator KPR | kolom kanan sticky: kartu agen] → Properti serupa → CTA → Footer; mobile: bar bawah sticky harga + WhatsApp |
| **Daftar Agen** | Header → Hero (judul, subjudul, tombol WhatsApp, ilustrasi agen) → Keuntungan (grid ikon) → Struktur Komisi → Alur Pendaftaran (flowchart) → FAQ → Kontak (kartu WhatsApp/telepon, email, alamat + peta statis, sosmed) → Footer |
| **Header** | lihat §0 (80 px, menu Beranda/Properti/Daftar Agen, pill ID/EN, tombol Masuk) |
| **Footer** | latar `navy-950`, teks `slate-300`; 4 kolom (brand+alamat+sosmed · Properti · Kota populer · Perusahaan/Bantuan); baris bawah hak cipta + "Masuk Agen" |

### 7.2 Dashboard

| Halaman | Isi |
|---|---|
| **Login** | Split: kiri panel gradien brand + logo putih + tagline + motif pita; kanan form (email, password dengan tombol tampilkan, tombol Masuk, catatan "Lupa password? Hubungi admin") |
| **Ringkasan** | 6 stat card (Total, Tayang, Draf, Terjual, Tersewa, Nonaktif) + admin: kartu agen aktif; tabel "Paling banyak dilihat" & "Baru diperbarui"; total dilihat & klik WA |
| **Properti** | toolbar (cari, filter popover, status tabs: Semua/Draf/Tayang/Terjual/Tersewa/Nonaktif), tombol Ekspor Excel (admin) & Tambah; tabel |
| **Form Properti** | lihat §6.8 |
| **Agen** | tabel (avatar, kode, nama, email, WA, status, jumlah listing tayang/total, bergabung); halaman tambah agen (kartu Akun + kartu Profil Agen + foto); detail dengan tab Profil / Listing |
| **Pengguna** | tabel dengan filter peran & status; aksi: edit, reset password (dialog), aktif/nonaktif (dialog) |
| **Akun Saya** | kartu Profil (avatar uploader, nama, telepon, + WA/bio/area untuk agen) dan kartu Ganti Password |

---

## 8. Konten & Nada

- Bahasa Indonesia baku yang hangat, sapaan **"Anda"**. Kalimat pendek dan jelas. Bahasa Inggris untuk `/en` dengan gaya serupa.
- Contoh headline hero: **"Temukan Properti Impian Anda Bersama MasterPro"** — subjudul: *"Ribuan pilihan rumah, apartemen, ruko, kos, dan tanah — dijual maupun disewa — didampingi agen profesional."*
- Tombol berupa kata kerja: *Cari Properti*, *Hubungi Agen*, *Lihat Semua*, *Tayangkan*, *Simpan Draf*.
- Angka: `Rp 1,25 M`, `Rp 850 jt`, `Rp 7,5 jt/bulan`, `120 m²`.

## 9. Aksesibilitas

Kontras AA untuk semua teks; target sentuh ≥ 44 px; fokus terlihat; carousel punya tombol & bisa keyboard; lightbox menjebak fokus dan tutup dengan `Esc`; `alt` foto = "{judul} — foto {n}"; status tidak hanya dibedakan warna (selalu ada label teks).

---

## 10. Prompt untuk AI Design Generator (Google Stitch)

### Cara pakai

1. Buat proyek **Web** di Stitch, unggah **logo MasterPro** sebagai gambar referensi.
2. Kirim **Prompt 0 (Konteks Master)** terlebih dahulu, lalu generate layar satu per satu dengan prompt berikutnya **di proyek yang sama** agar tema konsisten.
3. Untuk versi mobile, buat proyek **Mobile** terpisah, kirim Prompt 0 lagi, lalu prompt bertanda *Mobile*.
4. Prompt ditulis dalam bahasa Inggris (hasil generator lebih konsisten), sedangkan **semua teks UI berbahasa Indonesia**.
5. Iterasi kecil per layar ("make the hero search box wider", "use navy footer") lebih efektif daripada mengulang prompt penuh.
6. Hasil Stitch adalah eksplorasi visual; implementasi tetap mengikuti token di dokumen ini.

### Prompt 0 — Konteks Master

```text
You are designing "MasterPro Real Estate", an Indonesian property company that manages a network of property agents. It sells primary (new) and secondary (resale) properties — houses (Rumah), apartment units (Apartemen), shophouses (Ruko), boarding-house buildings (Kos), and land (Tanah) — and rents out houses, shophouses and apartment units. There are two products: (1) a public, SEO-focused property catalog website (bilingual, Indonesian default) similar in quality to rumah123.com, 99.co/id, pinhome.id and brighton.co.id but cleaner and more premium; (2) an internal dashboard for Admin and Agent roles to manage listings.

BRAND (derived from the attached logo: a blue ribbon forming a location pin with a white house inside; wordmark "MASTER" in navy + "PRO" in bright blue, "REAL ESTATE" spaced below):
- Personality: trustworthy, professional, modern, responsive, friendly. Photography of properties is the hero; UI stays calm and spacious.
- Colors: Navy #0D2B6B (headings, brand text, "For sale" badge), Deep navy #0A1F4D (dashboard sidebar), Darkest navy #071737 (footer), Primary blue #0B6BEA (primary buttons, links, focus), Hover blue #0957C3, Bright blue #1E88F5 (icons/large accents only), Sky #5ECFFF (decorative ribbon), Light blue tint #EEF5FF (alternating section backgrounds), Neutral slate scale (#0F172A text, #64748B muted, #E2E8F0 borders, #F8FAFC dashboard background), white surfaces. Signature gradient (decorative only): 135deg from #5ECFFF to #1E88F5 to #0B6BEA to #0D2B6B. WhatsApp buttons use #25D366 with dark green text. Sparing amber #FBBF24 for "Populer" badges. Never use the old bright green template look.
- Typography: Plus Jakarta Sans (bold/extra-bold) for headings, prices and buttons; Inter for body, forms and tables. Prices are large, extra-bold, navy, tabular numbers.
- Shape: rounded corners (12px inputs/buttons, 16px cards, 24px hero search box and banners), pill chips, soft navy-tinted shadows, 1px light borders.
- Motif: soft curved ribbon shapes in the brand gradient (from the logo) used at the edge of hero and CTA banners; location-pin icons for places. Icons in a clean line style (Lucide).
- Layout: max content width 1280px, generous whitespace, 8px grid, clear hierarchy, accessible contrast (WCAG AA), 44px touch targets.
- Language: all UI copy in Indonesian, polite "Anda" tone. Currency in Indonesian format: "Rp 1,25 M", "Rp 850 jt", "Rp 7,5 jt/bulan", areas in "m²".
- Property card anatomy: 4:3 photo with badges ("Dijual" navy / "Disewa" teal, "Primary" amber outline / "Secondary" gray) top-left, photo count top-right, property-type pill bottom-left; below: price (extra-bold navy), title (2 lines max), location with pin icon, divider, icon row for bedrooms (KT), bathrooms (KM), land area (LT) and building area (LB).
Use realistic Indonesian content (cities like Batam, Jakarta Selatan, Tangerang Selatan, Bandung, Surabaya; districts; real-looking prices).
```

### Prompt 1 — Beranda (Desktop)

```text
Design the public HOME page (desktop, 1440px) for MasterPro Real Estate using the brand system above.
1) Sticky white header 72px: MasterPro logo left; nav center: "Beli", "Sewa", "Properti", "Daftar Agen"; right: language pill switch "ID | EN" and primary button "Hubungi Kami".
2) Hero: bright daytime photo of a modern Indonesian house, with a large curved brand-gradient ribbon shape sweeping from the right edge. Headline "Temukan Properti Impian Anda Bersama MasterPro", subheadline "Rumah, apartemen, ruko, kos, dan tanah — dijual maupun disewa — didampingi agen profesional." A floating white search card (24px radius, soft shadow) with pill tabs "Beli / Sewa", fields "Kata kunci" (search icon), "Tipe properti" (select), "Lokasi" (combobox with pin icon, e.g. "Kota Batam"), and a wide primary button "Cari Properti". Under the card, category chips with icons: Rumah, Apartemen, Ruko, Kos, Tanah.
3) Section "Properti Dijual Terbaru" with "Lihat semua →" link and a horizontal carousel of 4 visible property cards with arrow buttons.
4) Section "Properti Disewa Terbaru" on a light blue (#EEF5FF) background, same carousel style, prices with "/bulan" or "/tahun".
5) Partner section "Bermitra dengan Bank Terpercaya": infinite logo marquee with grayscale bank logos (BCA, BTN, OCBC, Permata, Panin Bank), white fade on both edges.
6) CTA banner (24px radius, brand gradient, ribbon curves, small house-pin illustration): title "Lihat Properti yang Sedang Populer", subtitle about the most viewed listings this week, white button "Lihat Properti Populer".
7) Footer on darkest navy: logo (white), short tagline, office address, phone, email, social icons; columns "Properti" (Dijual, Disewa, Rumah, Apartemen, Ruko, Kos, Tanah), "Kota Populer", "Perusahaan" (Daftar Agen, Hubungi Kami); bottom bar "© 2026 MasterPro Real Estate" and small link "Masuk Agen".
```

### Prompt 2 — Katalog Properti (Desktop)

```text
Design the PROPERTY CATALOG / SEARCH RESULTS page (desktop) for MasterPro.
Same header and footer as Home. Page title "Properti Dijual di Kota Batam" with breadcrumb. A compact horizontal search bar (keyword, Beli/Sewa toggle, type, location, "Cari") that is sticky under the header.
Below: results row with "128 properti ditemukan", removable active filter chips (e.g. "Rumah ×", "Kota Batam ×", "Rp 500 jt – 2 M ×"), and a sort dropdown "Urutkan: Terbaru" (options Harga terendah, Harga tertinggi, Terpopuler, Luas tanah terbesar).
Left sidebar (280px) "Filter" in a white card with sections: Tipe listing (Dijual/Disewa segmented), Pasar (Primary/Secondary), Tipe properti (checkboxes with counts), Lokasi (province + city combobox), Harga (min–max inputs + range slider), Luas tanah & Luas bangunan (min–max), Kamar tidur & Kamar mandi (pill buttons 1+ 2+ 3+ 4+), Sertifikat (SHM, HGB, Strata, Lainnya), Furnishing; buttons "Terapkan" and "Reset".
Right: 3-column grid of 12 property cards (mix of Rumah, Ruko, Apartemen, Tanah with appropriate specs; one card with amber "Populer" badge), numbered pagination at the bottom. Include an empty-state variant idea in a small frame: illustration of a magnifier over a house pin, text "Belum ada properti yang cocok", button "Reset filter".
```

### Prompt 3 — Detail Properti (Desktop)

```text
Design the PROPERTY DETAIL page (desktop) for MasterPro.
Header as Home. Breadcrumb "Beranda › Properti › Rumah › Rumah Minimalis 2 Lantai di Batam Centre".
Gallery grid: one large 16:10 photo on the left, a 2×2 grid of smaller photos on the right, the last tile with dark overlay "+8 foto" and a button "Lihat semua foto".
Two-column layout below:
LEFT (2/3): badges "Dijual", "Secondary", "Rumah"; title (H1) "Rumah Minimalis 2 Lantai di Batam Centre"; location with pin "Batam Kota, Kota Batam, Kepulauan Riau"; listing code "Kode: MP-000123" and "Tayang 20 Okt 2026". Spec chips with icons: 3 KT, 2 KM, LT 120 m², LB 140 m², SHM, 2.200 VA. Section "Deskripsi" with 3 paragraphs and "Baca selengkapnya". Section "Spesifikasi" as a two-column label–value zebra table (Sertifikat, Daya listrik, Jumlah lantai, Carport, Furnishing, Hadap, Tahun dibangun, Sumber air). Section "Fasilitas" icon grid (Carport, Taman, Keamanan 24 Jam, CCTV, One Gate System, Dekat Sekolah). Section "Lokasi" with a static map card and link "Lihat di Google Maps". Section "Simulasi KPR" in a light-blue card: inputs Harga properti (prefilled Rp 1.250.000.000), Uang muka 20% (slider), Tenor 15 tahun (slider), Bunga 7,5% per tahun; result "Estimasi cicilan per bulan Rp 9.270.000" large in primary blue, with breakdown (Jumlah pinjaman, Total pembayaran, Penghasilan minimum) and small disclaimer.
RIGHT (1/3, sticky): agent card — price "Rp 1,25 M" large navy with "Bisa nego" tag, agent avatar, name "Budi Santoso", "Agen MasterPro · AG-0007", full-width green WhatsApp button "Hubungi via WhatsApp", secondary button "Bagikan", small note "Biasanya membalas dalam hitungan menit".
Then section "Properti Serupa" carousel of 4 cards, then a CTA banner "Ingin menjual atau menyewakan properti Anda? Hubungi MasterPro", then footer.
```

### Prompt 4 — Daftar Agen (Desktop)

```text
Design the "DAFTAR AGEN" (Join as an Agent) page (desktop) for MasterPro.
Header as Home. Hero split: left headline "Bergabung Menjadi Agen Properti MasterPro", subheadline about earning attractive commissions with company support, green WhatsApp button "Daftar via WhatsApp" and secondary "Lihat Struktur Komisi"; right a friendly flat-isometric illustration of an agent with a house and location pin in brand blues, with ribbon gradient curve.
Section "Keuntungan Bergabung": 6 icon cards (Komisi kompetitif, Listing properti siap jual, Pendampingan manager, Training rutin, Dashboard listing pribadi, Kantor & branding MasterPro).
Section "Struktur Komisi": two tables side by side — "Komisi Penjualan" (Di bawah Rp 1 miliar 3%, Rp 1–3 miliar 2,5%, Di atas Rp 3 miliar 2%) and "Komisi Penyewaan" (Di bawah Rp 25 juta 10%, > Rp 25–50 juta 7,5%, Di atas Rp 50 juta 5%) with navy headers and large blue percentages; below, "Pembagian Komisi" as 5 small cards with horizontal proportion bars: Agen Selling 40%, Agen Listing 30%, Manager 5%, Master Cool 5%, MasterPro 20%, each with a one-line role description.
Section "Alur Pendaftaran" as a visual flowchart of 6 numbered steps connected by a curved dashed ribbon line: 1 Hubungi Admin, 2 Kirim Data Diri & Dokumen, 3 Interview & Orientasi, 4 Training Produk & Sistem, 5 Akun Dashboard Dibuat, 6 Mulai Listing & Raih Komisi — each with icon and one short sentence.
Section "Pertanyaan Umum" accordion (4 questions).
Section "Hubungi Kami": cards for WhatsApp Admin, Telepon, Email, Alamat Kantor (with small static map) and social media icons.
Footer as Home.
```

### Prompt 5 — Mobile Website (Beranda, Katalog, Detail)

```text
Create MOBILE (390px) versions of three MasterPro public screens using the same brand system.
(a) Home: compact header with logo and hamburger; hero with photo and gradient ribbon, headline, stacked search card (Beli/Sewa tabs, keyword, type, location, full-width "Cari Properti"), horizontally scrollable category chips; carousels show 1.2 cards to hint swipe; partner marquee; CTA banner; footer stacked.
(b) Catalog: sticky search bar, a row with "Filter (3)" button and "Urutkan" button; single-column property cards; show the filter as an opened bottom sheet in a second frame with the same filter sections and sticky "Tampilkan 128 properti" button.
(c) Detail: full-width swipeable photo carousel with "1/12" indicator and back/share buttons over the photo; title, badges, location, spec chips; collapsible sections (Deskripsi, Spesifikasi, Fasilitas, Simulasi KPR); a sticky bottom bar with price on the left and a green WhatsApp button "Hubungi Agen" on the right.
```

### Prompt 6 — Dashboard: Login

```text
Design the DASHBOARD LOGIN screen (desktop) for "Dashboard MasterPro". Split layout: left 50% panel filled with the brand gradient and soft ribbon curves, white MasterPro logo, headline "Kelola listing properti Anda dengan mudah", and 3 short bullet benefits; right 50% white with a centered form card: title "Masuk ke Dashboard", fields Email and Password (with show/hide eye icon), primary button "Masuk" full width, helper text "Lupa password? Hubungi admin MasterPro.", and an inline error example "Email atau password salah". Clean, professional, Indonesian copy.
```

### Prompt 7 — Dashboard: Shell & Ringkasan

```text
Design the DASHBOARD OVERVIEW ("Ringkasan") for an Admin user in MasterPro (desktop 1440px, background #F8FAFC).
Left sidebar 264px in deep navy #0A1F4D: white logo; menu with Lucide icons — Ringkasan (active: lighter navy background with a sky-blue left bar), Properti, Agen, Pengguna, Akun Saya; bottom: small profile card (avatar, "Siti Admin", role "Admin") and "Keluar".
Top bar white 64px: page title "Ringkasan", right side primary button "+ Tambah Properti" and avatar menu.
Content: greeting "Selamat datang, Siti"; a row of 6 stat cards (Total Listing 124, Tayang 88, Draf 6, Terjual 17, Tersewa 5, Nonaktif 8) each with an icon in a light-blue circle; a row with two small cards "Agen aktif 21 / 23" and "Total dilihat 15.320 · Klik WhatsApp 812"; two tables side by side: "Paling Banyak Dilihat" (thumbnail, code, title, views, WA clicks) and "Baru Diperbarui" (thumbnail, title, status badge, time ago). Status badges: Draf amber, Tayang green, Terjual indigo, Tersewa cyan, Nonaktif gray — always with text labels.
```

### Prompt 8 — Dashboard: Daftar Properti

```text
Design the "Properti" LIST page of the MasterPro dashboard (Admin view), reusing the sidebar and top bar.
Top bar title "Properti" with buttons "Ekspor Excel" (secondary, with spreadsheet icon) and "+ Tambah Properti" (primary).
Status tabs with counts: Semua 124 · Draf 6 · Tayang 88 · Terjual 17 · Tersewa 5 · Nonaktif 8.
Toolbar: search input "Cari judul, kode, alamat…", filter buttons (Jual/Sewa, Tipe, Kota, Agen, Harga, Tanggal dibuat) and an active filter chip.
Data table (white card): columns — checkbox-free; Foto (48×36 thumbnail), Kode (MP-000123), Judul (2 lines) with type & location under it in muted text, Jual/Sewa badge, Harga, Agen (avatar + name), Status badge, Dilihat, Klik WA, Diperbarui, and an actions column (eye "Lihat di website", pencil "Edit", ⋯ menu with "Ubah status", "Hapus" in red). 10 realistic rows, row hover in light blue, pagination "1–20 dari 124" with page buttons.
Also show, in a second frame, the "Ubah Status" dialog with radio options (Tayang, Terjual, Nonaktif) and a confirmation button, and the delete dialog asking to type the listing code to confirm.
```

### Prompt 9 — Dashboard: Form Tambah/Edit Properti

```text
Design the "Tambah Properti" FORM page of the MasterPro dashboard.
Two-column layout. LEFT (2/3) — stacked white section cards with numbered headers:
1 "Informasi Dasar": segmented control Dijual/Disewa, segmented Primary/Secondary, property-type selector as 5 icon tiles (Rumah, Apartemen, Ruko, Kos, Tanah), Judul (with character counter 0/160), Deskripsi (textarea with counter).
2 "Harga": price input with "Rp" prefix and live formatted helper "Rp 1,25 miliar", rent period select (shown when Disewa), checkbox "Harga bisa nego".
3 "Lokasi": Provinsi, Kota/Kabupaten, Kecamatan, Alamat lengkap, optional Latitude/Longitude with a "Pilih di peta" hint.
4 "Spesifikasi": fields that adapt to the selected type (for Rumah: Luas tanah m², Luas bangunan m², Kamar tidur, Kamar mandi, Kamar pembantu, Jumlah lantai, Carport, Garasi, Daya listrik VA, Sumber air, Sertifikat select, Furnishing, Hadap, Tahun dibangun), using number steppers where appropriate.
5 "Fasilitas": checkbox chips with icons.
6 "Foto": large dashed dropzone "Seret & lepas foto di sini atau pilih file (JPG, PNG, WebP, maks 10 MB, hingga 20 foto)", below a grid of uploaded thumbnails with drag handles, a "Cover" badge on the first, upload progress on one, and a delete icon.
7 "Video (opsional)": YouTube URL.
RIGHT (1/3, sticky panel): card "Status: Draf"; agent selector (Admin only) "Agen: Budi Santoso (AG-0007)"; a completeness checklist ("Foto minimal 1", "Sertifikat", "Luas tanah"… with check/empty states); buttons "Simpan Draf" (secondary) and "Tayangkan" (primary). Show an inline validation error example on one field.
```

### Prompt 10 — Dashboard: Agen & Pengguna

```text
Design two MasterPro dashboard pages, reusing the sidebar and top bar.
(A) "Agen" list: top bar button "+ Tambah Agen"; search and status filter; table with Foto, Kode Agen, Nama, Email, WhatsApp, Status akun (Aktif/Nonaktif), Listing (e.g. "9 tayang / 14 total"), Bergabung, actions. Plus a second frame "Tambah Agen" form: card "Akun" (Nama lengkap, Email, Telepon, Password awal with generate button) and card "Profil Agen" (Nomor WhatsApp with +62 prefix, Area layanan, Tanggal bergabung, Bio) and an avatar uploader; buttons Batal / Simpan Agen. Plus a third frame "Detail Agen" with profile header (avatar, name, code, WhatsApp, status toggle, "Reset password") and tabs "Profil" and "Listing" (embedded property table).
(B) "Pengguna" (account management): tabs or filter for Peran (Semua, Admin, Agen) and Status; table with Nama, Email, Peran badge, Status, Login terakhir, Dibuat, actions (Edit, Reset password, Nonaktifkan). Show the "Reset Password" dialog (new password + confirm, warning that all sessions will be signed out).
```

### Prompt 11 — Dashboard: Akun Saya

```text
Design the "Akun Saya" (My Account) page for an Agent user in the MasterPro dashboard (sidebar shows only Ringkasan, Properti, Akun Saya). Two stacked cards: "Profil" — avatar with change/remove buttons, Nama, Email (read-only with note "Hubungi admin untuk mengubah email"), Telepon, Nomor WhatsApp, Area layanan, Bio, button "Simpan Perubahan"; "Ganti Password" — Password saat ini, Password baru (with strength hint: min 8 characters, letters and numbers), Konfirmasi password baru, button "Perbarui Password". Show a success toast "Profil berhasil diperbarui" at top-right.
```

---

## 11. Token CSS (Tailwind v4)

Isi awal `frontend/src/styles/globals.css`:

```css
@import "tailwindcss";

@theme {
  --font-sans: var(--font-inter), ui-sans-serif, system-ui, sans-serif;
  --font-display: var(--font-jakarta), var(--font-inter), ui-sans-serif, sans-serif;
  --font-accent: var(--font-playfair), Georgia, serif;

  --color-navy-950: #071737;
  --color-navy-900: #0a1f4d;
  --color-navy-800: #0d2b6b;
  --color-navy-700: #163a85;
  --color-blue-700: #0957c3;
  --color-blue-600: #0b6bea;
  --color-blue-500: #1e88f5;
  --color-blue-100: #dcebff;
  --color-blue-50: #eef5ff;
  --color-sky-400: #3fc1f5;
  --color-sky-300: #5ecfff;

  --color-primary: var(--color-blue-600);
  --color-primary-hover: var(--color-blue-700);
  --color-brand: var(--color-navy-800);
  --color-surface: #ffffff;
  --color-page: #ffffff;
  --color-page-muted: var(--color-blue-50);
  --color-success: #16a34a;
  --color-warning: #d97706;
  --color-danger: #dc2626;
  --color-whatsapp: #25d366;
  --color-whatsapp-hover: #1ebe5a;
  --color-whatsapp-foreground: #063b1d;
  --color-rent: #0e7490;

  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 24px;

  --shadow-card: 0 1px 2px rgb(13 43 107 / 0.06), 0 4px 12px rgb(13 43 107 / 0.06);
  --shadow-card-hover: 0 8px 24px rgb(13 43 107 / 0.12);
  --shadow-popover: 0 12px 32px rgb(13 43 107 / 0.16);

  --gradient-brand: linear-gradient(135deg, #5ecfff 0%, #1e88f5 45%, #0b6bea 70%, #0d2b6b 100%);
}
```

Variabel shadcn/ui (`--primary`, `--ring`, `--radius`, dst.) dipetakan ke token di atas di file yang sama.
