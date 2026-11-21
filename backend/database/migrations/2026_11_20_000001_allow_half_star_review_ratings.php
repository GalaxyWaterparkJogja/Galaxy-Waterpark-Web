<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('reviews') && Schema::hasColumn('reviews', 'rating')) {
            Schema::table('reviews', function (Blueprint $table): void {
                $table->decimal('rating', 2, 1)->unsigned()->change();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('reviews') && Schema::hasColumn('reviews', 'rating')) {
            Schema::table('reviews', function (Blueprint $table): void {
                $table->unsignedTinyInteger('rating')->change();
            });
        }
    }
};
