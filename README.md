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

1. **Membuka Event Studio Rahasia di Browser:**
   - Tambahkan `?admin=elha` di akhir URL website Anda (contoh: `http://localhost:8080/?admin=elha` atau `https://nama-web.vercel.app/?admin=elha`), **atau**
   - Tekan kombinasi tombol keyboard **`Ctrl + Shift + E`** di halaman website.
   - Setelah menambah/mengedit acara di form, klik **Download File `events.json`**, lalu simpan ke [`assets/data/events.json`](assets/data/events.json) dan push ke GitHub agar tampil permanen bagi seluruh pengunjung.
2. **Edit Langsung File JSON:**
   - Buka [`assets/data/events.json`](assets/data/events.json), ubah `whatsapp_number` atau daftar `events`, lalu commit/push ke GitHub.
