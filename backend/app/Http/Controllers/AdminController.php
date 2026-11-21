<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class AdminController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'email', 'max:100'],
            'password' => ['required', 'string', 'max:255'],
        ]);

        $user = User::query()
            ->whereRaw('LOWER(email) = ?', [Str::lower($credentials['email'])])
            ->where('is_admin', true)
            ->first();

        if ($user === null || ! Hash::check($credentials['password'], $user->password_hash)) {
            return response()->json([
                'success' => false,
                'message' => 'The provided credentials are invalid.',
            ], 401);
        }

        $token = $user->createToken(
            'admin-dashboard',
            ['admin:dashboard'],
            now()->addHours(8),
        );

        return response()->json([
            'success' => true,
            'data' => [
                'token' => $token->plainTextToken,
                'token_type' => 'Bearer',
                'expires_at' => $token->accessToken->expires_at,
                'admin' => [
                    'id' => $user->id,
                    'name' => $user->username,
                    'email' => $user->email,
                ],
            ],
        ]);
    }

    public function dashboard(): JsonResponse
    {
        $now = now();

        return response()->json([
            'success' => true,
            'data' => [
                'generated_at' => $now->toIso8601String(),
                'content' => [
                    'profiles' => DB::table('company_profiles')->count(),
                    'active_tickets' => DB::table('ticket_prices')->where('is_active', true)->count(),
                    'active_attractions' => DB::table('catalogs')->where('type', 'wahana')->where('is_active', true)->count(),
                    'active_facilities' => DB::table('catalogs')->where('type', 'fasilitas')->where('is_active', true)->count(),
                    'active_hydrotherapy_services' => DB::table('catalogs')->where('type', 'hydrotherapy')->where('is_active', true)->count(),
                    'active_gallery_items' => DB::table('galleries')->where('is_active', true)->count(),
                    'current_promotions' => DB::table('promos_events')
                        ->where('type', 'promo')
                        ->where('is_active', true)
                        ->where(function ($query) use ($now): void {
                            $query->whereNull('start_date')->orWhere('start_date', '<=', $now);
                        })
                        ->where(function ($query) use ($now): void {
                            $query->whereNull('end_date')->orWhere('end_date', '>=', $now);
                        })
                        ->count(),
                    'active_events' => DB::table('promos_events')
                        ->where('type', 'event')
                        ->where('is_active', true)
                        ->count(),
                    'upcoming_events' => DB::table('promos_events')
                        ->where('type', 'event')
                        ->where('is_active', true)
                        ->whereNotNull('start_date')
                        ->where('start_date', '>=', $now)
                        ->count(),
                    'active_sponsors' => DB::table('promos_events')
                        ->where('type', 'sponsor')
                        ->where('is_active', true)
                        ->count(),
                ],
                'reviews' => [
                    'total' => DB::table('reviews')->count(),
                    'pending' => DB::table('reviews')->where('status', 'pending')->count(),
                    'approved' => DB::table('reviews')->where('status', 'approved')->count(),
                    'recent' => DB::table('reviews')
                        ->select('id', 'reviewer_name', 'rating', 'comment_text', 'status', 'created_at')
                        ->orderByDesc('created_at')
                        ->limit(10)
                        ->get(),
                ],
            ],
        ]);
    }

    public function reviews(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => DB::table('reviews')
                ->select('id', 'reviewer_name', 'rating', 'comment_text', 'status', 'created_at')
                ->orderByDesc('created_at')
                ->orderByDesc('id')
                ->get(),
        ]);
    }

    public function updateReviewStatus(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['required', Rule::in(['approved', 'rejected'])],
        ]);

        $updated = DB::table('reviews')
            ->where('id', $id)
            ->where('status', 'pending')
            ->update([
                'status' => $validated['status'],
                'moderated_by' => $request->user()->getAuthIdentifier(),
                'updated_at' => now(),
            ]);

        if ($updated === 0) {
            $review = DB::table('reviews')->where('id', $id)->first();
            if ($review === null) {
                return response()->json([
                    'success' => false,
                    'message' => 'Review not found.',
                ], 404);
            }

            return response()->json([
                'success' => false,
                'message' => 'Only pending reviews can be moderated.',
            ], 409);
        }

        return response()->json([
            'success' => true,
            'data' => DB::table('reviews')
                ->select('id', 'reviewer_name', 'rating', 'comment_text', 'status', 'created_at')
                ->where('id', $id)
                ->first(),
        ]);
    }

    public function account(Request $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $this->accountData($request->user()),
        ]);
    }

    public function updateAccount(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:50'],
            'email' => ['sometimes', 'required', 'email', 'max:100', Rule::unique('users', 'email')->ignore($user->getKey())],
            'current_password' => ['required_with:password', 'string'],
            'password' => ['sometimes', 'required', 'string', 'confirmed', Password::min(8)],
        ]);

        if (array_key_exists('password', $validated) && ! Hash::check($validated['current_password'], $user->password_hash)) {
            return response()->json([
                'success' => false,
                'message' => 'The current password is incorrect.',
            ], 422);
        }

        unset($validated['current_password'], $validated['password_confirmation']);

        if ($validated === []) {
            return response()->json([
                'success' => false,
                'message' => 'At least one account field must be provided.',
            ], 422);
        }

        if (isset($validated['name'])) {
            $user->username = $validated['name'];
            if (Schema::hasColumn('users', 'name')) {
                $user->name = $validated['name'];
            }
        }

        if (isset($validated['email'])) {
            $user->email = Str::lower($validated['email']);
        }

        if (isset($validated['password'])) {
            $user->password_hash = $validated['password'];
            if (Schema::hasColumn('users', 'password')) {
                $user->password = $validated['password'];
            }
        }

        $user->save();

        return $this->account($request);
    }

    public function companyContact(): JsonResponse
    {
        $profile = DB::table('company_profiles')
            ->select('whatsapp_number')
            ->orderBy('id')
            ->first();

        if ($profile === null) {
            return response()->json([
                'success' => false,
                'message' => 'Company contact has not been set up yet.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $profile,
        ]);
    }

    public function updateCompanyContact(Request $request): JsonResponse
    {
        $profileId = DB::table('company_profiles')->orderBy('id')->value('id');
        $isInitialSetup = $profileId === null;

        $validated = $request->validate([
            'company_name' => $isInitialSetup
                ? ['required', 'string', 'max:100']
                : ['prohibited'],
            'whatsapp_number' => $isInitialSetup
                ? ['required', 'string', 'max:30']
                : ['present', 'nullable', 'string', 'max:30'],
        ]);

        if ($isInitialSetup) {
            DB::table('company_profiles')->insert([
                'name' => $validated['company_name'],
                'whatsapp_number' => $validated['whatsapp_number'],
                'updated_by' => $request->user()->getAuthIdentifier(),
                'updated_at' => now(),
            ]);
        } else {
            DB::table('company_profiles')->where('id', $profileId)->update([
                'whatsapp_number' => $validated['whatsapp_number'],
                'updated_by' => $request->user()->getAuthIdentifier(),
                'updated_at' => now(),
            ]);
        }

        return $this->companyContact();
    }

    private function accountData(User $user): array
    {
        return [
            'id' => $user->getKey(),
            'name' => $user->username,
            'email' => $user->email,
        ];
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Logged out successfully.',
        ]);
    }
}
