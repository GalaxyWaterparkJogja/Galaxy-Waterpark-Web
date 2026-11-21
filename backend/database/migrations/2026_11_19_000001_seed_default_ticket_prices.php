<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('ticket_prices') || DB::table('ticket_prices')->exists()) {
            return;
        }

        DB::table('ticket_prices')->insert([
            [
                'category_name' => 'Bayi',
                'price' => 20000,
                'weekday_price' => 20000,
                'weekend_price' => 20000,
                'age_min' => 1,
                'age_max' => 2,
                'is_active' => true,
            ],
            [
                'category_name' => 'Anak',
                'price' => 35000,
                'weekday_price' => 35000,
                'weekend_price' => 40000,
                'age_min' => 3,
                'age_max' => 10,
                'is_active' => true,
            ],
            [
                'category_name' => 'Dewasa',
                'price' => 40000,
                'weekday_price' => 40000,
                'weekend_price' => 45000,
                'age_min' => 11,
                'age_max' => 59,
                'is_active' => true,
            ],
            [
                'category_name' => 'Lansia',
                'price' => 20000,
                'weekday_price' => 20000,
                'weekend_price' => 20000,
                'age_min' => 61,
                'age_max' => null,
                'is_active' => true,
            ],
        ]);
    }

    public function down(): void
    {
        // Keep ticket data, including any prices edited after seeding.
    }
};
