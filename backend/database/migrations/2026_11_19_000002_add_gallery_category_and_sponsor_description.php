<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('galleries') && ! Schema::hasColumn('galleries', 'category')) {
            Schema::table('galleries', function (Blueprint $table): void {
                $table->string('category', 50)->default('Wahana');
            });
        }

        if (Schema::hasTable('company_profiles') && ! Schema::hasColumn('company_profiles', 'sponsors_description')) {
            Schema::table('company_profiles', function (Blueprint $table): void {
                $table->text('sponsors_description')->nullable();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('company_profiles') && Schema::hasColumn('company_profiles', 'sponsors_description')) {
            Schema::table('company_profiles', function (Blueprint $table): void {
                $table->dropColumn('sponsors_description');
            });
        }

        if (Schema::hasTable('galleries') && Schema::hasColumn('galleries', 'category')) {
            Schema::table('galleries', function (Blueprint $table): void {
                $table->dropColumn('category');
            });
        }
    }
};
