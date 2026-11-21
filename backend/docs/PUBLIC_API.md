# Public website API

All endpoints are rooted directly at `/public` or `/admin` and return JSON;
there is no `/api` prefix. Public GET endpoints are limited to 100 requests per
IP every 15 minutes. Review submissions are limited to 5 requests per IP every
15 minutes.

## Existing MySQL schema

The backend uses the existing Galaxy Waterpark tables instead of creating
parallel content tables:

- `catalogs`: `type` values `wahana`, `fasilitas`, and `hydrotherapy`
- `galleries`: visitor documentation and images
- `promos_events`: `type` values `promo`, `event`, and `sponsor`
- `company_profiles`, `ticket_prices`, `reviews`, and `users`

After starting the configured MySQL service, apply the additive schema changes
with `php artisan migrate` from the `backend` directory. The baseline migration
preserves existing profile, ticket, and user tables and adds the columns needed
by the API. Do not use `migrate:fresh` against a database containing application
data.

The migration also supports a Laravel-style existing `users` table by copying
`name` and `password` into the admin authentication columns `username` and
`password_hash`. Run migrations before creating an admin account.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/public/home` | Homepage data: profile, tickets, featured catalog items, gallery, promotions, events, and sponsors |
| GET | `/public/profile` | Waterpark profile, operating details, Google Maps embed URL, and WhatsApp number |
| GET | `/public/tickets` | Active ticket prices, descriptions, and height requirements |
| GET | `/public/schedule` | Operating hours and holiday information |
| GET | `/public/attractions` | Active rides and attractions |
| GET | `/public/facilities` | Active facilities |
| GET | `/public/hydrotherapy` | Active hydrotherapy services and prices |
| GET | `/public/gallery` | Active gallery images |
| GET | `/public/promotions` | Active promotions within their optional start/end dates |
| GET | `/public/events` | Active events that have not ended |
| GET | `/public/sponsors` | Active event and business sponsors |
| GET | `/public/reviews?limit=5` | Approved visitor reviews; `limit` is capped at 20 |
| POST | `/public/reviews` | Submit a visitor review for moderation |

Submit a review as JSON:

```json
{
  "reviewer_name": "Nama Pengunjung",
  "rating": 5,
  "comment_text": "Wahana dan fasilitasnya menyenangkan."
}
```

The name and comment are required, with maximum lengths of 100 and 2,000
characters. The rating must be an integer from 1 to 5. New reviews receive
`pending` status and are not returned by the public review listing until
approved through a trusted moderation process.

Content records are made available by setting `is_active` to `true`; catalog
items can also be marked `is_featured` to appear in the homepage response.
Profile and ticket details continue to use the existing `company_profiles` and
`ticket_prices` tables.

## Admin dashboard API

Admin endpoints use Sanctum bearer tokens. Create an admin account from the
backend terminal with `php artisan admin:create`; this prompts for an email and
a password of at least 8 characters. There is no public admin registration.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/admin/login` | Authenticate an admin and issue an 8-hour bearer token |
| GET | `/admin/dashboard` | Overview counts and the 10 most recent reviews |
| GET | `/admin/account` | View the signed-in admin's name and email |
| PATCH | `/admin/account` | Update the signed-in admin account and optionally change password |
| GET | `/admin/company-contact` | View the company's WhatsApp number |
| PATCH | `/admin/company-contact` | Update the company's WhatsApp number |
| GET, POST | `/admin/catalogs` | List or add attractions and facilities (also supports hydrotherapy catalog records) |
| PATCH, DELETE | `/admin/catalogs/{id}` | Edit or remove a catalog record |
| GET, POST | `/admin/promos-events` | List or add promotions, events, and business partners |
| PATCH, DELETE | `/admin/promos-events/{id}` | Edit or remove a promotion, event, or partner |
| GET, PATCH | `/admin/schedule` | View or edit operating hours and holiday information |
| GET | `/admin/tickets` | List ticket tariffs |
| PATCH | `/admin/tickets/{id}` | Edit a ticket tariff; ticket creation and deletion are not exposed |
| GET, POST | `/admin/gallery` | List gallery photos or upload a photo |
| POST | `/admin/gallery/{id}` | Edit photo metadata and optionally replace the photo |
| DELETE | `/admin/gallery/{id}` | Remove a gallery photo and its managed upload |
| POST | `/admin/logout` | Revoke the current bearer token |

Send login credentials as JSON with `email` and `password`. Pass the returned
token on protected endpoints in the `Authorization: Bearer <token>` header.
Only users with the admin role and a token with the `admin:dashboard` ability
can access the overview. Dashboard counts cover the profile, active tickets,
attractions, facilities, hydrotherapy, gallery, current promotions, events,
upcoming events, and sponsors; review statistics include total, pending, and
approved counts plus recent reviews. Login attempts are limited to 5 per 15
minutes per IP and email. Tokens expire after 8 hours.

Admin account updates accept `name` and/or `email`. To change a password, also
send `current_password`, `password`, and `password_confirmation`; the current
password must match. Company contact updates only change `whatsapp_number`, not
waterpark content. If no company record exists yet, its initial contact setup
also requires `company_name` because the existing schema requires a company
name. The update records the admin ID and update time.

All content-management endpoints require an authenticated admin bearer token
with the `admin:dashboard` ability. Catalog `type` values are `wahana`,
`fasilitas`, and `hydrotherapy`; promotion/event type values are `promo`,
`event`, and `sponsor`. Catalog and promotion/event create and update requests
can include an optional `image` file; gallery create requests require one and
gallery updates may replace it. The admin panel composes, crops, and compresses
every image to WebP in the browser before upload, so the API only accepts
decodable WebP files (`mimes:webp`, `image/webp`) and applies no application
size limit; only the PHP/web server request limits (`upload_max_filesize`,
`post_max_size`) apply. Omitting `image` on an update keeps the stored image, and
catalog/promotion images remain nullable. Uploaded files use Laravel's public
storage disk and are replaced/deleted together with their content records. Run
`php artisan storage:link` once on a new deployment so `/storage/...` URLs can be
served.

### Test the admin flow on Windows

1. If an admin account does not exist yet, open PowerShell in the `backend`
   directory and create one:

   ```powershell
   php artisan admin:create
   ```

2. In that window, start the API server:

   ```powershell
   php artisan serve
   ```

3. Open a second PowerShell window, change to the same `backend` directory,
   and start the interactive console:

   ```powershell
   powershell -NoProfile -ExecutionPolicy Bypass -File .\admin-console.ps1
   ```

4. Choose `1`, enter the admin email, then enter the password in the secure
   prompt. Password characters are hidden. Press Enter on the empty email
   prompt, type `Q`, or select Cancel in the password prompt to return to the
   menu without logging in. The console keeps the token in memory and does not
   display it.
5. After login, the dashboard opens automatically. Choose `2` to reload it.
6. Choose `3` to view the admin account, or `4` to change the admin name/email.
   To change the password, choose `Y` when prompted and enter the current
   password and the new password twice. Password input is hidden.
7. Choose `5` to view the company WhatsApp number, or `6` to update it. On
   first setup, enter the company name and WhatsApp number. Confirm with `Y`.
8. Choose `7` to revoke the token and log out. Choose `0` to exit; if a
   session is still active, the console logs out before exiting.

The console uses `http://127.0.0.1:8000` by default. To use a different server
URL, append `-BaseUrl http://localhost:8000` to the launch command.
