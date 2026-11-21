<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $addAgeMin = ! Schema::hasColumn('ticket_prices', 'age_min');
        $addAgeMax = ! Schema::hasColumn('ticket_prices', 'age_max');

        if ($addAgeMin || $addAgeMax) {
            Schema::table('ticket_prices', function (Blueprint $table) use ($addAgeMin, $addAgeMax): void {
                if ($addAgeMin) {
                    $table->unsignedTinyInteger('age_min')->nullable();
                }

                if ($addAgeMax) {
                    $table->unsignedTinyInteger('age_max')->nullable();
                }
            });
        }

        foreach ([
            'bayi' => [1, 2],
            'anak' => [3, 10],
            'anak-anak' => [3, 10],
            'dewasa' => [11, 59],
            'lansia' => [61, null],
        ] as $category => [$ageMin, $ageMax]) {
            DB::table('ticket_prices')
                ->whereRaw('LOWER(TRIM(category_name)) = ?', [$category])
                ->whereNull('age_min')
                ->whereNull('age_max')
                ->update([
                    'age_min' => $ageMin,
                    'age_max' => $ageMax,
                ]);
        }
    }

    public function down(): void
    {
        $dropAgeMin = Schema::hasColumn('ticket_prices', 'age_min');
        $dropAgeMax = Schema::hasColumn('ticket_prices', 'age_max');

        if ($dropAgeMin || $dropAgeMax) {
            Schema::table('ticket_prices', function (Blueprint $table) use ($dropAgeMin, $dropAgeMax): void {
                $columns = [];

                if ($dropAgeMin) {
                    $columns[] = 'age_min';
                }

                if ($dropAgeMax) {
                    $columns[] = 'age_max';
                }

                $table->dropColumn($columns);
            });
        }
    }
};
