<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('company_profiles') && ! Schema::hasColumn('company_profiles', 'image_path')) {
            Schema::table('company_profiles', function (Blueprint $table): void {
                $table->string('image_path')->nullable();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('company_profiles') && Schema::hasColumn('company_profiles', 'image_path')) {
            Schema::table('company_profiles', function (Blueprint $table): void {
                $table->dropColumn('image_path');
            });
        }
    }
};
