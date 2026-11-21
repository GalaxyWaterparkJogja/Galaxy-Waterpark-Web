<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminDashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_dashboard_requires_an_authenticated_admin(): void
    {
        $this->getJson('/admin/dashboard')->assertUnauthorized();
        $this->get('/admin/dashboard')
            ->assertUnauthorized()
            ->assertJsonPath('message', 'Unauthenticated.');

        $user = User::factory()->create(['is_admin' => false]);

        Sanctum::actingAs($user, ['admin:dashboard']);

        $this->getJson('/admin/dashboard')->assertForbidden();
    }

    public function test_admin_dashboard_requires_a_token_with_the_dashboard_ability(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $token = $admin->createToken('limited-access', ['profile:read']);

        $this->withToken($token->plainTextToken)
            ->getJson('/admin/dashboard')
            ->assertForbidden();
    }

    public function test_admin_can_view_and_update_their_account(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        Sanctum::actingAs($admin, ['admin:dashboard']);

        $this->getJson('/admin/account')
            ->assertOk()
            ->assertJsonPath('data.name', $admin->username)
            ->assertJsonPath('data.email', $admin->email)
            ->assertJsonMissingPath('data.password')
            ->assertJsonMissingPath('data.password_hash');

        $this->patchJson('/admin/account', [
            'name' => 'Updated Admin',
            'email' => 'updated-admin@example.com',
        ])
            ->assertOk()
            ->assertJsonPath('data.name', 'Updated Admin')
            ->assertJsonPath('data.email', 'updated-admin@example.com');

        $this->assertDatabaseHas('users', [
            'id' => $admin->id,
            'username' => 'Updated Admin',
            'email' => 'updated-admin@example.com',
        ]);
    }

    public function test_admin_can_change_their_password_after_confirming_the_current_password(): void
    {
        $admin = User::factory()->create([
            'password_hash' => 'old-admin-password',
            'is_admin' => true,
        ]);
        Sanctum::actingAs($admin, ['admin:dashboard']);

        $this->patchJson('/admin/account', [
            'current_password' => 'incorrect-current-password',
            'password' => 'new-admin-password',
            'password_confirmation' => 'new-admin-password',
        ])->assertUnprocessable()
            ->assertJsonPath('message', 'The current password is incorrect.');

        $this->patchJson('/admin/account', [
            'current_password' => 'old-admin-password',
            'password' => 'new-admin-password',
            'password_confirmation' => 'new-admin-password',
        ])->assertOk();

        $admin->refresh();
        $this->assertTrue(Hash::check('new-admin-password', $admin->password_hash));
    }

    public function test_admin_can_view_and_update_the_company_whatsapp_number(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        Sanctum::actingAs($admin, ['admin:dashboard']);

        DB::table('company_profiles')->insert([
            'name' => 'Galaxy Waterpark',
            'description' => 'Company-owned waterpark.',
            'whatsapp_number' => '0811111111',
        ]);

        $this->getJson('/admin/company-contact')
            ->assertOk()
            ->assertJsonPath('data.whatsapp_number', '0811111111');

        $this->patchJson('/admin/company-contact', [
            'whatsapp_number' => '+6281234567890',
        ])
            ->assertOk()
            ->assertJsonPath('data.whatsapp_number', '+6281234567890');

        $this->patchJson('/admin/company-contact', [
            'company_name' => 'Changed Park Name',
            'whatsapp_number' => '+6281234567890',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors('company_name');

        $this->assertDatabaseHas('company_profiles', [
            'name' => 'Galaxy Waterpark',
            'description' => 'Company-owned waterpark.',
            'whatsapp_number' => '+6281234567890',
            'updated_by' => $admin->id,
        ]);

        $this->getJson('/public/profile')
            ->assertOk()
            ->assertJsonPath('data.whatsapp_number', '+6281234567890');
    }

    public function test_admin_company_contact_requires_admin_access_and_valid_fields(): void
    {
        $user = User::factory()->create(['is_admin' => false]);
        Sanctum::actingAs($user, ['admin:dashboard']);

        $this->getJson('/admin/company-contact')->assertForbidden();
        $this->patchJson('/admin/company-contact', ['whatsapp_number' => '+6281234567890'])
            ->assertForbidden();

        $admin = User::factory()->create(['is_admin' => true]);
        Sanctum::actingAs($admin, ['admin:dashboard']);

        $this->patchJson('/admin/company-contact', ['whatsapp_number' => str_repeat('1', 31)])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('whatsapp_number');

        $this->patchJson('/admin/company-contact', [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('whatsapp_number');
    }

    public function test_admin_can_create_initial_company_contact_without_editing_company_profile(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        Sanctum::actingAs($admin, ['admin:dashboard']);

        $this->getJson('/admin/company-contact')
            ->assertNotFound()
            ->assertJsonPath('message', 'Company contact has not been set up yet.');

        $this->patchJson('/admin/company-contact', ['whatsapp_number' => '+6281234567890'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('company_name');

        $this->patchJson('/admin/company-contact', [
            'company_name' => 'Galaxy Waterpark',
            'whatsapp_number' => '+6281234567890',
        ])
            ->assertOk()
            ->assertJsonPath('data.whatsapp_number', '+6281234567890');
    }

    public function test_admin_can_login_get_dashboard_and_revoke_their_token(): void
    {
        $admin = User::factory()->create([
            'username' => 'Admin',
            'email' => 'admin@example.com',
            'password_hash' => 'a-long-test-password',
            'is_admin' => true,
        ]);

        $login = $this->postJson('/admin/login', [
            'email' => 'admin@example.com',
            'password' => 'a-long-test-password',
        ])
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.token_type', 'Bearer')
            ->assertJsonPath('data.admin.email', 'admin@example.com');

        $token = $login->json('data.token');

        DB::table('ticket_prices')->delete();
        DB::table('ticket_prices')->insert([
            'category_name' => 'Dewasa',
            'price' => 75000,
            'is_active' => true,
        ]);
        DB::table('catalogs')->insert([
            'title' => 'Kolam Ombak',
            'type' => 'wahana',
            'is_active' => true,
            'created_at' => now(),
        ]);
        DB::table('reviews')->insert([
            'reviewer_name' => 'Pengunjung',
            'rating' => 5,
            'comment_text' => 'Menyenangkan.',
            'status' => 'pending',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->withToken($token)
            ->getJson('/admin/dashboard')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.content.active_tickets', 1)
            ->assertJsonPath('data.reviews.pending', 1)
            ->assertJsonPath('data.reviews.recent.0.reviewer_name', 'Pengunjung');

        $this->withToken($token)
            ->postJson('/admin/logout')
            ->assertOk()
            ->assertJsonPath('success', true);

        Auth::forgetGuards();

        $this->withToken($token)
            ->getJson('/admin/dashboard')
            ->assertUnauthorized();

        $this->assertDatabaseMissing('personal_access_tokens', [
            'tokenable_id' => $admin->id,
        ]);
    }

    public function test_admin_login_does_not_authenticate_non_admin_or_invalid_credentials(): void
    {
        $user = User::factory()->create([
            'username' => 'Pengguna',
            'email' => 'user@example.com',
            'password_hash' => 'a-long-test-password',
            'is_admin' => false,
        ]);

        $this->postJson('/admin/login', [
            'email' => 'user@example.com',
            'password' => 'a-long-test-password',
        ])->assertUnauthorized();
        $this->assertDatabaseMissing('personal_access_tokens', [
            'tokenable_id' => $user->id,
        ]);

        $this->postJson('/admin/login', [
            'email' => 'missing@example.com',
            'password' => 'a-long-test-password',
        ])->assertUnauthorized();
    }

    public function test_admin_create_populates_legacy_user_columns_when_present(): void
    {
        Schema::table('users', function ($table): void {
            $table->string('name')->default('');
            $table->string('password')->default('');
        });

        $password = 'a-long-admin-password';

        $this->artisan('admin:create')
            ->expectsQuestion('Administrator name', 'Admin')
            ->expectsQuestion('Administrator email', 'admin@example.com')
            ->expectsQuestion('Administrator password', $password)
            ->expectsQuestion('Confirm password', $password)
            ->expectsOutput('Administrator account created.')
            ->assertExitCode(0);

        $admin = User::query()->where('email', 'admin@example.com')->firstOrFail();

        $this->assertSame('Admin', $admin->name);
        $this->assertSame('Admin', $admin->username);
        $this->assertTrue(Hash::check($password, $admin->password));
        $this->assertTrue(Hash::check($password, $admin->password_hash));
        $this->assertTrue($admin->is_admin);
    }
}
