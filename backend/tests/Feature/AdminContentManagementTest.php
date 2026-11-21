<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminContentManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_content_management_routes_are_restricted_to_admins(): void
    {
        $user = User::factory()->create(['is_admin' => false]);
        Sanctum::actingAs($user, ['admin:dashboard']);

        $this->getJson('/admin/catalogs')->assertForbidden();
        $this->getJson('/admin/promos-events')->assertForbidden();
        $this->getJson('/admin/schedule')->assertForbidden();
        $this->getJson('/admin/tickets')->assertForbidden();
        $this->getJson('/admin/gallery')->assertForbidden();
        $this->getJson('/admin/partner-description')->assertForbidden();
        $this->postJson('/admin/catalogs', [])->assertForbidden();
        $this->patchJson('/admin/tickets/1', [])->assertForbidden();
    }

    public function test_admin_can_create_edit_and_delete_catalog_items(): void
    {
        Sanctum::actingAs(User::factory()->create(['is_admin' => true]), ['admin:dashboard']);

        $created = $this->postJson('/admin/catalogs', [
            'title' => 'Kolam Ombak',
            'type' => 'wahana',
            'description' => 'Wahana keluarga',
            'image_path' => null,
            'height_requirement' => 'Minimal 120 cm',
            'price' => null,
            'duration_minutes' => null,
            'is_featured' => true,
            'is_active' => true,
            'sort_order' => 0,
        ])->assertCreated()
            ->assertJsonPath('data.title', 'Kolam Ombak');

        $id = $created->json('data.id');
        $this->patchJson("/admin/catalogs/{$id}", [
            'title' => 'Kolam Ombak Baru',
            'is_featured' => false,
        ])->assertOk()
            ->assertJsonPath('data.title', 'Kolam Ombak Baru')
            ->assertJsonPath('data.is_featured', 0);

        $this->getJson('/public/attractions')
            ->assertOk()
            ->assertJsonPath('data.0.name', 'Kolam Ombak Baru');

        $this->deleteJson("/admin/catalogs/{$id}")->assertOk();
        $this->getJson('/admin/catalogs')->assertJsonCount(0, 'data');
    }

    public function test_admin_can_upload_replace_and_delete_catalog_images(): void
    {
        Storage::fake('public');
        Sanctum::actingAs(User::factory()->create(['is_admin' => true]), ['admin:dashboard']);

        $created = $this->post('/admin/catalogs', [
            'title' => 'Kolam Keluarga',
            'type' => 'wahana',
            'description' => 'Kolam untuk keluarga.',
            'image' => $this->fakeWebp('catalog.webp'),
            'height_requirement' => null,
            'price' => null,
            'duration_minutes' => null,
            'is_featured' => '0',
            'is_active' => '1',
            'sort_order' => '0',
        ], ['Accept' => 'application/json'])
            ->assertCreated()
            ->assertJsonPath('data.title', 'Kolam Keluarga');

        $id = $created->json('data.id');
        $oldPath = $this->publicStoragePath($created->json('data.image_path'));
        Storage::disk('public')->assertExists($oldPath);

        $updated = $this->post("/admin/catalogs/{$id}", [
            '_method' => 'PATCH',
            'title' => 'Kolam Keluarga Baru',
            'type' => 'fasilitas',
            'description' => 'Keterangan diperbarui.',
            'image' => $this->fakeWebp('catalog-updated.webp'),
        ], ['Accept' => 'application/json'])
            ->assertOk()
            ->assertJsonPath('data.title', 'Kolam Keluarga Baru')
            ->assertJsonPath('data.type', 'fasilitas');

        $newPath = $this->publicStoragePath($updated->json('data.image_path'));
        Storage::disk('public')->assertMissing($oldPath);
        Storage::disk('public')->assertExists($newPath);

        $this->deleteJson("/admin/catalogs/{$id}")->assertOk();
        Storage::disk('public')->assertMissing($newPath);
    }

    public function test_admin_can_manage_promotions_events_and_business_partners(): void
    {
        Sanctum::actingAs(User::factory()->create(['is_admin' => true]), ['admin:dashboard']);

        $created = $this->postJson('/admin/promos-events', [
            'title' => 'Promo Liburan',
            'type' => 'promo',
            'description' => 'Diskon tiket',
            'banner_image' => null,
            'start_date' => '2026-12-01',
            'end_date' => '2026-12-31',
            'terms' => 'Berlaku selama persediaan ada.',
            'website_url' => null,
            'is_active' => true,
            'sort_order' => 0,
        ])->assertCreated()->assertJsonPath('data.type', 'promo');

        $id = $created->json('data.id');
        $this->patchJson("/admin/promos-events/{$id}", [
            'title' => 'Promo Akhir Tahun',
            'type' => 'event',
        ])->assertOk()
            ->assertJsonPath('data.title', 'Promo Akhir Tahun')
            ->assertJsonPath('data.type', 'event');

        $this->deleteJson("/admin/promos-events/{$id}")->assertOk();
    }

    public function test_admin_can_upload_replace_and_delete_promo_event_images(): void
    {
        Storage::fake('public');
        Sanctum::actingAs(User::factory()->create(['is_admin' => true]), ['admin:dashboard']);

        $created = $this->post('/admin/promos-events', [
            'title' => 'Promo Foto',
            'type' => 'promo',
            'description' => 'Promo dengan poster.',
            'banner_image' => '',
            'image' => $this->fakeWebp('promo.webp'),
            'start_date' => '',
            'end_date' => '',
            'terms' => '',
            'website_url' => '',
            'is_active' => '1',
            'sort_order' => '0',
        ], ['Accept' => 'application/json'])
            ->assertCreated()
            ->assertJsonPath('data.type', 'promo');

        $id = $created->json('data.id');
        $oldPath = $this->publicStoragePath($created->json('data.banner_image'));
        Storage::disk('public')->assertExists($oldPath);

        $this->getJson('/public/promotions')
            ->assertOk()
            ->assertJsonPath('data.0.title', 'Promo Foto')
            ->assertJsonPath('data.0.image_url', $created->json('data.banner_image'));

        $updated = $this->post("/admin/promos-events/{$id}", [
            '_method' => 'PATCH',
            'image' => $this->fakeWebp('promo-updated.webp'),
        ], ['Accept' => 'application/json'])
            ->assertOk()
            ->assertJsonPath('data.title', 'Promo Foto');

        $newPath = $this->publicStoragePath($updated->json('data.banner_image'));
        Storage::disk('public')->assertMissing($oldPath);
        Storage::disk('public')->assertExists($newPath);

        $this->deleteJson("/admin/promos-events/{$id}")->assertOk();
        Storage::disk('public')->assertMissing($newPath);
    }

    public function test_admin_can_manage_partner_logos_and_description(): void
    {
        Storage::fake('public');
        Sanctum::actingAs(User::factory()->create(['is_admin' => true]), ['admin:dashboard']);
        DB::table('promos_events')->where('type', 'sponsor')->delete();

        $created = $this->post('/admin/promos-events', [
            'title' => 'Mitra Baru',
            'type' => 'sponsor',
            'description' => '',
            'banner_image' => '',
            'image' => $this->fakeWebp('partner.webp'),
            'start_date' => '',
            'end_date' => '',
            'terms' => '',
            'website_url' => '',
            'is_active' => '1',
            'sort_order' => '0',
        ], ['Accept' => 'application/json'])
            ->assertCreated()
            ->assertJsonPath('data.type', 'sponsor');

        $id = $created->json('data.id');
        $oldPath = $this->publicStoragePath($created->json('data.banner_image'));
        Storage::disk('public')->assertExists($oldPath);

        $this->getJson('/public/partners')
            ->assertOk()
            ->assertJsonPath('data.items.0.name', 'Mitra Baru');

        $updated = $this->post("/admin/promos-events/{$id}", [
            '_method' => 'PATCH',
            'title' => 'Mitra Diperbarui',
            'is_active' => '0',
            'image' => $this->fakeWebp('partner-updated.webp'),
        ], ['Accept' => 'application/json'])
            ->assertOk()
            ->assertJsonPath('data.title', 'Mitra Diperbarui')
            ->assertJsonPath('data.is_active', 0);

        $newPath = $this->publicStoragePath($updated->json('data.banner_image'));
        Storage::disk('public')->assertMissing($oldPath);
        Storage::disk('public')->assertExists($newPath);

        $this->patchJson('/admin/partner-description', [
            'description' => 'Bermitra untuk pengalaman pengunjung yang lebih baik.',
        ])->assertOk()
            ->assertJsonPath('data', 'Bermitra untuk pengalaman pengunjung yang lebih baik.');
        $this->getJson('/public/partners')
            ->assertJsonPath('data.description', 'Bermitra untuk pengalaman pengunjung yang lebih baik.')
            ->assertJsonCount(0, 'data.items');

        $this->deleteJson("/admin/promos-events/{$id}")->assertOk();
        Storage::disk('public')->assertMissing($newPath);
    }

    public function test_admin_can_edit_operating_schedule_and_ticket_prices(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        Sanctum::actingAs($admin, ['admin:dashboard']);
        DB::table('company_profiles')->insert([
            'name' => 'Galaxy Waterpark',
            'operating_hours' => '09.00-17.00',
        ]);
        $ticketId = DB::table('ticket_prices')->insertGetId([
            'category_name' => 'Dewasa',
            'price' => 75000,
        ]);

        $this->patchJson('/admin/schedule', [
            'operating_hours' => '08.00-18.00',
            'holiday_info' => 'Buka saat libur nasional.',
        ])->assertOk()
            ->assertJsonPath('data.operating_hours', '08.00-18.00')
            ->assertJsonPath('data.holiday_info', 'Buka saat libur nasional.');

        $this->patchJson("/admin/tickets/{$ticketId}", [
            'price' => 85000,
            'weekday_price' => 80000,
            'weekend_price' => 90000,
            'age_min' => 11,
            'age_max' => 59,
            'is_active' => false,
        ])->assertOk()
            ->assertJsonPath('data.price', 85000)
            ->assertJsonPath('data.weekday_price', 80000)
            ->assertJsonPath('data.weekend_price', 90000)
            ->assertJsonPath('data.age_min', 11)
            ->assertJsonPath('data.age_max', 59)
            ->assertJsonPath('data.is_active', 0);

        $this->patchJson("/admin/tickets/{$ticketId}", [
            'age_min' => 60,
            'age_max' => 59,
        ])->assertUnprocessable()
            ->assertJsonValidationErrors('age_max');

        $this->assertDatabaseHas('ticket_prices', [
            'id' => $ticketId,
            'price' => 85000,
            'weekday_price' => 80000,
            'weekend_price' => 90000,
            'updated_by' => $admin->id,
        ]);

        $legacyTicketId = DB::table('ticket_prices')->insertGetId([
            'category_name' => 'Tiket Legacy',
            'price' => 50000,
            'age_min' => null,
            'age_max' => 10,
        ]);

        $this->patchJson("/admin/tickets/{$legacyTicketId}", [
            'price' => 55000,
            'weekday_price' => 55000,
            'weekend_price' => 60000,
        ])->assertOk()
            ->assertJsonPath('data.weekday_price', 55000)
            ->assertJsonPath('data.weekend_price', 60000);

        $this->assertDatabaseHas('ticket_prices', [
            'id' => $legacyTicketId,
            'price' => 55000,
            'weekday_price' => 55000,
            'weekend_price' => 60000,
        ]);
    }

    public function test_admin_can_upload_update_and_delete_gallery_photos(): void
    {
        Storage::fake('public');
        Sanctum::actingAs(User::factory()->create(['is_admin' => true]), ['admin:dashboard']);
        DB::table('galleries')->delete();

        $created = $this->post('/admin/gallery', [
            'image' => $this->fakeWebp('gallery.webp'),
            'title' => 'Hari keluarga',
            'caption' => 'Pengunjung di kolam',
            'category' => 'Keluarga',
            'is_active' => '1',
            'sort_order' => '0',
        ], ['Accept' => 'application/json'])
            ->assertCreated()
            ->assertJsonPath('data.title', 'Hari keluarga')
            ->assertJsonPath('data.category', 'Keluarga');

        $id = $created->json('data.id');
        $imageUrl = $created->json('data.image_path');
        $imagePath = str_replace('/storage/', '', $imageUrl);
        Storage::disk('public')->assertExists($imagePath);
        $this->get("/public/gallery/{$id}/image", [
            'Origin' => 'http://localhost:3000',
        ])->assertOk()
            ->assertHeader('access-control-allow-origin', 'http://localhost:3000')
            ->assertHeader('content-type', 'image/webp');

        $updated = $this->post("/admin/gallery/{$id}", [
            'image' => $this->fakeWebp('updated.webp'),
            'title' => 'Dokumentasi terbaru',
            'caption' => 'Keterangan diperbarui',
            'category' => 'Event',
            'is_active' => '1',
            'sort_order' => '1',
        ], ['Accept' => 'application/json'])
            ->assertOk()
            ->assertJsonPath('data.title', 'Dokumentasi terbaru')
            ->assertJsonPath('data.category', 'Event');

        Storage::disk('public')->assertMissing($imagePath);
        $updatedImagePath = str_replace('/storage/', '', $updated->json('data.image_path'));
        Storage::disk('public')->assertExists($updatedImagePath);
        $this->getJson('/public/gallery')
            ->assertOk()
            ->assertJsonPath('data.0.category', 'Event');

        $this->deleteJson("/admin/gallery/{$id}")->assertOk();
        Storage::disk('public')->assertMissing($updatedImagePath);
    }

    public function test_catalog_and_gallery_upload_fields_are_validated(): void
    {
        Sanctum::actingAs(User::factory()->create(['is_admin' => true]), ['admin:dashboard']);

        $this->postJson('/admin/catalogs', [
            'title' => 'Wahana invalid',
            'type' => 'other',
            'is_active' => true,
            'is_featured' => false,
            'sort_order' => 0,
        ])->assertUnprocessable()->assertJsonValidationErrors('type');

        $this->postJson('/admin/gallery', [
            'title' => 'Tanpa gambar',
            'caption' => null,
            'is_active' => true,
            'sort_order' => 0,
        ])->assertUnprocessable()->assertJsonValidationErrors('image');
    }

    public function test_uploads_are_not_limited_by_the_former_five_megabyte_cap(): void
    {
        Storage::fake('public');
        Sanctum::actingAs(User::factory()->create(['is_admin' => true]), ['admin:dashboard']);

        $this->post('/admin/catalogs', [
            ...$this->catalogFields('Kolam dengan foto besar'),
            'image' => $this->fakeWebp('large.webp')->size(25 * 1024),
        ], ['Accept' => 'application/json'])
            ->assertCreated();

        $this->post('/admin/gallery', [
            'image' => $this->fakeWebp('large-gallery.webp')->size(25 * 1024),
            'title' => null,
            'caption' => null,
            'category' => 'Wahana',
            'is_active' => '1',
            'sort_order' => '0',
        ], ['Accept' => 'application/json'])
            ->assertCreated();
    }

    public function test_uploads_only_accept_decodable_webp_images(): void
    {
        Storage::fake('public');
        Sanctum::actingAs(User::factory()->create(['is_admin' => true]), ['admin:dashboard']);

        // Real files on disk, so MIME detection inspects the content rather than the file name.
        $png = $this->realUpload(
            'catalog.png',
            base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/r9sAAAAASUVORK5CYII='),
        );
        $disguised = $this->realUpload('catalog.webp', 'not really an image');
        $renamedPng = $this->realUpload(
            'renamed.webp',
            base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/r9sAAAAASUVORK5CYII='),
        );

        foreach ([$png, $disguised, $renamedPng] as $file) {
            $this->post('/admin/catalogs', [
                ...$this->catalogFields('Kolam invalid'),
                'image' => $file,
            ], ['Accept' => 'application/json'])
                ->assertUnprocessable()
                ->assertJsonValidationErrors('image');
        }

        $this->assertDatabaseCount('catalogs', 0);
    }

    public function test_catalog_and_promo_images_stay_optional_and_are_kept_without_a_replacement(): void
    {
        Storage::fake('public');
        Sanctum::actingAs(User::factory()->create(['is_admin' => true]), ['admin:dashboard']);

        $withoutImage = $this->post('/admin/catalogs', $this->catalogFields('Tanpa foto'), ['Accept' => 'application/json'])
            ->assertCreated()
            ->assertJsonPath('data.image_path', null);

        $created = $this->post('/admin/catalogs', [
            ...$this->catalogFields('Dengan foto'),
            'image' => $this->fakeWebp('catalog.webp'),
        ], ['Accept' => 'application/json'])->assertCreated();
        $id = $created->json('data.id');
        $imageUrl = $created->json('data.image_path');

        $this->post("/admin/catalogs/{$id}", [
            '_method' => 'PATCH',
            'title' => 'Judul baru tanpa mengganti foto',
        ], ['Accept' => 'application/json'])
            ->assertOk()
            ->assertJsonPath('data.title', 'Judul baru tanpa mengganti foto')
            ->assertJsonPath('data.image_path', $imageUrl);
        Storage::disk('public')->assertExists($this->publicStoragePath($imageUrl));

        $this->post("/admin/catalogs/{$withoutImage->json('data.id')}", [
            '_method' => 'PATCH',
            'image' => $this->fakeWebp('late.webp'),
        ], ['Accept' => 'application/json'])
            ->assertOk()
            ->assertJsonPath('data.image_path', fn ($value) => is_string($value) && str_ends_with($value, '.webp'));
    }

    public function test_gallery_image_is_kept_when_only_metadata_changes_and_absolute_urls_are_cleaned_up(): void
    {
        Storage::fake('public');
        Sanctum::actingAs(User::factory()->create(['is_admin' => true]), ['admin:dashboard']);

        $path = 'gallery/legacy.webp';
        Storage::disk('public')->put($path, 'legacy');
        $id = DB::table('galleries')->insertGetId([
            'title' => 'Foto lama',
            'image_path' => 'http://localhost/storage/'.$path,
            'is_active' => 1,
            'sort_order' => 0,
        ]);

        $this->post("/admin/gallery/{$id}", ['title' => 'Judul diperbarui'], ['Accept' => 'application/json'])
            ->assertOk()
            ->assertJsonPath('data.image_path', 'http://localhost/storage/'.$path);
        Storage::disk('public')->assertExists($path);

        $this->deleteJson("/admin/gallery/{$id}")->assertOk();
        Storage::disk('public')->assertMissing($path);
    }

    /**
     * @return array<string, mixed>
     */
    private function catalogFields(string $title): array
    {
        return [
            'title' => $title,
            'type' => 'wahana',
            'description' => 'Keterangan',
            'height_requirement' => null,
            'price' => null,
            'duration_minutes' => null,
            'is_featured' => '0',
            'is_active' => '1',
            'sort_order' => '0',
        ];
    }

    private function realUpload(string $filename, string $content): UploadedFile
    {
        $path = tempnam(sys_get_temp_dir(), 'upload');
        file_put_contents($path, $content);

        return new UploadedFile($path, $filename, null, null, true);
    }

    private function fakeWebp(string $filename): UploadedFile
    {
        $image = base64_decode('UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==');

        return UploadedFile::fake()->createWithContent($filename, $image);
    }

    private function publicStoragePath(string $imageUrl): string
    {
        $urlPath = parse_url($imageUrl, PHP_URL_PATH);

        return is_string($urlPath) ? substr($urlPath, strlen('/storage/')) : '';
    }
}
