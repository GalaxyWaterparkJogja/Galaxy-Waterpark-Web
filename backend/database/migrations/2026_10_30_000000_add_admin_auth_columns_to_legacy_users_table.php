<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('users')) {
            throw new RuntimeException('The users table must exist before admin authentication can be enabled.');
        }

        $addUsername = ! Schema::hasColumn('users', 'username');
        $addPasswordHash = ! Schema::hasColumn('users', 'password_hash');

        if ($addUsername && ! Schema::hasColumn('users', 'name')) {
            throw new RuntimeException('Cannot add admin authentication: users has no username or name column.');
        }

        if ($addPasswordHash && ! Schema::hasColumn('users', 'password')) {
            throw new RuntimeException('Cannot add admin authentication: users has no password_hash or password column.');
        }

        if (! $addUsername && ! $addPasswordHash) {
            return;
        }

        Schema::table('users', function (Blueprint $table) use ($addUsername, $addPasswordHash): void {
            if ($addUsername) {
                $table->string('username', 50)->nullable();
            }

            if ($addPasswordHash) {
                $table->string('password_hash')->nullable();
            }
        });

        if ($addUsername) {
            DB::table('users')
                ->whereNull('username')
                ->update(['username' => DB::raw('name')]);
        }

        if ($addPasswordHash) {
            DB::table('users')
                ->whereNull('password_hash')
                ->update(['password_hash' => DB::raw('password')]);
        }
    }

    public function down(): void
    {
        // Keep migrated credentials intact when rolling back application migrations.
    }
};
