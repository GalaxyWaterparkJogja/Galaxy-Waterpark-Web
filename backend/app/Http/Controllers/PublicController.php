<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class PublicController extends Controller
{
    public function home(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => [
                'profile' => DB::table('company_profiles')
                    ->select('name', 'description', 'operating_hours', 'holiday_info', 'maps_embed_url', 'whatsapp_number')
                    ->first(),
                'tickets' => $this->activeTickets(),
                'attractions' => $this->catalogItems('wahana', true),
                'facilities' => $this->catalogItems('fasilitas', true),
                'hydrotherapy' => $this->catalogItems('hydrotherapy', true),
                'gallery' => $this->activeGallery(),
                'promotions' => $this->activePromotions(),
                'events' => $this->activeEvents(),
                'sponsors' => $this->activeSponsors(),
            ],
        ]);
    }

    public function profile(): JsonResponse
    {
        $profile = DB::table('company_profiles')
            ->select('name', 'description', 'operating_hours', 'holiday_info', 'maps_embed_url', 'whatsapp_number', 'image_path')
            ->first();

        if ($profile === null) {
            return response()->json([
                'success' => false,
                'message' => 'Profile data not found.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $profile,
        ]);
    }

    public function tickets(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $this->activeTickets(),
        ]);
    }

    public function attractions(): JsonResponse
    {
        return $this->catalogResponse('wahana', ['id', 'name', 'description', 'image_url', 'height_requirement', 'is_featured']);
    }

    public function facilities(): JsonResponse
    {
        return $this->catalogResponse('fasilitas', ['id', 'name', 'description', 'image_url', 'is_featured']);
    }

    public function hydrotherapy(): JsonResponse
    {
        return $this->catalogResponse('hydrotherapy', ['id', 'name', 'description', 'image_url', 'price', 'duration_minutes', 'is_featured']);
    }

    public function gallery(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $this->activeGallery(),
        ]);
    }

    public function galleryImage(int $id)
    {
        $gallery = DB::table('galleries')->where('id', $id)->first();
        abort_if($gallery === null, 404);

        $imagePath = parse_url($gallery->image_path, PHP_URL_PATH);
        abort_unless(is_string($imagePath) && str_starts_with($imagePath, '/storage/'), 404);

        $storagePath = substr($imagePath, strlen('/storage/'));
        abort_unless(Storage::disk('public')->exists($storagePath), 404);

        return Storage::disk('public')->response($storagePath);
    }

    public function promotions(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $this->activePromotions(),
        ]);
    }

    public function events(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $this->activeEvents(),
        ]);
    }

    public function sponsors(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $this->activeSponsors(),
        ]);
    }

    public function partners(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => [
                'description' => DB::table('company_profiles')->orderBy('id')->value('sponsors_description'),
                'items' => $this->activeSponsors(),
            ],
        ]);
    }

    private function activeTickets()
    {
        return DB::table('ticket_prices')
            ->select(
                'id',
                'category_name',
                'price',
                'weekday_price',
                'weekend_price',
                'age_min',
                'age_max',
                'description'
            )
            ->where('is_active', true)
            ->orderByRaw(
                "CASE category_name
                    WHEN 'Bayi' THEN 1
                    WHEN 'Anak' THEN 2
                    WHEN 'Dewasa' THEN 3
                    WHEN 'Lansia' THEN 4
                    ELSE 5
                END"
            )
            ->orderBy('id')
            ->get();
    }

    public function schedule(): JsonResponse
    {
        $schedule = DB::table('company_profiles')
            ->select('operating_hours', 'holiday_info')
            ->first();

        if ($schedule === null) {
            return response()->json([
                'success' => false,
                'message' => 'Operating schedule data not found.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $schedule,
        ]);
    }

    public function reviews(Request $request): JsonResponse
    {
        $requestedLimit = (int) $request->query('limit', 5);
        $limit = $requestedLimit < 1 ? 5 : min($requestedLimit, 20);
        $reviews = DB::table('reviews')
            ->select('id', 'reviewer_name', 'rating', 'comment_text', 'created_at')
            ->where('status', 'approved')
            ->orderByDesc('created_at')
            ->limit($limit)
            ->get();

        return response()->json([
            'success' => true,
            'data' => $reviews,
        ]);
    }

    public function submitReview(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'reviewer_name' => ['required', 'string', 'max:100'],
            'rating' => ['required', 'numeric', 'between:0.5,5', 'multiple_of:0.5'],
            'comment_text' => ['required', 'string', 'max:2000'],
        ]);

        $reviewId = DB::table('reviews')->insertGetId([
            ...$validated,
            'status' => 'pending',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Review submitted and awaiting moderation.',
            'data' => ['id' => $reviewId, 'status' => 'pending'],
        ], 201);
    }

    private function catalogResponse(string $type, array $fields): JsonResponse
    {
        $items = $this->catalogItems($type)
            ->map(fn (object $item): object => (object) array_intersect_key(
                (array) $item,
                array_flip($fields),
            ));

        return response()->json([
            'success' => true,
            'data' => $items,
        ]);
    }

    private function catalogItems(string $type, bool $featuredOnly = false)
    {
        return DB::table('catalogs')
            ->select([
                'id',
                'title as name',
                'description',
                'image_path as image_url',
                'height_requirement',
                'price',
                'duration_minutes',
                'is_featured',
            ])
            ->where('type', $type)
            ->where('is_active', true)
            ->when($featuredOnly, fn ($query) => $query->where('is_featured', true))
            ->orderBy('sort_order')
            ->get();
    }

    private function activePromotions()
    {
        $now = now();

        return DB::table('promos_events')
            ->select('id', 'title', 'description', 'banner_image as image_url', 'start_date as starts_at', 'end_date as ends_at', 'terms')
            ->where('type', 'promo')
            ->where('is_active', true)
            ->where(function ($query) use ($now): void {
                $query->whereNull('start_date')->orWhere('start_date', '<=', $now);
            })
            ->where(function ($query) use ($now): void {
                $query->whereNull('end_date')->orWhere('end_date', '>=', $now);
            })
            ->orderBy('starts_at')
            ->get();
    }

    private function activeGallery()
    {
        return DB::table('galleries')
            ->select('id', 'title', 'category', 'image_path as image_url', 'caption as alt_text', 'uploaded_at as event_date')
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->get();
    }

    private function activeSponsors()
    {
        return DB::table('promos_events')
            ->select('id', 'title as name', 'banner_image as logo_url', 'website_url')
            ->where('type', 'sponsor')
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->get();
    }

    private function activeEvents()
    {
        $now = now();

        return DB::table('promos_events')
            ->select('id', 'title', 'description', 'banner_image as image_url', 'start_date as starts_at', 'end_date as ends_at')
            ->where('type', 'event')
            ->where('is_active', true)
            ->where(function ($query) use ($now): void {
                $query->whereNull('end_date')->orWhere('end_date', '>=', $now);
            })
            ->orderBy('starts_at')
            ->get();
    }
}
