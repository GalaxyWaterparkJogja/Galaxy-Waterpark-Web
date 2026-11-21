<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminReviewManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_list_reviews_including_pending_and_moderated_reviews(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        Sanctum::actingAs($admin, ['admin:dashboard']);

        DB::table('reviews')->insert([
            [
                'reviewer_name' => 'Pending Guest',
                'rating' => 5,
                'comment_text' => 'Waiting for review.',
                'status' => 'pending',
                'created_at' => now()->subMinute(),
            ],
            [
                'reviewer_name' => 'Approved Guest',
                'rating' => 4,
                'comment_text' => 'Already approved.',
                'status' => 'approved',
                'created_at' => now(),
            ],
        ]);

        $this->getJson('/admin/reviews')
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.reviewer_name', 'Approved Guest')
            ->assertJsonPath('data.1.status', 'pending');
    }

    public function test_admin_can_approve_or_reject_pending_reviews(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        Sanctum::actingAs($admin, ['admin:dashboard']);

        $approvedId = DB::table('reviews')->insertGetId([
            'reviewer_name' => 'Approved Guest',
            'rating' => 5,
            'comment_text' => 'A lovely visit.',
            'status' => 'pending',
            'created_at' => now(),
        ]);
        $rejectedId = DB::table('reviews')->insertGetId([
            'reviewer_name' => 'Rejected Guest',
            'rating' => 1,
            'comment_text' => 'Needs moderation.',
            'status' => 'pending',
            'created_at' => now(),
        ]);

        $this->patchJson("/admin/reviews/{$approvedId}", ['status' => 'approved'])
            ->assertOk()
            ->assertJsonPath('data.status', 'approved');
        $this->patchJson("/admin/reviews/{$rejectedId}", ['status' => 'rejected'])
            ->assertOk()
            ->assertJsonPath('data.status', 'rejected');

        $this->assertDatabaseHas('reviews', [
            'id' => $approvedId,
            'status' => 'approved',
            'moderated_by' => $admin->id,
        ]);
        $this->assertDatabaseHas('reviews', [
            'id' => $rejectedId,
            'status' => 'rejected',
            'moderated_by' => $admin->id,
        ]);
        $this->getJson('/public/reviews')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $approvedId);
    }

    public function test_review_moderation_rejects_invalid_status_and_repeat_decisions(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        Sanctum::actingAs($admin, ['admin:dashboard']);

        $reviewId = DB::table('reviews')->insertGetId([
            'reviewer_name' => 'Guest',
            'rating' => 3,
            'comment_text' => 'A review.',
            'status' => 'pending',
            'created_at' => now(),
        ]);

        $this->patchJson("/admin/reviews/{$reviewId}", ['status' => 'pending'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('status');
        $this->patchJson("/admin/reviews/{$reviewId}", ['status' => 'approved'])->assertOk();
        $this->patchJson("/admin/reviews/{$reviewId}", ['status' => 'rejected'])
            ->assertConflict();
        $this->patchJson('/admin/reviews/99999', ['status' => 'approved'])
            ->assertNotFound();
    }

    public function test_review_moderation_requires_admin_access(): void
    {
        $this->getJson('/admin/reviews')->assertUnauthorized();
        $this->patchJson('/admin/reviews/1', ['status' => 'approved'])->assertUnauthorized();

        $user = User::factory()->create(['is_admin' => false]);
        Sanctum::actingAs($user, ['admin:dashboard']);

        $this->getJson('/admin/reviews')->assertForbidden();
        $this->patchJson('/admin/reviews/1', ['status' => 'approved'])->assertForbidden();
    }
}
