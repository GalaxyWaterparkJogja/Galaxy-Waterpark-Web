<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (! DB::table('promos_events')->where('type', 'sponsor')->exists()) {
            $partnerNames = [
                'The English Cut Clothing Company of Savile Row',
                'Swim Team Academy',
                'Aqua Club',
                'Jogja Swim',
                'Komunitas Olahraga Air Yogyakarta',
                'Pelangi Kids',
                'Sekolah Renang Generasi Sehat',
                'Wahana Sport',
                'Liburan Keluarga',
                'Galaxy Friends',
            ];
            $now = now();

            DB::table('promos_events')->insert(array_map(
                static fn (string $name, int $index): array => [
                    'title' => $name,
                    'type' => 'sponsor',
                    'description' => null,
                    'banner_image' => '/images/figma/landing/partner-academy.png',
                    'start_date' => null,
                    'end_date' => null,
                    'terms' => null,
                    'website_url' => null,
                    'is_active' => true,
                    'sort_order' => $index,
                    'created_at' => $now,
                ],
                $partnerNames,
                array_keys($partnerNames),
            ));
        }

        if (! DB::table('galleries')->exists()) {
            $photos = [
                [
                    'title' => 'Pengunjung menikmati kolam arus di Galaxy Waterpark',
                    'image_path' => '/images/figma/gallery/lazy-river.png',
                    'caption' => 'Pengunjung menikmati kolam arus di Galaxy Waterpark',
                ],
                [
                    'title' => 'Lengkungan air warna-warni di kolam bermain',
                    'image_path' => '/images/figma/gallery/water-arch.png',
                    'caption' => 'Lengkungan air warna-warni di kolam bermain',
                ],
                [
                    'title' => 'Anak-anak bermain di kolam dangkal dan perosotan',
                    'image_path' => '/images/figma/gallery/children-pool.png',
                    'caption' => 'Anak-anak bermain di kolam dangkal dan perosotan',
                ],
                [
                    'title' => 'Wahana keluarga dengan perosotan hijau dan ember tumpah',
                    'image_path' => '/images/figma/gallery/family.png',
                    'caption' => 'Wahana keluarga dengan perosotan hijau dan ember tumpah',
                ],
                [
                    'title' => 'Kolam arus dengan pelampung dan taman yang rindang',
                    'image_path' => '/images/figma/gallery/lazy-river.png',
                    'caption' => 'Kolam arus dengan pelampung dan taman yang rindang',
                ],
                [
                    'title' => 'Area bermain air dengan pancuran warna-warni',
                    'image_path' => '/images/figma/gallery/water-arch.png',
                    'caption' => 'Area bermain air dengan pancuran warna-warni',
                ],
                [
                    'title' => 'Area wahana dan kolam untuk liburan keluarga',
                    'image_path' => '/images/figma/gallery/family.png',
                    'caption' => 'Area wahana dan kolam untuk liburan keluarga',
                ],
            ];
            $now = now();

            DB::table('galleries')->insert(array_map(
                static fn (array $photo, int $index): array => [
                    ...$photo,
                    'category' => 'Wahana',
                    'is_active' => true,
                    'sort_order' => $index,
                    'uploaded_at' => $now,
                ],
                $photos,
                array_keys($photos),
            ));
        }
    }

    public function down(): void
    {
        // Keep records that may have been edited after their initial import.
    }
};
