# Galaxy Waterpark API

## Import ke Postman

1. Jalankan backend dari folder `backend`:

   ```powershell
   php artisan serve
   ```

2. Import file `Galaxy Waterpark API.postman_collection.json` ke Postman.
3. Pastikan variable collection `base_url` bernilai `http://127.0.0.1:8000`.
4. Jalankan request publik di folder **Public API**.
5. Untuk request admin, siapkan environment variables `admin_email` dan
   `admin_password` dengan kredensial admin. Jalankan **Login Admin** terlebih
   dahulu; token akan disimpan di environment sebagai `admin_token`.

## Endpoint

| Method | Endpoint | Keterangan |
| --- | --- | --- |
| GET | `/public/profile` | Mengambil profil perusahaan |
| GET | `/public/home` | Mengambil data gabungan untuk homepage |
| GET | `/public/tickets` | Mengambil informasi tarif tiket dan persyaratan, diurutkan berdasarkan harga |
| GET | `/public/schedule` | Mengambil jadwal operasional dan informasi hari libur |
| GET | `/public/attractions` | Mengambil daftar wahana aktif |
| GET | `/public/facilities` | Mengambil daftar fasilitas aktif |
| GET | `/public/hydrotherapy` | Mengambil layanan hydrotherapy aktif, harga, dan durasi |
| GET | `/public/gallery` | Mengambil item galeri aktif |
| GET | `/public/promotions` | Mengambil promo aktif sesuai periode |
| GET | `/public/events` | Mengambil event aktif yang belum berakhir |
| GET | `/public/sponsors` | Mengambil sponsor aktif |
| GET | `/public/reviews?limit=5` | Mengambil review berstatus `approved` |
| POST | `/public/reviews` | Mengirim review baru untuk moderasi |
| POST | `/admin/login` | Login admin dan menerbitkan bearer token 8 jam |
| GET | `/admin/dashboard` | Ringkasan statistik konten dan review; memerlukan bearer token admin |
| POST | `/admin/logout` | Mencabut bearer token aktif |

### Admin Dashboard

Buat akun admin melalui terminal backend:

```powershell
php artisan admin:create
```

Perintah meminta nama, email, dan password secara interaktif. Password wajib
minimal 12 karakter dan tidak ditampilkan saat diketik. Tidak ada registrasi
publik untuk admin. Endpoint admin dilindungi Sanctum, memerlukan `is_admin`,
dan token login kedaluwarsa setelah 8 jam. Login dibatasi 5 percobaan per 15
menit per kombinasi IP dan email.

Setelah login, dashboard mengembalikan waktu pembuatan ringkasan, jumlah profil,
tiket aktif, wahana, fasilitas, layanan hydrotherapy, galeri, promo aktif, event,
event mendatang, sponsor, serta total/pending/approved review dan 10 review
terbaru.

`/admin` atau URL privat bukan mekanisme autentikasi. Proteksi diterapkan di
endpoint backend, jadi data dashboard tetap memerlukan token admin yang valid.

Request body untuk mengirim review:

```json
{
  "reviewer_name": "Nama Pengunjung",
  "rating": 5,
  "comment_text": "Wahana dan fasilitasnya menyenangkan."
}
```

Nama wajib diisi (maksimum 100 karakter), rating berupa integer 1–5, dan
komentar wajib diisi (maksimum 2.000 karakter). Review baru berstatus `pending`
dan baru tampil di endpoint GET setelah disetujui. Batas pengiriman review
adalah 5 request per 15 menit per IP.

## Response

Response sukses menggunakan format:

```json
{
  "success": true,
  "data": []
}
```

`GET /public/profile` dan `GET /public/schedule` mengembalikan HTTP `404` jika profil belum tersedia. Informasi jadwal dan hari libur disimpan pada profil perusahaan. Endpoint tickets menyertakan harga, syarat tinggi, dan deskripsi setiap kategori tiket. Untuk endpoint reviews, `limit` default-nya `5` dan nilai maksimum `20`.

Endpoint publik tidak memerlukan autentikasi. Endpoint GET publik memiliki batas
`100` request per `15` menit per IP. Pengiriman review publik dibatasi
`5` request per `15` menit per IP.
