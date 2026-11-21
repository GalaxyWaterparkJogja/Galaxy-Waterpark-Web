<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class PublicInformationTest extends TestCase
{
    use RefreshDatabase;

    public function test_ticket_endpoint_returns_prices_and_age_ranges(): void
    {
        $this->assertFalse(Schema::hasColumn('ticket_prices', 'height_requirement'));
        DB::table('ticket_prices')->delete();

        DB::table('ticket_prices')->insert([
            'category_name' => 'Dewasa',
            'price' => 75000,
            'age_min' => 11,
            'age_max' => 59,
            'description' => 'Tiket masuk reguler',
        ]);

        $response = $this->getJson('/public/tickets')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.0.category_name', 'Dewasa')
            ->assertJsonPath('data.0.age_min', 11)
            ->assertJsonPath('data.0.age_max', 59);

        $this->assertEquals(75000, $response->json('data.0.price'));
    }

    public function test_schedule_endpoint_returns_operating_hours_and_holiday_info(): void
    {
        DB::table('company_profiles')->insert([
            'name' => 'Galaxy Waterpark',
            'operating_hours' => 'Setiap hari, 09.00-17.00',
            'holiday_info' => 'Tutup pada hari libur tertentu; cek pengumuman resmi.',
            'updated_at' => now(),
        ]);

        $this->getJson('/public/schedule')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.operating_hours', 'Setiap hari, 09.00-17.00')
            ->assertJsonPath('data.holiday_info', 'Tutup pada hari libur tertentu; cek pengumuman resmi.');
    }

    public function test_public_content_endpoints_return_only_active_content(): void
    {
        DB::table('catalogs')->insert([
            'title' => 'Kolam Ombak',
            'type' => 'wahana',
            'description' => 'Kolam ombak keluarga',
            'is_featured' => true,
            'is_active' => true,
            'created_at' => now(),
        ]);
        DB::table('catalogs')->insert([
            'title' => 'Wahana Nonaktif',
            'type' => 'wahana',
            'is_active' => false,
            'created_at' => now(),
        ]);
        DB::table('catalogs')->insert([
            'title' => 'Hydrotherapy',
            'type' => 'hydrotherapy',
            'price' => 50000,
            'duration_minutes' => 30,
            'is_featured' => true,
            'is_active' => true,
            'created_at' => now(),
        ]);
        DB::table('promos_events')->insert([
            'title' => 'Promo Aktif',
            'type' => 'promo',
            'is_active' => true,
            'created_at' => now(),
        ]);

        $this->getJson('/public/attractions')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Kolam Ombak');
        $this->getJson('/public/hydrotherapy')
            ->assertOk()
            ->assertJsonPath('data.0.price', 50000);
        $this->getJson('/public/promotions')
            ->assertOk()
            ->assertJsonPath('data.0.title', 'Promo Aktif');
        $this->getJson('/public/home')
            ->assertOk()
            ->assertJsonPath('data.attractions.0.name', 'Kolam Ombak')
            ->assertJsonPath('data.hydrotherapy.0.name', 'Hydrotherapy')
            ->assertJsonPath('data.promotions.0.title', 'Promo Aktif');
    }

    public function test_reviews_can_be_submitted_for_moderation_and_only_approved_reviews_are_public(): void
    {
        $this->postJson('/public/reviews', [
            'reviewer_name' => 'Pengunjung',
            'rating' => 5,
            'comment_text' => 'Pengalaman yang menyenangkan.',
        ])
            ->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.status', 'pending');

        $this->getJson('/public/reviews')
            ->assertOk()
            ->assertJsonCount(0, 'data');

        DB::table('reviews')->insert([
            'reviewer_name' => 'Pengunjung Terverifikasi',
            'rating' => 4,
            'comment_text' => 'Fasilitas bersih.',
            'status' => 'approved',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->getJson('/public/reviews')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.reviewer_name', 'Pengunjung Terverifikasi');
    }

    public function test_review_submission_validates_required_fields_and_rating_range(): void
    {
        $this->postJson('/public/reviews', [
            'reviewer_name' => 'Pengunjung',
            'rating' => 6,
            'comment_text' => 'Komentar.',
        ])->assertUnprocessable()->assertJsonValidationErrors('rating');

        $this->postJson('/public/reviews', [
            'reviewer_name' => 'Pengunjung',
            'rating' => 4.25,
            'comment_text' => 'Komentar.',
        ])->assertUnprocessable()->assertJsonValidationErrors('rating');
    }

    public function test_review_submission_accepts_half_star_ratings(): void
    {
        $this->postJson('/public/reviews', [
            'reviewer_name' => 'Pengunjung',
            'rating' => 0.5,
            'comment_text' => 'Komentar.',
        ])
            ->assertCreated()
            ->assertJsonPath('data.status', 'pending');

        $this->assertDatabaseHas('reviews', [
            'reviewer_name' => 'Pengunjung',
            'rating' => 0.5,
        ]);

        $this->postJson('/public/reviews', [
            'reviewer_name' => 'Pengunjung Lain',
            'rating' => 4.5,
            'comment_text' => 'Komentar lainnya.',
        ])->assertCreated();
    }
}
