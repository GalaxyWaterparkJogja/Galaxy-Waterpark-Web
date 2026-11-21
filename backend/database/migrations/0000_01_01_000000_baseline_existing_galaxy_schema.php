<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('application_schema_baselines')) {
            Schema::create('application_schema_baselines', function (Blueprint $table): void {
                $table->string('migration');
                $table->string('table_name');
                $table->primary(['migration', 'table_name']);
            });
        }

        if (
            Schema::hasTable('users')
            && (
                (Schema::hasColumn('users', 'username') && Schema::hasColumn('users', 'password_hash'))
                || (Schema::hasColumn('users', 'name') && Schema::hasColumn('users', 'password'))
            )
        ) {
            $this->markExistingTable('0001_01_01_000000_create_users_table', 'users');
        }

        foreach (['company_profiles', 'ticket_prices'] as $tableName) {
            if (Schema::hasTable($tableName)) {
                $this->markExistingTable('2026_10_01_000000_create_public_information_tables', $tableName);
            }
        }
    }

    public function down(): void
    {
        // Keep ownership markers so rolling back the original migrations cannot delete pre-existing tables.
    }

    private function markExistingTable(string $migration, string $tableName): void
    {
        DB::table('application_schema_baselines')->insertOrIgnore([
            'migration' => $migration,
            'table_name' => $tableName,
        ]);
    }
};
