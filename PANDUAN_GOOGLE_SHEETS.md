# Panduan Integrasi Database Google Sheets + Apps Script (eLHa Event)

Dengan menghubungkan website eLHa Event ke **Google Sheets + Google Apps Script**, seluruh data pesanan tiket, status verifikasi Lunas, total tiket terjual, sisa kuota, dan daftar peserta akan tersimpan **terpusat di cloud** dan **update otomatis di semua HP/laptop/akun admin**.

---

## Langkah 1: Buat File Google Sheets Baru
1. Buka [Google Sheets](https://sheets.google.com) menggunakan akun Google Anda.
2. Klik **Blank spreadsheet** (Spreadsheet kosong).
3. Beri judul file di pojok kiri atas, misalnya: **`Database Tiket eLHa Event`**.

---

## Langkah 2: Buka Google Apps Script & Tempel Kode
1. Pada menu atas Google Sheets, klik **Extensions** (Ekstensi) -> pilih **Apps Script**.
2. Tab editor baru akan terbuka. Hapus seluruh kode bawaan (`function myFunction() { ... }`) hingga bersih.
3. Buka file [`docs/google-apps-script.gs`](docs/google-apps-script.gs), salin seluruh isinya, lalu tempel (*paste*) ke editor Apps Script tersebut.
4. Klik ikon **Save project** (ikon disket) atau tekan `Ctrl + S`.

---

## Langkah 3: Deploy Sebagai Web App (Gratis)
1. Di pojok kanan atas editor Apps Script, klik tombol **Deploy** -> pilih **New deployment**.
2. Pada bagian **Select type** (ikon roda gigi di sebelah kiri), pilih **Web app**.
3. Isi konfigurasi berikut dengan tepat:
   - **Description:** `API Tiket eLHa Event`
   - **Execute as:** Pilih **`Me`** (akun Google Anda sendiri)
   - **Who has access:** Pilih **`Anyone`** (Siapa saja - wajib dipilih agar form checkout pembeli bisa mengirim data tanpa login Google)
4. Klik tombol **Deploy**.
5. Jika muncul jendela *Authorization required*:
   - Klik **Authorize access** -> pilih akun Google Anda.
   - Jika muncul peringatan *"Google hasn't verified this app"*, klik **Advanced** (Lanjutan) -> klik **Go to ... (unsafe)** -> klik **Allow** (Izinkan).
6. Setelah selesai, Anda akan mendapatkan **Web app URL** yang berakhiran `/exec`, contohnya:
   `https://script.google.com/macros/s/AKfycbx.../exec`
7. Klik **Copy** untuk menyalin URL tersebut.

---

## Langkah 4: Pasang URL di Dashboard Admin eLHa Event
1. Buka Dashboard Admin website Anda (`/adminelha`).
2. Masuk ke tab **Pengaturan**.
3. Tempelkan URL Web App tadi ke kolom **URL Web App Google Apps Script (Database Penjualan Cloud)**.
4. Klik **Simpan Pengaturan**.
5. **PENTING (Agar Berlaku Global di Semua Perangkat):**
   - Klik tombol **Unduh File `events.json`** di tab **Kelola Event** atau tab **Ekspor & Impor Data**.
   - Gantikan file `assets/data/events.json` di proyek/GitHub Anda dengan file hasil unduhan tersebut, lalu **Commit & Push** ke GitHub / Vercel.

---

## Cara Kerja Setelah Terhubung:
- **Checkout Pembeli:** Setiap pembeli mengisi form checkout dari HP manapun, datanya otomatis masuk ke sheet **`Orders`** di Google Sheets Anda dengan status `pending`.
- **Verifikasi Admin:** Saat Anda klik **Verifikasi Lunas** dari laptop maupun HP lain, status di Google Sheets langsung berubah menjadi `verified`.
- **Sinkronisasi Otomatis:** Saat Anda membuka tab **Verifikasi Tiket**, **Laporan Peserta**, atau **Kuota** di perangkat manapun, dashboard otomatis menarik data terbaru dari Google Sheets (atau klik tombol **Sinkronkan Cloud** kapan saja untuk muat ulang instan).
- **Cek Link E-Tiket Pembeli:** Jika pembeli membuka kembali link E-Tiket miliknya setelah Anda verifikasi lunas, status di kartu tiketnya juga otomatis ikut berubah menjadi **LUNAS & AKTIF**.

---

## Catatan Jika Mengupdate Kode Apps Script di Masa Depan
Setiap kali Anda mengubah isi script di editor Apps Script, Anda harus memilih **Deploy -> Manage deployments -> Edit (ikon pensil) -> Version: New version -> Deploy** agar perubahan script aktif di URL yang sama.
