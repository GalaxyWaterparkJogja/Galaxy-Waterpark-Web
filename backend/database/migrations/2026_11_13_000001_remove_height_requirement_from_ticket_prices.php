<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('ticket_prices', 'height_requirement')) {
            Schema::table('ticket_prices', function (Blueprint $table): void {
                $table->dropColumn('height_requirement');
            });
        }
    }

    public function down(): void
    {
        if (! Schema::hasColumn('ticket_prices', 'height_requirement')) {
            Schema::table('ticket_prices', function (Blueprint $table): void {
                $table->text('height_requirement')->nullable();
            });
        }
    }
};
