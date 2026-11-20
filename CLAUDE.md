# CLAUDE.md

Instruksi untuk Claude Code di repositori MasterPro. Semua aturan proyek ada di AGENTS.md dan wajib diikuti:

@AGENTS.md

## Tambahan khusus Claude Code

- Baca `docs/PRD.md`, `docs/API.md`, atau `docs/DESIGN.md` sesuai kebutuhan tugas (jangan memuat semuanya bila tidak perlu). Rujuk ID kebutuhan (mis. `AUTH-02`, `PRP-04`) di ringkasan kerja.
- `docs/PRD-AGEN.md` (program agen, leader–member, komisi, invoice; ID `A1`–`B9`) berstatus **draft dan belum diimplementasi**. Baca hanya untuk tugas terkait agen/komisi, dan jangan menulis kode, migrasi, atau mengubah struktur folder dari dokumen itu tanpa instruksi eksplisit. Karena dokumen itu bertentangan dengan `docs/PRD.md` v1.0 pada beberapa hal (lihat banner di awal dokumen), berhenti dan tanyakan kepada pengguna bila tugas menyentuh bagian yang bertentangan.
- Untuk tugas besar, susun rencana singkat yang menyebut file yang akan dibuat/diubah sesuai struktur PRD §12 sebelum menulis kode.
- Jalankan perintah verifikasi di AGENTS.md §3 untuk bagian yang disentuh sebelum menyatakan tugas selesai; laporkan bila ada yang tidak bisa dijalankan.
- Bila menemukan dokumen yang saling bertentangan, berhenti dan tanyakan kepada pengguna.
