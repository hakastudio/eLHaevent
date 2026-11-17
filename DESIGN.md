# DESIGN.md: eLHa Event

## Identity
- **Brand Name**: `eLHa Event`
- **Domain & Focus**: Platform resmi katalog acara dan pemesanan E-Tiket (Pameran, Bazar, Workshop & Eksibisi) dengan alur checkout langsung dan penerbitan kartu E-Tiket ber-barcode.

## Personality & Mood
- **Character**: Modern, enerjik, bersih, dan ramah perangkat seluler (Mobile-First Event Storefront) dengan perpaduan warna **Biru Royal/Navy** dan **Oranye Kontras**.
- **Dial**: `ENERGY 2 / RHYTHM 2 / MOTION 2`

## Typography (R-06 Verified)
- **Display & Headings (`--elha-font-display`)**: `'Bricolage Grotesque'` (600, 700, 800). Dipilih karena karakter grotesque kontemporer yang tegas seperti tipografi poster eksibisi dan tiket konser modern, tetap ringkas di layar ponsel.
- **Body & Interface (`--elha-font-sans`)**: `'Onest'` (400, 500, 600, 700, 800). Dirancang khusus untuk keterbukaannya pada layar ponsel berdimensi kecil dengan x-height tinggi.
- **Monospace & Ticket Codes (`--elha-font-mono`)**: `'IBM Plex Mono'` (500, 600, 700). Digunakan khusus untuk nomor seri tiket (`ELHA-2611-XXXX`), kode event (`EXH-2601`), dan nominal harga Rupiah tabular.

## Color Palette: Orange & Blue (WCAG AA Verified)
- **Light Mode**:
  - Background Primary (`--elha-bg`): `#F8FAFC`
  - Card Surface (`--elha-surface-elevated`): `#FFFFFF`
  - Secondary Surface (`--elha-surface`): `#EEF2F8`
  - Hero Stage Surface (`--elha-hero-bg`): `#0B1E3B` (rasio kontras `#F8FAFC` `15.89:1`)
  - Primary Brand Blue (`--elha-blue`): `#15469E` (rasio kontras `#FFFFFF` `8.74:1`)
  - Text Primary (`--elha-text`): `#0B1E3B` (`15.89:1`)
  - Text Muted (`--elha-text-muted`): `#3B5275` (`7.57:1`)
  - Primary Brand Orange (`--elha-accent`): `#FF7315` (teks `#0B1E3B` rasio kontras `6.11:1`, serta `#C84700` untuk teks aksen di atas latar putih dengan rasio kontras `4.82:1`)
- **Dark Mode**:
  - Background Primary (`--elha-bg`): `#071326`
  - Card Surface (`--elha-surface-elevated`): `#142C52`
  - Secondary Surface (`--elha-surface`): `#0F2342`
  - Text Primary (`--elha-text`): `#F8FAFC` (`17.76:1`)
  - Text Muted (`--elha-text-muted`): `#B8CAE6` (`9.43:1`)
  - Primary Brand Orange (`--elha-accent`): `#FF8533` (teks `#071326` rasio kontras `7.66:1`)

## Written Reasons for Visual Techniques (R-31 & R-03)
1. **Royal Blue & Orange Ticketing Hierarchy (R-01)**: Warna Biru Navy/Royal (`#0B1E3B` & `#15469E`) membangun fondasi kepercayaan platform tiket resmi, sementara warna Oranye (`#FF7315`) dikhususkan untuk tombol aksi utama (`Beli Tiket` & `Checkout Tiket`) agar langsung menarik fokus mata pembeli.
2. **Single Glassmorphic Sticky Header (R-10 Dose Cap = 1 element)**: Digunakan hanya pada bilah navigasi atas (`backdrop-filter: blur(16px)`).
3. **Selective Elevation Shadow on Boarding Pass & Event Cards (R-12)**: Digunakan untuk membedakan kartu E-Tiket dan kartu poster event dari latar belakang halaman.
4. **Three-State Mobile-First Responsive Layout (R-03)**: Tata letak beradaptasi pada tiga rentang lebar layar (`< 680px` ponsel 1 kolom dengan switcher penuh di bawah header dan ukuran input `16px` bebas auto-zoom, `680px - 1023px` tablet 2 kolom, dan `>= 1024px` desktop). Seluruh target sentuh memiliki ukuran minimum `44x44px`.
