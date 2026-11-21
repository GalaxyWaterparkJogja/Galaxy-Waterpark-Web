<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('ticket_prices')) {
            return;
        }

        Schema::table('ticket_prices', function (Blueprint $table): void {
            if (! Schema::hasColumn('ticket_prices', 'weekday_price')) {
                $table->decimal('weekday_price', 12, 2)->nullable();
            }
            if (! Schema::hasColumn('ticket_prices', 'weekend_price')) {
                $table->decimal('weekend_price', 12, 2)->nullable();
            }
        });

        DB::table('ticket_prices')
            ->whereNull('weekday_price')
            ->update(['weekday_price' => DB::raw('price')]);
        DB::table('ticket_prices')
            ->whereNull('weekend_price')
            ->update(['weekend_price' => DB::raw('price')]);
    }

    public function down(): void
    {
        if (! Schema::hasTable('ticket_prices')) {
            return;
        }

        Schema::table('ticket_prices', function (Blueprint $table): void {
            $columns = [];
            if (Schema::hasColumn('ticket_prices', 'weekday_price')) {
                $columns[] = 'weekday_price';
            }
            if (Schema::hasColumn('ticket_prices', 'weekend_price')) {
                $columns[] = 'weekend_price';
            }
            if ($columns !== []) {
                $table->dropColumn($columns);
            }
        });
    }
};
