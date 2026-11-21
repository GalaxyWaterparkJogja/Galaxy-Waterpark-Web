<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AdminContentController extends Controller
{
    public function catalogs(): JsonResponse
    {
        return $this->collection(DB::table('catalogs')->orderBy('sort_order')->orderBy('id')->get());
    }

    public function createCatalog(Request $request): JsonResponse
    {
        $validated = $request->validate($this->catalogRules());
        $image = $validated['image'] ?? null;
        unset($validated['image']);
        $imagePath = $image instanceof UploadedFile ? $this->storeCatalogImage($image) : null;

        if ($imagePath !== null) {
            $validated['image_path'] = Storage::disk('public')->url($imagePath);
        }

        try {
            $id = DB::table('catalogs')->insertGetId([
                ...$validated,
                'created_by' => $request->user()->getAuthIdentifier(),
                'created_at' => now(),
            ]);
        } catch (\Throwable $exception) {
            if ($imagePath !== null) {
                Storage::disk('public')->delete($imagePath);
            }

            throw $exception;
        }

        return $this->record(DB::table('catalogs')->where('id', $id)->first(), 201);
    }

    public function updateCatalog(Request $request, int $id): JsonResponse
    {
        $record = DB::table('catalogs')->where('id', $id)->first();
        abort_if($record === null, 404);

        $validated = $request->validate($this->catalogRules(true));
        $image = $validated['image'] ?? null;
        unset($validated['image']);
        $newImagePath = $image instanceof UploadedFile
            ? $this->storeCatalogImage($image)
            : null;

        if ($newImagePath !== null) {
            $validated['image_path'] = Storage::disk('public')->url($newImagePath);
        }

        try {
            DB::table('catalogs')->where('id', $id)->update($validated);
        } catch (\Throwable $exception) {
            if ($newImagePath !== null) {
                Storage::disk('public')->delete($newImagePath);
            }

            throw $exception;
        }

        if ($newImagePath !== null && is_string($record->image_path)) {
            $this->deleteCatalogImage($record->image_path);
        }

        return $this->record(DB::table('catalogs')->where('id', $id)->first());
    }

    public function deleteCatalog(int $id): JsonResponse
    {
        $record = DB::table('catalogs')->where('id', $id)->first();
        abort_if($record === null, 404);
        DB::table('catalogs')->where('id', $id)->delete();
        if (is_string($record->image_path)) {
            $this->deleteCatalogImage($record->image_path);
        }

        return $this->deleted();
    }

    public function promotionsEvents(): JsonResponse
    {
        return $this->collection(
            DB::table('promos_events')->orderBy('sort_order')->orderBy('id')->get(),
        );
    }

    public function createPromotionEvent(Request $request): JsonResponse
    {
        $validated = $request->validate($this->promotionEventRules());
        $image = $validated['image'] ?? null;
        unset($validated['image']);
        $imagePath = $image instanceof UploadedFile ? $this->storePromotionEventImage($image) : null;

        if ($imagePath !== null) {
            $validated['banner_image'] = Storage::disk('public')->url($imagePath);
        }

        try {
            $id = DB::table('promos_events')->insertGetId([
                ...$validated,
                'created_by' => $request->user()->getAuthIdentifier(),
                'created_at' => now(),
            ]);
        } catch (\Throwable $exception) {
            if ($imagePath !== null) {
                Storage::disk('public')->delete($imagePath);
            }

            throw $exception;
        }

        return $this->record(DB::table('promos_events')->where('id', $id)->first(), 201);
    }

    public function updatePromotionEvent(Request $request, int $id): JsonResponse
    {
        $record = DB::table('promos_events')->where('id', $id)->first();
        abort_if($record === null, 404);

        $validated = $request->validate($this->promotionEventRules(true));
        $image = $validated['image'] ?? null;
        unset($validated['image']);
        $newImagePath = $image instanceof UploadedFile
            ? $this->storePromotionEventImage($image)
            : null;

        if ($newImagePath !== null) {
            $validated['banner_image'] = Storage::disk('public')->url($newImagePath);
        }

        try {
            DB::table('promos_events')->where('id', $id)->update($validated);
        } catch (\Throwable $exception) {
            if ($newImagePath !== null) {
                Storage::disk('public')->delete($newImagePath);
            }

            throw $exception;
        }

        if ($newImagePath !== null && is_string($record->banner_image)) {
            $this->deletePromotionEventImage($record->banner_image);
        }

        return $this->record(DB::table('promos_events')->where('id', $id)->first());
    }

    public function deletePromotionEvent(int $id): JsonResponse
    {
        $record = DB::table('promos_events')->where('id', $id)->first();
        abort_if($record === null, 404);
        DB::table('promos_events')->where('id', $id)->delete();
        if (is_string($record->banner_image)) {
            $this->deletePromotionEventImage($record->banner_image);
        }

        return $this->deleted();
    }

    public function partnerDescription(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => DB::table('company_profiles')->orderBy('id')->value('sponsors_description'),
        ]);
    }

    public function updatePartnerDescription(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'description' => ['required', 'string', 'max:1000'],
        ]);
        $profileId = DB::table('company_profiles')->orderBy('id')->value('id');
        $changes = [
            'sponsors_description' => $validated['description'],
            'updated_by' => $request->user()->getAuthIdentifier(),
            'updated_at' => now(),
        ];

        if ($profileId === null) {
            DB::table('company_profiles')->insert([
                ...$changes,
                'name' => 'Galaxy Waterpark',
            ]);
        } else {
            DB::table('company_profiles')->where('id', $profileId)->update($changes);
        }

        return $this->partnerDescription();
    }

    public function schedule(): JsonResponse
    {
        $profile = DB::table('company_profiles')->orderBy('id')->first();

        return $profile === null
            ? response()->json(['success' => true, 'data' => null])
            : $this->record($profile);
    }

    public function profile(): JsonResponse
    {
        $profile = DB::table('company_profiles')->orderBy('id')->first();

        return $profile === null
            ? response()->json(['success' => true, 'data' => null])
            : $this->record($profile);
    }

    public function updateProfile(Request $request): JsonResponse
    {
        $profileId = DB::table('company_profiles')->orderBy('id')->value('id');
        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'description' => ['sometimes', 'present', 'nullable', 'string', 'max:10000'],
            'whatsapp_number' => ['sometimes', 'present', 'nullable', 'string', 'max:30'],
            'image' => ['sometimes', 'required', ...$this->imageRules()],
        ]);

        $newImagePath = null;
        if ($request->hasFile('image')) {
            $newImagePath = $request->file('image')->store('public-information', 'public');
            $newImagePath = '/storage/'.$newImagePath;
        }

        if ($newImagePath !== null) {
            $validated['image_path'] = $newImagePath;
        }

        unset($validated['image']);
        if ($validated === []) {
            return response()->json([
                'success' => false,
                'message' => 'At least one profile field must be provided.',
            ], 422);
        }

        $validated['updated_by'] = $request->user()->getAuthIdentifier();
        $validated['updated_at'] = now();

        if ($profileId === null) {
            DB::table('company_profiles')->insert([
                'name' => $validated['name'] ?? 'Galaxy Waterpark',
                ...$validated,
            ]);
        } else {
            $oldImagePath = DB::table('company_profiles')->where('id', $profileId)->value('image_path');
            DB::table('company_profiles')->where('id', $profileId)->update($validated);
            if ($newImagePath !== null && $oldImagePath && $oldImagePath !== $newImagePath) {
                $this->deleteProfileImage($oldImagePath);
            }
        }

        return $this->profile();
    }

    public function updateSchedule(Request $request): JsonResponse
    {
        $profileId = DB::table('company_profiles')->orderBy('id')->value('id');
        $isInitialSetup = $profileId === null;
        $validated = $request->validate([
            'company_name' => $isInitialSetup ? ['sometimes', 'string', 'max:255'] : ['prohibited'],
            'operating_hours' => ['sometimes', 'present', 'nullable', 'string', 'max:5000'],
            'holiday_info' => ['sometimes', 'present', 'nullable', 'string', 'max:5000'],
        ]);

        unset($validated['company_name']);
        if ($validated === []) {
            return response()->json([
                'success' => false,
                'message' => 'At least one schedule field must be provided.',
            ], 422);
        }

        $validated['updated_by'] = $request->user()->getAuthIdentifier();
        $validated['updated_at'] = now();

        if ($isInitialSetup) {
            DB::table('company_profiles')->insert([
                ...$validated,
                'name' => $request->input('company_name', 'Galaxy Waterpark'),
            ]);
        } else {
            DB::table('company_profiles')->where('id', $profileId)->update($validated);
        }

        return $this->schedule();
    }

    public function tickets(): JsonResponse
    {
        return $this->collection(DB::table('ticket_prices')->orderBy('id')->get());
    }

    public function updateTicket(Request $request, int $id): JsonResponse
    {
        $ticket = DB::table('ticket_prices')->where('id', $id)->first();
        abort_if($ticket === null, 404);

        $validated = $request->validate([
            'category_name' => ['sometimes', 'required', 'string', 'max:255'],
            'price' => ['sometimes', 'required', 'numeric', 'min:0', 'max:9999999999.99'],
            'weekday_price' => ['sometimes', 'required', 'numeric', 'min:0', 'max:9999999999.99'],
            'weekend_price' => ['sometimes', 'required', 'numeric', 'min:0', 'max:9999999999.99'],
            'age_min' => ['sometimes', 'required', 'integer', 'min:0', 'max:120'],
            'age_max' => ['sometimes', 'present', 'nullable', 'integer', 'min:0', 'max:120'],
            'description' => ['sometimes', 'present', 'nullable', 'string', 'max:5000'],
            'is_active' => ['sometimes', 'required', 'boolean'],
        ]);

        if (array_key_exists('age_min', $validated) || array_key_exists('age_max', $validated)) {
            $ageMin = $validated['age_min'] ?? $ticket->age_min;
            $ageMax = array_key_exists('age_max', $validated)
                ? $validated['age_max']
                : $ticket->age_max;

            if (($ageMax !== null && $ageMin === null) || ($ageMin !== null && $ageMax !== null && $ageMax < $ageMin)) {
                throw ValidationException::withMessages([
                    'age_max' => 'The age range must have a minimum age and the maximum age cannot be lower.',
                ]);
            }
        }

        if ($validated === []) {
            return response()->json([
                'success' => false,
                'message' => 'At least one ticket field must be provided.',
            ], 422);
        }

        if (! array_key_exists('price', $validated) && array_key_exists('weekday_price', $validated)) {
            $validated['price'] = $validated['weekday_price'];
        }

        DB::table('ticket_prices')->where('id', $id)->update([
            ...$validated,
            'updated_by' => $request->user()->getAuthIdentifier(),
        ]);

        return $this->record(DB::table('ticket_prices')->where('id', $id)->first());
    }

    public function gallery(): JsonResponse
    {
        return $this->collection(DB::table('galleries')->orderBy('sort_order')->orderBy('id')->get());
    }

    public function createGalleryItem(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'image' => ['required', ...$this->imageRules()],
            ...$this->galleryMetadataRules(),
        ]);
        $path = $this->storeGalleryImage($validated['image']);
        unset($validated['image']);

        $id = DB::table('galleries')->insertGetId([
            ...$validated,
            'image_path' => Storage::disk('public')->url($path),
            'uploaded_by' => $request->user()->getAuthIdentifier(),
            'uploaded_at' => now(),
        ]);

        return $this->record(DB::table('galleries')->where('id', $id)->first(), 201);
    }

    public function updateGalleryItem(Request $request, int $id): JsonResponse
    {
        $record = DB::table('galleries')->where('id', $id)->first();
        abort_if($record === null, 404);

        $validated = $request->validate([
            'image' => ['sometimes', 'required', ...$this->imageRules()],
            ...$this->galleryMetadataRules(true),
        ]);
        $newPath = null;
        if (isset($validated['image'])) {
            $newPath = $this->storeGalleryImage($validated['image']);
            $validated['image_path'] = Storage::disk('public')->url($newPath);
        }
        unset($validated['image']);

        try {
            if ($validated !== []) {
                DB::table('galleries')->where('id', $id)->update($validated);
            }
        } catch (\Throwable $exception) {
            if ($newPath !== null) {
                Storage::disk('public')->delete($newPath);
            }

            throw $exception;
        }

        if ($newPath !== null) {
            $this->deleteGalleryImage($record->image_path);
        }

        return $this->record(DB::table('galleries')->where('id', $id)->first());
    }

    public function deleteGalleryItem(int $id): JsonResponse
    {
        $record = DB::table('galleries')->where('id', $id)->first();
        abort_if($record === null, 404);

        DB::table('galleries')->where('id', $id)->delete();
        $this->deleteGalleryImage($record->image_path);

        return $this->deleted();
    }

    private function catalogRules(bool $partial = false): array
    {
        return [
            'title' => $this->fieldRules($partial, 'required', 'string', 'max:100'),
            'type' => $this->fieldRules($partial, 'required', 'in:wahana,fasilitas,hydrotherapy'),
            'description' => $this->fieldRules($partial, 'present', 'nullable', 'string', 'max:10000'),
            'image' => ['sometimes', 'required', ...$this->imageRules()],
            'image_path' => ['sometimes', 'nullable', 'string', 'max:255'],
            'height_requirement' => $this->fieldRules($partial, 'present', 'nullable', 'string', 'max:5000'),
            'price' => $this->fieldRules($partial, 'present', 'nullable', 'numeric', 'min:0', 'max:9999999999.99'),
            'duration_minutes' => $this->fieldRules($partial, 'present', 'nullable', 'integer', 'min:1', 'max:65535'),
            'is_featured' => $this->fieldRules($partial, 'required', 'boolean'),
            'is_active' => $this->fieldRules($partial, 'required', 'boolean'),
            'sort_order' => $this->fieldRules($partial, 'required', 'integer', 'min:0', 'max:4294967295'),
        ];
    }

    private function promotionEventRules(bool $partial = false): array
    {
        return [
            'title' => $this->fieldRules($partial, 'required', 'string', 'max:100'),
            'type' => $this->fieldRules($partial, 'required', 'in:promo,event,sponsor'),
            'description' => $this->fieldRules($partial, 'present', 'nullable', 'string', 'max:10000'),
            'image' => ['sometimes', 'required', ...$this->imageRules()],
            'banner_image' => $this->fieldRules($partial, 'present', 'nullable', 'string', 'max:255'),
            'start_date' => $this->fieldRules($partial, 'present', 'nullable', 'date'),
            'end_date' => $this->fieldRules($partial, 'present', 'nullable', 'date', 'after_or_equal:start_date'),
            'terms' => $this->fieldRules($partial, 'present', 'nullable', 'string', 'max:10000'),
            'website_url' => $this->fieldRules($partial, 'present', 'nullable', 'url', 'max:255'),
            'is_active' => $this->fieldRules($partial, 'required', 'boolean'),
            'sort_order' => $this->fieldRules($partial, 'required', 'integer', 'min:0', 'max:4294967295'),
        ];
    }

    private function galleryMetadataRules(bool $partial = false): array
    {
        return [
            'title' => $this->fieldRules($partial, 'present', 'nullable', 'string', 'max:100'),
            'caption' => $this->fieldRules($partial, 'present', 'nullable', 'string', 'max:255'),
            'category' => $this->fieldRules($partial, 'required', 'string', 'max:50'),
            'is_active' => $this->fieldRules($partial, 'required', 'boolean'),
            'sort_order' => $this->fieldRules($partial, 'required', 'integer', 'min:0', 'max:4294967295'),
        ];
    }

    /**
     * Admin uploads are composed and compressed to WebP in the browser, so the
     * API only accepts decodable WebP files. No size cap is applied here; the
     * PHP/web server request limits remain the only ceiling.
     *
     * @return list<string>
     */
    private function imageRules(): array
    {
        return ['file', 'image', 'mimes:webp', 'mimetypes:image/webp'];
    }

    private function fieldRules(bool $partial, string ...$rules): array
    {
        return $partial ? ['sometimes', ...$rules] : $rules;
    }

    private function storeGalleryImage(UploadedFile $image): string
    {
        $path = $image->store('gallery', 'public');
        if ($path === false) {
            throw new \RuntimeException('The gallery image could not be stored.');
        }

        return $path;
    }

    private function storeCatalogImage(UploadedFile $image): string
    {
        $path = $image->store('catalog', 'public');
        if ($path === false) {
            throw new \RuntimeException('The catalog image could not be stored.');
        }

        return $path;
    }

    private function storePromotionEventImage(UploadedFile $image): string
    {
        $path = $image->store('promos-events', 'public');
        if ($path === false) {
            throw new \RuntimeException('The promotion or event image could not be stored.');
        }

        return $path;
    }

    private function deleteCatalogImage(string $imageUrl): void
    {
        $imagePath = parse_url($imageUrl, PHP_URL_PATH);
        if (is_string($imagePath) && Str::startsWith($imagePath, '/storage/catalog/')) {
            Storage::disk('public')->delete(Str::after($imagePath, '/storage/'));
        }
    }

    private function deleteGalleryImage(string $imageUrl): void
    {
        $imagePath = parse_url($imageUrl, PHP_URL_PATH);
        if (is_string($imagePath) && Str::startsWith($imagePath, '/storage/gallery/')) {
            Storage::disk('public')->delete(Str::after($imagePath, '/storage/'));
        }
    }

    private function deletePromotionEventImage(string $imageUrl): void
    {
        $imagePath = parse_url($imageUrl, PHP_URL_PATH);
        if (is_string($imagePath) && Str::startsWith($imagePath, '/storage/promos-events/')) {
            Storage::disk('public')->delete(Str::after($imagePath, '/storage/'));
        }
    }

    private function deleteProfileImage(string $imageUrl): void
    {
        $imagePath = parse_url($imageUrl, PHP_URL_PATH);
        if (is_string($imagePath) && Str::startsWith($imagePath, '/storage/public-information/')) {
            Storage::disk('public')->delete(Str::after($imagePath, '/storage/'));
        }
    }

    private function collection(iterable $records): JsonResponse
    {
        return response()->json(['success' => true, 'data' => $records]);
    }

    private function record(?object $record, int $status = 200): JsonResponse
    {
        return response()->json(['success' => true, 'data' => $record], $status);
    }

    private function deleted(): JsonResponse
    {
        return response()->json(['success' => true, 'message' => 'Content deleted successfully.']);
    }
}
