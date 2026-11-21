<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('company_profiles')) {
            Schema::create('company_profiles', function (Blueprint $table): void {
                $table->id();
                $table->string('name');
                $table->text('description')->nullable();
                $table->text('operating_hours')->nullable();
                $table->text('holiday_info')->nullable();
                $table->text('maps_embed_url')->nullable();
                $table->string('whatsapp_number', 30)->nullable();
                $table->unsignedBigInteger('updated_by')->nullable();
                $table->timestamp('updated_at')->nullable();
            });
        }

        if (! Schema::hasTable('ticket_prices')) {
            Schema::create('ticket_prices', function (Blueprint $table): void {
                $table->id();
                $table->string('category_name');
                $table->decimal('price', 12, 2);
                $table->text('height_requirement')->nullable();
                $table->text('description')->nullable();
                $table->unsignedBigInteger('updated_by')->nullable();
            });
        }
    }

    public function down(): void
    {
        if (! $this->tableWasBaselined('ticket_prices')) {
            Schema::dropIfExists('ticket_prices');
        }

        if (! $this->tableWasBaselined('company_profiles')) {
            Schema::dropIfExists('company_profiles');
        }
    }

    private function tableWasBaselined(string $tableName): bool
    {
        return Schema::hasTable('application_schema_baselines')
            && DB::table('application_schema_baselines')
                ->where('migration', '2026_10_01_000000_create_public_information_tables')
                ->where('table_name', $tableName)
                ->exists();
    }
};
