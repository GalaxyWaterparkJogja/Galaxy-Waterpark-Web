<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    private const IMAGE_PATHS = [
        '/images/figma/gallery/lazy-river.webp' => '/images/figma/gallery/lazy-river.png',
        '/images/figma/gallery/water-arch.webp' => '/images/figma/gallery/water-arch.png',
        '/images/figma/gallery/children-pool.webp' => '/images/figma/gallery/children-pool.png',
        '/images/figma/gallery/family.webp' => '/images/figma/gallery/family.png',
    ];

    public function up(): void
    {
        foreach (self::IMAGE_PATHS as $oldPath => $newPath) {
            DB::table('galleries')
                ->where('image_path', $oldPath)
                ->update(['image_path' => $newPath]);
        }
    }

    public function down(): void
    {
        foreach (self::IMAGE_PATHS as $oldPath => $newPath) {
            DB::table('galleries')
                ->where('image_path', $newPath)
                ->update(['image_path' => $oldPath]);
        }
    }
};
