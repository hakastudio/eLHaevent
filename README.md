# eLHa Event

Website statis resmi **eLHa Event** untuk katalog acara (Pameran, Bazar, Workshop & Eksibisi), kalkulasi harga tiket, penerbitan **Kartu E-Tiket Digital & Barcode SVG**, cetak PDF, dan konfirmasi pemesanan melalui WhatsApp.

Dirancang menggunakan **HTML5, CSS3, dan Vanilla JavaScript murni** tanpa ketergantungan server (PHP/Database), sehingga dapat langsung di-deploy gratis ke **Vercel, GitHub Pages, Netlify, Cloudflare Pages**, atau hosting web mana saja.

## Struktur File
```text
├── index.html               # Halaman utama (Katalog Event + Checkout E-Tiket + Admin Studio)
├── vercel.json              # Konfigurasi siap deploy ke Vercel
├── assets/
│   ├── css/
│   │   └── style.css        # Stylesheet responsif (Tema Oranye & Biru Royal + Mode Gelap + Cetak PDF)
│   ├── data/
│   │   └── events.json      # File pusat data event & nomor WhatsApp publik
│   └── js/
│       └── app.js           # Logika katalog, kalkulator tiket, Barcode E-Tiket & Event Studio
├── DESIGN.md                # Dokumentasi sistem desain & kontras warna WCAG AA
└── README.md                # Panduan penggunaan & deployment
```

## Cara Edit & Posting Event (Khusus Admin)
Tombol **Kelola Event** disembunyikan dari pengunjung umum agar pembeli tiket tidak bingung. Sebagai pemilik website, Anda memiliki 2 cara untuk mengelola event:

1. **Membuka Dashboard Admin lewat URL `/adminelha`:**
   - Buka alamat `/adminelha` di akhir domain website Anda (contoh: `http://localhost:8080/adminelha` atau `https://domain-anda.com/adminelha`), **atau**
   - Tekan kombinasi tombol keyboard **`Ctrl + Shift + E`** di halaman website.
   - Setelah menambah/mengedit acara di form, klik **Download File `events.json`**, lalu simpan ke [`assets/data/events.json`](assets/data/events.json) dan push ke GitHub agar tampil permanen bagi seluruh pengunjung.
2. **Edit Langsung File JSON:**
   - Buka [`assets/data/events.json`](assets/data/events.json), ubah `whatsapp_number` atau daftar `events`, lalu commit/push ke GitHub.

## Panduan Format JSON untuk 2 atau Lebih Event (Multi-Event)

Untuk menambahkan 2 atau lebih event dalam satu file [`assets/data/events.json`](assets/data/events.json), Anda **tidak perlu membuat file JSON baru**. Cukup tambahkan objek event baru di dalam array `"events": [ ... ]`.

### Aturan Penting Syntax JSON:
1. Setiap event dibungkus tanda kurung kurawal `{ ... }`.
2. Antara event pertama dan event berikutnya **wajib dipisahkan dengan tanda koma (`,`)**.
3. Event paling akhir di dalam tanda kurung siku `[ ... ]` **tidak boleh diakhiri koma**.
4. Hanya boleh ada **1 event dengan `"featured": true`** (event utama yang tampil besar di banner atas / Hero). Event lainnya diberi nilai `"featured": false`.
5. Properti `"id"` dan `"code"` harus unik untuk masing-masing event (misal `evt-001`, `evt-002` dan `EVT-027`, `EVT-028`).
6. Properti `"admin_wa"` dapat diisi nomor WhatsApp admin khusus event tersebut (format: `628xxx` tanpa spasi atau strip). Jika dikosongkan (`""`), sistem otomatis memakai nomor WhatsApp pusat di bagian `"settings"`.

---

### Contoh Lengkap Kode JSON untuk 2 Event

Berikut adalah contoh isi file `assets/data/events.json` yang berisi 2 event bersamaan:

```json
{
  "settings": {
    "brand_name": "eLHa Event",
    "whatsapp_number": "6285175114542",
    "whatsapp_admin_lbl": "Admin eLHa Event",
    "promo_code": "KOMUNITAS10",
    "promo_pct": 10
  },
  "events": [
    {
      "id": "evt-001",
      "code": "EVT-027",
      "title": "eLHa Cycling Community Fest",
      "category": "bike-community",
      "category_lbl": "Bike Community",
      "featured": true,
      "date_label": "10 Januari 2027",
      "time_label": "06.30 - 10.00 WIB",
      "venue": "Lembah Hijau, Bandar Lampung",
      "admin_wa": "6285175114542",
      "quota_label": "Tiket Tersedia",
      "poster_theme": "terracotta",
      "banner_image": "assets/img/cycling.jpg",
      "summary": "Festival gowes santai bersama seluruh komunitas sepeda di Lampung.",
      "tiers": [
        {
          "tier_id": "tier-001-reguler",
          "name": "Tiket Reguler",
          "price": 50000,
          "quota": 500,
          "quota_note": "Akses area festival dan doorprize"
        },
        {
          "tier_id": "tier-001-vip",
          "name": "Tiket VIP + Jersey",
          "price": 150000,
          "quota": 100,
          "quota_note": "Termasuk Jersey resmi dan refreshment VIP"
        }
      ]
    },
    {
      "id": "evt-002",
      "code": "EVT-028",
      "title": "eLHa Music & Creative Expo",
      "category": "music-festival",
      "category_lbl": "Music & Expo",
      "featured": false,
      "date_label": "15 Februari 2027",
      "time_label": "15.00 - 22.00 WIB",
      "venue": "Gedung Serba Guna (GSG) Unila, Bandar Lampung",
      "admin_wa": "6281298765432",
      "quota_label": "Tiket Tersedia",
      "poster_theme": "ocean",
      "banner_image": "assets/img/music.jpg",
      "summary": "Panggung pertunjukan musik indie dan pameran industri kreatif lokal.",
      "tiers": [
        {
          "tier_id": "tier-002-presale",
          "name": "Presale 1",
          "price": 75000,
          "quota": 300,
          "quota_note": "Akses all-day festival"
        },
        {
          "tier_id": "tier-002-normal",
          "name": "Tiket Normal",
          "price": 100000,
          "quota": 700,
          "quota_note": "Akses festival dan voucher belanja stan"
        }
      ]
    }
  ]
}
```

---

### Penjelasan Field / Properti Event:

| Nama Field | Tipe Data | Keterangan |
| :--- | :--- | :--- |
| `id` | String | ID unik event internal (contoh: `"evt-1794907807039"` atau `"evt-002"`). |
| `code` | String | Kode publik event (contoh: `"EVT-027"`, `"EVT-028"`). |
| `title` | String | Nama / judul acara yang tampil di kartu katalog dan e-tiket. |
| `category` | String | Slug kategori untuk filter (contoh: `"bike-community"`, `"music-festival"`). |
| `category_lbl` | String | Label kategori yang tampil di badge banner (contoh: `"Bike Community"`). |
| `featured` | Boolean | Set `true` untuk event utama di banner paling atas. Event lain wajib `false`. |
| `date_label` | String | Teks tanggal acara (contoh: `"10 Januari 2027"`). |
| `time_label` | String | Teks jam pelaksanaan (contoh: `"06.30 - 10.00 WIB"`). |
| `venue` | String | Nama tempat atau lokasi acara. |
| `admin_wa` | String | Nomor WhatsApp admin khusus event ini (format: `"628xxx"`). Jika dikosongkan, menggunakan nomor admin pusat. |
| `quota_label` | String | Teks kuota di banner (contoh: `"Tiket Tersedia"`). |
| `poster_theme` | String | Tema warna aksen kartu (`"terracotta"`, `"ocean"`, `"forest"`, dll). |
| `banner_image` | String | Link foto gambar banner (bisa URL path gambar atau string Base64). |
| `summary` | String | Deskripsi singkat acara. |
| `is_closed` | Boolean | (Opsional) Set `true` jika event sudah lewat / ditutup. Banner akan otomatis abu-abu dan pemesanan dinonaktifkan. |
| `tiers` | Array | Daftar kategori tiket untuk event tersebut (masing-masing punya `name`, `price`, `quota`, dan `quota_note`). |

---

### Tips Terbaik: Menggunakan Dashboard Admin (Tanpa Koding Manual)
Jika Anda tidak ingin mengedit kode JSON secara manual, gunakan Dashboard Admin bawaan:
1. Buka URL `/adminelha` atau tekan tombol **`Ctrl + Shift + E`**.
2. Masukkan judul acara baru, tanggal, lokasi, nomor WA admin event, dan kategori tiket.
3. Klik tombol **Simpan / Tambah Event**. Anda juga bisa klik tombol **Duplikat** pada event yang sudah ada untuk mempercepat proses pembuatan.
4. Klik tombol **Download File `events.json`**.
5. Gantikan file lama di folder `assets/data/events.json` dengan file hasil download tersebut, lalu lakukan git commit dan push ke GitHub repository.
