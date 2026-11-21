# Progress Report — Backend Public

**Tanggal:** 30 Oktober 2026  
**Status:** Implementasi API public selesai  
**Cakupan:** API dan penyimpanan data untuk fitur public website. Fitur admin/CMS dan integrasi frontend tidak termasuk dalam penilaian ini.

## Ringkasan

Seluruh kebutuhan backend public pada daftar fitur sudah memiliki endpoint dan dukungan skema data. Konten public hanya mengembalikan item aktif; ulasan baru disimpan sebagai `pending` dan belum ditampilkan sampai disetujui melalui proses moderasi.

| Fitur | Status | Endpoint / dukungan |
|---|---|---|
| Katalog wahana | Selesai | `GET /public/attractions` |
| Katalog fasilitas | Selesai | `GET /public/facilities` |
| Katalog hydrotherapy | Selesai | `GET /public/hydrotherapy`; mendukung harga dan durasi |
| Galeri dokumentasi | Selesai | `GET /public/gallery` |
| Informasi promo | Selesai | `GET /public/promotions`; memperhitungkan tanggal mulai dan berakhir |
| Informasi event | Selesai | `GET /public/events`; tidak menampilkan event yang sudah berakhir |
| Informasi sponsor | Selesai | `GET /public/sponsors` |
| Tombol direct WhatsApp reservasi | Selesai pada sisi data API | `GET /public/profile` menyediakan nomor WhatsApp (`whatsapp_number`) untuk digunakan sebagai tujuan tautan reservasi |
| Form kirim ulasan pengunjung | Selesai | `POST /public/reviews`; validasi nama, rating 1–5, dan komentar; ulasan masuk status `pending` |
| Daftar ulasan public | Selesai | `GET /public/reviews`; hanya ulasan berstatus `approved` yang dikembalikan |

Endpoint public pendukung juga tersedia: `GET /public/home`, `GET /public/profile`, `GET /public/tickets`, dan `GET /public/schedule`.

## Implementasi dan kontrol

- Route public didefinisikan di [backend/routes/api.php](../backend/routes/api.php).
- Pengambilan katalog, galeri, promo/event/sponsor, profil, dan ulasan ditangani oleh [backend/app/Http/Controllers/PublicController.php](../backend/app/Http/Controllers/PublicController.php).
- Struktur data yang dibutuhkan disiapkan melalui migration `catalogs`, `galleries`, `promos_events`, serta penyesuaian profil, tiket, dan ulasan.
- Endpoint GET public memiliki pembatasan request; pengiriman ulasan memiliki rate limit tersendiri.
- Data ulasan dimoderasi sebelum tampil di endpoint public.

## Validasi dan batasan status

Feature tests tersedia untuk endpoint informasi public, pemfilteran konten aktif, pengiriman ulasan, validasi rating, dan pemisahan ulasan pending/approved di [backend/tests/Feature/PublicInformationTest.php](../backend/tests/Feature/PublicInformationTest.php).

**Catatan verifikasi:** eksekusi test belum terkonfirmasi. Perintah test berhenti karena file PHPUnit yang dibutuhkan tidak ditemukan di direktori `backend/vendor`; karena itu status “selesai” di atas merujuk pada kelengkapan implementasi route, controller, dan skema, bukan hasil test suite yang lulus.

**Batas cakupan:** penyediaan nomor WhatsApp selesai pada backend. Pembentukan tautan `wa.me` dan penggunaan nomor dari API merupakan tanggung jawab integrasi frontend. Pengelolaan konten admin dan moderasi ulasan melalui dashboard tidak termasuk dalam progres backend public ini.
