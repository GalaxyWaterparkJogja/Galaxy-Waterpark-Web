<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (! Schema::hasTable('users')) {
            Schema::create('users', function (Blueprint $table) {
                $table->id();
                $table->string('username', 50);
                $table->string('email', 100)->unique();
                $table->string('password_hash');
                $table->timestamp('created_at')->useCurrent();
            });
        }

        if (! Schema::hasTable('password_reset_tokens')) {
            Schema::create('password_reset_tokens', function (Blueprint $table) {
                $table->string('email')->primary();
                $table->string('token');
                $table->timestamp('created_at')->nullable();
            });
        }

        if (! Schema::hasTable('sessions')) {
            Schema::create('sessions', function (Blueprint $table) {
                $table->string('id')->primary();
                $table->foreignId('user_id')->nullable()->index();
                $table->string('ip_address', 45)->nullable();
                $table->text('user_agent')->nullable();
                $table->longText('payload');
                $table->integer('last_activity')->index();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (! $this->tableWasBaselined('users')) {
            Schema::dropIfExists('users');
        }
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('sessions');
    }

    private function tableWasBaselined(string $tableName): bool
    {
        return Schema::hasTable('application_schema_baselines')
            && DB::table('application_schema_baselines')
                ->where('migration', '0001_01_01_000000_create_users_table')
                ->where('table_name', $tableName)
                ->exists();
    }
};
