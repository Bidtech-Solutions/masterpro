# PRD MasterPro — Program Agen, Jaringan Leader & Komisi

|                     |                                                                                          |
| ------------------- | ---------------------------------------------------------------------------------------- |
| **Produk**          | MasterPro — Program agen, jaringan leader–member, dan mesin komisi                       |
| **Pelaksana**       | Tim Bidtech                                                                              |
| **Tanggal**         | 20 November 2026                                                                         |
| **Dokumen terkait** | [`PRD.md`](./PRD.md) (v1.0) · [`API.md`](./API.md) · [`DESIGN.md`](./DESIGN.md) · [`../AGENTS.md`](../AGENTS.md) |

> **Status dokumen: DRAFT — BELUM DIIMPLEMENTASI.** Dokumen ini adalah PRD tambahan (sprint berikutnya) di atas [`PRD.md`](./PRD.md) v1.0. Belum ada kode, migrasi, atau kontrak API yang dibuat dari dokumen ini.
>
> **Perbedaan dengan PRD v1.0 yang harus diselesaikan sebelum implementasi** (agen AI: jangan memilih sendiri — berhenti dan tanyakan kepada pengguna, lihat `AGENTS.md` §1):
>
> | Topik | PRD v1.0 | Dokumen ini |
> | --- | --- | --- |
> | Struktur repo | `frontend/` + `backend/` (PRD §12, folder level atas baku) | Tiga aplikasi: `masterpro-web`, `masterpro-dashboard`, `masterpro-backend` |
> | Lokasi dashboard | `masterpro.co.id/dashboard` | Subdomain `agen.masterpro.co.id` (redirect 301 dari URL lama) |
> | Skema komisi | PRD §7.8: komisi bertingkat (3% / 2,5% / 2%), pembagian 40/30/5/5/20 | Komisi kotor 3% flat, dibagi per sisi (listing 25% / closing 75%), agen 80%, management fee 20% |
> | Halaman Daftar Agen | PRD §5.5: disembunyikan di `masterpro.co.id` | Landing page program agen di `agen.masterpro.co.id` |
> | Penghapusan data kontak | — | API publik tidak boleh mengirim kontak pemilik (`owner_name`, `owner_phone`) sama sekali |
> | Nama workflow | `.github/workflows/masterpro.yml` | Ditulis `masterpro.yml` (nama file sama) |
>
> Mengubah dokumen berstatus **[KETETAPAN]** di `PRD.md` mengikuti prosedur docs-first (PR yang mengubah dokumen lebih dulu).

---

## Ringkasan & ruang lingkup

Sprint berikutnya menerapkan model bisnis agen MasterPro: rekrutmen agen freelance lewat `agen.masterpro.co.id`, jaringan leader–member satu tingkat, serta perhitungan komisi, referral, dan sharing profit otomatis di dashboard.

Yang sudah ada (v1): katalog publik (beranda, daftar properti, detail properti), dashboard dengan login/logout admin dan agen, pengelolaan properti oleh agen dan admin, pengelolaan akun oleh admin, serta pengaturan akun.

Yang ditambahkan di sprint ini:

- Pemisahan repo menjadi web, dashboard, dan backend, dengan dashboard pindah ke subdomain `agen.masterpro.co.id`.
- Landing page program agen dengan CTA pendaftaran via WhatsApp.
- Struktur leader–member yang diatur admin (sponsoring dan distribusi).
- Penandaan properti terjual dan mesin komisi per sisi transaksi.
- Sharing profit untuk leader dengan batas penarikan Rp100 jt omset.
- Pencatatan pembayaran komisi dan invoice otomatis di dashboard.

Proses di luar sistem (tetap manual): pendaftaran agen via WhatsApp, laporan penjualan agen ke admin via WhatsApp, dan pengajuan penarikan komisi ke admin.

## Struktur proyek & domain

Repo dipecah menjadi tiga aplikasi dalam satu monorepo dengan satu workflow CI/CD.

```
.
├── .github/workflows/masterpro.yml
├── masterpro-web
├── masterpro-dashboard
└── masterpro-backend
```

| Aplikasi | Domain | Pengguna | Isi |
| --- | --- | --- | --- |
| masterpro-web | masterpro.co.id | Calon pembeli (publik) | Katalog properti, detail properti |
| masterpro-dashboard | agen.masterpro.co.id | Calon agen, agen, admin | Landing page program agen + dashboard admin/agen |
| masterpro-backend | (API) | Web dan dashboard | Go (Gin, GORM), PostgreSQL, mesin komisi |

Catatan teknis:

- `masterpro.yml` membangun tiga image ke GHCR dan men-deploy ke VPS lewat Traefik yang sudah ada; tambahkan router untuk `agen.masterpro.co.id`.
- Dashboard pindah dari `masterpro.co.id/dashboard` ke subdomain: sesuaikan domain cookie/JWT, CORS, dan redirect dari URL lama.
- API publik untuk masterpro-web tidak boleh mengirim data kontak pemilik properti sama sekali (lihat bagian Listing).

## Landing page agen.masterpro.co.id

Halaman depan `agen.masterpro.co.id` mempromosikan program agen dan mengarahkan calon agen mendaftar lewat WhatsApp admin.

Konten wajib:

1. **Program agen MasterPro**: agen freelance bernaung di bawah lisensi MasterPro; agen berkinerja baik dapat dipromosikan menjadi in-house.
2. **Skema komisi**: komisi kotor 3% dari harga jual; agen mendapat 80% dari sisinya (listing 20% + closing 60% dari komisi kotor, atau 80% bila listing dan closing sendiri). Tampilkan contoh angka rumah Rp1 M.
3. **Jaringan leader**: komisi referral (5% dari komisi kotor sisi member) dan sharing profit (1% dari akumulasi omset member, cair mulai Rp100 jt omset).
4. **Fasilitas dari management fee**: notaris (akad/balik nama), perbankan untuk KPR, proses jual beli, lisensi, training, koneksi ke developer dan bank.
5. **CTA Daftar** yang membuka WhatsApp admin dengan template pesan.

Template pesan WhatsApp (usulan):

> Halo Admin MasterPro, saya ingin mendaftar menjadi agen. Nama: … Domisili: … Sponsor (jika ada): …

Kolom sponsor di template membantu admin langsung tahu jalur sponsoring atau distribusi.

Sprint B: simulator komisi interaktif (input harga properti → rincian komisi agen dan leader) yang memakai rumus yang sama dengan backend.

## Pendaftaran agen & struktur leader–member

Setiap agen adalah member dari tepat satu leader; leader generasi pertama dianggap member dari perusahaan.

Alur pendaftaran:

1. Calon agen menghubungi admin lewat WhatsApp dari landing page.
2. Admin bertanya "Apakah kamu ada sponsor?"
3. Admin membuat akun agen di dashboard dan memilih leader-nya:
   - **Sponsoring**: leader = agen sponsor yang disebut calon agen.
   - **Distribusi**: tanpa sponsor, admin memilih leader berdasarkan keputusan bisnis.
   - **Generasi pertama**: admin menetapkan agen tanpa leader (leader = perusahaan).
4. Admin mengirim kredensial akun ke agen lewat WhatsApp.

Aturan:

- "Leader" bukan role terpisah: setiap agen yang punya member adalah leader.
- Perhitungan hanya satu layer: leader hanya menerima dari member langsungnya, bukan dari member milik member-nya.
- Leader tidak bisa dipindah, kecuali agen tersebut belum punya transaksi apa pun (kasus salah input).
- Setiap pemilihan dan pemindahan leader wajib lewat dialog konfirmasi admin yang menampilkan nama agen dan nama leader tujuan.
- Setiap penetapan dan koreksi leader dicatat di log (siapa, kapan, dari siapa ke siapa).
- Fitur kode redeem dari briefing awal **dihapus**; penempatan member sepenuhnya oleh admin.

## Skema komisi

Komisi kotor = 3% × harga jual properti di listing, lalu dibagi per sisi: listing 25% dan closing 75%, masing-masing dihitung sendiri.

> *[Konten sematan pada PRD asli: diagram pembagian komisi kotor per sisi, rumah Rp1 M. Tidak ikut tersalin; angkanya ada pada tabel di bawah.]*

Bila agen sisi itu generasi pertama, atau sisi dikerjakan admin, porsi kotak berwarna (di diagram) masuk ke perusahaan.

Aturan per sisi:

1. Sisi dikerjakan **admin/perusahaan** → seluruh porsi sisi itu masuk perusahaan.
2. Sisi dikerjakan **agen** → 80% untuk agen; 20% menjadi management fee yang dibagi:
   - 71% pendapatan bersih perusahaan;
   - 25% komisi referral untuk leader agen sisi itu;
   - 4% sharing profit untuk leader agen sisi itu (masuk saldo, lihat bagian Sharing profit).
3. Agen sisi itu **generasi pertama** → referral dan sharing profit masuk perusahaan.
4. Agen listing sudah **keluar** saat properti terjual → sisi listing diperlakukan seperti sisi perusahaan.

Karena dihitung per sisi, leader yang bertransaksi bersama member-nya tidak butuh aturan khusus: referral dan sharing dari sisi leader naik ke leader di atasnya (atau perusahaan), sisi member masuk ke leader-nya.

### Rincian per sisi (rumah Rp1 M, komisi kotor Rp30 jt)

| Komponen | Sisi closing (Rp22,5 jt) | Sisi listing (Rp7,5 jt) | Total | % komisi kotor |
| --- | --- | --- | --- | --- |
| Agen (80%) | Rp18.000.000 | Rp6.000.000 | Rp24.000.000 | 80% |
| Pendapatan bersih perusahaan (71% fee) | Rp3.195.000 | Rp1.065.000 | Rp4.260.000 | 14,2% |
| Referral leader (25% fee) | Rp1.125.000 | Rp375.000 | Rp1.500.000 | 5% |
| Sharing profit leader (4% fee) | Rp180.000 | Rp60.000 | Rp240.000 | 0,8% |

### Kasus transaksi (rumah Rp1 M)

| Kasus | Agen listing | Agen closing | Leader listing | Leader closing | Perusahaan |
| --- | --- | --- | --- | --- | --- |
| Agen sama (punya leader) | Rp24 jt (gabungan) | — | Rp1,5 jt + sharing Rp240 rb (satu leader) | — | Rp4,26 jt |
| Agen berbeda, leader berbeda | Rp6 jt | Rp18 jt | Rp375 rb + sharing Rp60 rb | Rp1,125 jt + sharing Rp180 rb | Rp4,26 jt |
| Admin listing, agen closing | — | Rp18 jt | — | Rp1,125 jt + sharing Rp180 rb | Rp10,695 jt |
| Agen listing, admin closing | Rp6 jt | — | Rp375 rb + sharing Rp60 rb | — | Rp23,565 jt |
| Admin listing & closing | — | — | — | — | Rp30 jt |
| Agen generasi pertama, listing & closing | Rp24 jt (gabungan) | — | — | — | Rp6 jt |

Setiap baris berjumlah Rp30 jt.

Aturan implementasi:

- Simpan snapshot harga, persentase, dan leader setiap sisi di transaksi, agar perubahan kebijakan atau status agen tidak mengubah riwayat.
- Hitung dalam rupiah bulat; referral dan sharing dihitung dulu, pendapatan bersih perusahaan = sisa, agar tidak ada selisih pembulatan.
- Properti sewa tidak menghasilkan komisi.

## Sharing profit

Leader mendapat 1% dari akumulasi omset member langsungnya, dan baru bisa menarik saat akumulasi itu ≥ Rp100 jt (setara saldo Rp1 jt).

- **Omset agen** = bagian 80% yang diterima agen dari sisinya (Rp18 jt untuk closing, Rp6 jt untuk listing pada rumah Rp1 M).
- **Akumulasi omset** leader = jumlah omset semua member langsung, tanpa batas periode dan tanpa reset. Omset leader sendiri tidak dihitung.
- **Saldo sharing profit** = 1% × akumulasi omset (sama dengan 4% dari management fee).
- **Syarat tarik**: akumulasi omset saat penarikan ≥ Rp100 jt.
- **Boleh sebagian**, maksimal sebesar saldo. Setelah ditarik: akumulasi omset baru = akumulasi lama − (jumlah tarikan ÷ 1%).
- Kalau akumulasi baru < Rp100 jt, penarikan terkunci sampai kembali ≥ Rp100 jt.

Contoh:

| Akumulasi omset | Ditarik | Akumulasi sesudah | Bisa tarik lagi? |
| --- | --- | --- | --- |
| Rp150 jt | Rp1 jt | Rp50 jt | Tidak, tunggu ≥ Rp100 jt |
| Rp300 jt | Rp1 jt | Rp200 jt | Ya |
| Rp150 jt | Rp1,5 jt | Rp0 | Tidak |

Saldo tetap tertahan selama leader masih berstatus agen, meski lama tidak ada transaksi. Saldo hanya dialihkan ke perusahaan bila leader keluar (lihat bagian berikut). Laporan admin perlu menampilkan total saldo sharing profit tertahan sebagai kewajiban perusahaan.

## Status agen & aturan agen keluar

Sistem membedakan agen yang sekadar tidak aktif dari agen yang resmi keluar, karena hanya status keluar yang mengalihkan saldo ke perusahaan.

| Status | Arti | Akibat ke komisi |
| --- | --- | --- |
| Aktif | Agen normal | Semua hak berjalan |
| Nonaktif | Dinonaktifkan sementara oleh admin | Tidak ada yang hangus; saldo tetap tertahan |
| Keluar | Resmi mengundurkan diri atau dikeluarkan (dicatat dengan tanggal keluar) | Lihat tabel di bawah |

Komisi listing dan closing adalah hasil kerja agen. Sebaliknya, komisi referral dan sharing profit adalah reward perusahaan bagi agen yang ikut skema jaringan. Karena itu agen yang keluar atau dikeluarkan kehilangan seluruh reward yang belum ditarik dan tidak menerima reward baru.

Saat agen berstatus keluar:

| Hak | Perlakuan |
| --- | --- |
| Komisi closing dari penjualan sebelum tanggal keluar | Tetap dicairkan |
| Komisi listing dari properti yang terjual sebelum tanggal keluar | Tetap dicairkan |
| Komisi listing dari properti yang terjual setelah tanggal keluar | Sisi listing masuk perusahaan |
| Komisi referral yang belum ditarik | Dialihkan ke perusahaan |
| Saldo sharing profit yang belum ditarik | Dialihkan ke perusahaan |
| Member-member agen tersebut | Leader-nya menjadi perusahaan (setara generasi pertama); referral dan sharing dari mereka selanjutnya masuk perusahaan |

Listing milik agen yang keluar tetap tayang dan diambil alih admin:

- Di masterpro.co.id, listing tampil atas nama admin/MasterPro.
- Di dashboard, listing diberi penanda "Takeover dari [nama agen] (keluar [tanggal])" agar riwayatnya jelas.
- Saat properti itu terjual, sisi listing dihitung sebagai sisi perusahaan.
- Data model: simpan `original_listing_agent_id` dan `taken_over_at`, sedangkan `listing_agent_id` menjadi null (admin).

Aksi "keluarkan agen" bersifat permanen, jadi admin wajib melewati dialog konfirmasi yang merangkum jumlah yang akan dialihkan ke perusahaan dan jumlah member yang terdampak.

## Listing, visibilitas & penjualan

Agen dapat melihat listing aktif agen lain lengkap dengan kontak pemiliknya, tetapi kontak pemilik tidak pernah sampai ke publik.

Status listing: aktif, disembunyikan/nonaktif, terjual (jual), tersewa (sewa).

| Aksi | Agen | Admin |
| --- | --- | --- |
| Tambah, edit, ubah status listing sendiri | Ya | Ya |
| Lihat listing aktif agen lain + info agen listing + kontak pemilik | Ya | Ya |
| Lihat listing nonaktif agen lain | Tidak | Ya |
| Lihat dan edit semua listing, filter per agen | Tidak | Ya |
| Tandai terjual dan menetapkan agen closing | Tidak | Ya |
| Melihat kontak pemilik di masterpro.co.id | Tidak berlaku (publik tidak pernah melihat) | Tidak berlaku |

Alur penjualan:

1. Agen melaporkan penjualan ke admin lewat WhatsApp (di luar sistem).
2. Admin membuka listing, memilih **Tandai terjual**, lalu memilih agen closing (atau "Perusahaan/Admin") dan tanggal terjual.
3. Sistem mengambil harga jual listing saat itu sebagai dasar komisi, menampilkan pratinjau pembagian komisi, lalu meminta konfirmasi.
4. Setelah dikonfirmasi, sistem mencatat transaksi dan entri komisi untuk setiap penerima.

Pada listing terjual, admin melihat agen listing, agen closing, harga, tanggal, dan rincian komisi.

## Penarikan & invoice

Semua jenis komisi ditarik lewat pengajuan manual ke admin; sistem mencatat pembayaran dan menerbitkan invoice yang muncul di dashboard agen.

1. Agen mengajukan penarikan ke admin di luar sistem (WhatsApp).
2. Admin membuka saldo agen di dashboard: komisi listing, closing, referral, dan sharing profit yang belum dibayar.
3. Admin memilih entri atau jumlah yang dibayar. Untuk sharing profit, sistem menolak bila akumulasi omset < Rp100 jt atau jumlah > saldo.
4. Admin mentransfer di luar sistem, lalu mencatat pembayaran (tanggal, metode, catatan).
5. Sistem menerbitkan invoice bernomor otomatis berisi rincian entri yang dibayar, dan invoice tampil di dashboard agen.

Format nomor invoice (sementara, sampai ada format resmi):

```
TANGGAL/URUT-HARIAN/URUT-KESELURUHAN/PERUNTUKAN/MASTERPRO
```

Contoh: `20261120/003/0127/CLOSING/MASTERPRO` = invoice ke-3 pada 20 November 2026, ke-127 sejak awal, untuk komisi closing.

- Tanggal ditulis YYYYMMDD agar nomor mudah diurutkan.
- Urut harian kembali ke 001 setiap hari; urut keseluruhan tidak pernah direset.
- Peruntukan: LISTING, CLOSING, REFERRAL, atau SHARING. Karena peruntukan ada di nomor, satu invoice hanya untuk satu jenis komisi; penarikan beberapa jenis sekaligus menerbitkan beberapa invoice.
- Nomor dibuat oleh backend dalam satu transaksi database agar tidak ada nomor ganda.

Dashboard agen menampilkan:

- Ringkasan saldo per jenis komisi (belum dibayar dan sudah dibayar).
- Log komisi per transaksi: properti, sisi, jenis (listing/closing/referral/sharing), jumlah, status.
- Untuk leader: daftar member, akumulasi omset member, saldo sharing profit, dan sisa menuju Rp100 jt.
- Daftar invoice yang bisa diunduh (PDF).

Dashboard admin menampilkan pendapatan bersih perusahaan, total komisi terutang ke agen, dan total saldo sharing profit tertahan.

## Model data (usulan)

Komisi disimpan sebagai ledger: setiap penjualan menghasilkan baris-baris entri yang tidak diubah, sehingga saldo dan laporan selalu bisa ditelusuri.

| Tabel | Kolom penting | Catatan |
| --- | --- | --- |
| `agents` | `user_id`, `leader_id` (null = perusahaan), `join_method` (sponsoring/distribusi/generasi_pertama), `status` (aktif/nonaktif/keluar), `exited_at` | Satu leader per agen |
| `leader_change_logs` | `agent_id`, `from_leader_id`, `to_leader_id`, `changed_by`, `changed_at`, `reason` | Untuk koreksi salah input |
| `properties` | `listing_agent_id` (null = admin), `offer_type` (jual/sewa), `price`, `owner_name`, `owner_phone`, `status` | `owner_*` tidak pernah ada di API publik |
| `sales` | `property_id`, `price_snapshot`, `gross_commission`, `listing_agent_id`, `closing_agent_id`, `listing_leader_id`, `closing_leader_id`, `rates_snapshot` (JSON), `sold_at`, `created_by` | Snapshot saat terjual |
| `commission_entries` | `sale_id`, `side` (listing/closing), `beneficiary_type` (agen/perusahaan), `agent_id`, `kind` (agent/referral/sharing/company_net/company_side), `amount`, `status` (unpaid/paid/forfeited), `payout_id` | Satu baris per penerima per sisi |
| `sharing_profit_ledger` | `leader_id`, `sale_id` atau `payout_id`, `omset_delta` (+ dari penjualan, − dari penarikan) | Akumulasi = SUM(`omset_delta`) |
| `payouts` | `agent_id`, `amount`, `paid_at`, `method`, `note`, `invoice_no`, `created_by` | Satu payout = satu invoice |

Unit test wajib untuk mesin komisi: keenam kasus di bagian Skema komisi, agen generasi pertama, agen listing yang sudah keluar, pembulatan, serta penarikan sharing profit sebagian dan penolakan di bawah Rp100 jt.

## User story per sprint

Pekerjaan dibagi dua sprint: Sprint A menyiapkan fondasi dan akuisisi agen, Sprint B membangun transaksi dan komisi.

### Sprint A: fondasi & akuisisi agen

| ID | User story | Kriteria penerimaan |
| --- | --- | --- |
| A1 | Sebagai tim dev, saya ingin repo dipecah menjadi web, dashboard, backend dengan satu workflow CI/CD | Tiga image ter-build di GHCR; deploy lewat Traefik; `agen.masterpro.co.id` aktif dengan HTTPS |
| A2 | Sebagai pengguna lama, saya ingin URL `/dashboard` lama dialihkan ke subdomain baru | Redirect 301; login dan logout berjalan di subdomain |
| A3 | Sebagai calon agen, saya ingin memahami program agen dan skema komisi | Landing page memuat lima konten wajib dan contoh angka Rp1 M |
| A4 | Sebagai calon agen, saya ingin mendaftar lewat WhatsApp | CTA membuka WhatsApp admin dengan template pesan terisi |
| A5 | Sebagai admin, saya ingin menambah agen dan memilih leader-nya | Pilihan sponsoring/distribusi/generasi pertama; dialog konfirmasi menampilkan agen dan leader tujuan |
| A6 | Sebagai admin, saya ingin mengoreksi leader yang salah input | Hanya bisa bila agen belum punya transaksi; konfirmasi wajib; tercatat di log |
| A7 | Sebagai admin, saya ingin menyalin pesan kredensial akun untuk dikirim via WhatsApp | Tombol salin teks berisi URL login, username, password sementara |
| A8 | Sebagai admin, saya ingin melihat struktur leader–member | Daftar agen dengan leader-nya; filter per leader; jumlah member |
| A9 | Sebagai agen, saya ingin melihat listing aktif agen lain beserta agen listing dan kontak pemilik | Listing nonaktif agen lain tidak tampil; API publik tidak memuat kontak pemilik |

### Sprint B: transaksi & komisi

| ID | User story | Kriteria penerimaan |
| --- | --- | --- |
| B1 | Sebagai admin, saya ingin menandai properti terjual dan menetapkan agen closing | Pratinjau komisi sebelum konfirmasi; snapshot harga, persen, leader tersimpan |
| B2 | Sebagai tim dev, saya ingin mesin komisi per sisi yang teruji | Semua unit test di bagian Model data lulus; total entri = komisi kotor |
| B3 | Sebagai agen, saya ingin melihat ringkasan dan log komisi saya | Per jenis komisi, status dibayar/belum, per transaksi |
| B4 | Sebagai leader, saya ingin memantau member dan sharing profit saya | Akumulasi omset, saldo, sisa menuju Rp100 jt |
| B5 | Sebagai admin, saya ingin mencatat pembayaran komisi | Validasi syarat sharing profit; akumulasi omset berkurang sesuai rumus |
| B6 | Sebagai agen, saya ingin menerima invoice otomatis | Invoice bernomor tampil di dashboard dan bisa diunduh PDF |
| B7 | Sebagai admin, saya ingin mengeluarkan agen secara resmi | Dialog merangkum dana yang dialihkan; member pindah ke perusahaan; aturan tabel status keluar berlaku |
| B8 | Sebagai admin, saya ingin laporan komisi perusahaan | Pendapatan bersih, komisi terutang, saldo sharing tertahan, filter periode |
| B9 | Sebagai pengunjung, saya ingin landing page memuat simulator komisi | Hasil simulator sama dengan perhitungan backend |

## Ditunda & pertanyaan terbuka

Ditunda (bukan bagian sprint ini):

- Pajak penghasilan agen pada invoice.
- Konfirmasi legal atas skema jaringan agen.
- Komisi properti sewa.
- Pendaftaran agen, laporan penjualan, dan pengajuan penarikan di dalam aplikasi (tetap lewat WhatsApp).
- Input harga deal terpisah dari harga listing.
- Pemindahan leader untuk agen yang sudah punya transaksi.

Pertanyaan (sudah diputuskan):

- [ ] Listing milik agen yang keluar: tetap tayang dan dikelola admin, atau otomatis dinonaktifkan? Diputuskan: tetap tayang atas nama admin dengan penanda takeover (lihat bagian Status agen).
- [ ] Format nomor invoice dan identitas perusahaan yang tercetak di invoice. Diputuskan sementara: lihat format nomor di bagian Penarikan & invoice.
