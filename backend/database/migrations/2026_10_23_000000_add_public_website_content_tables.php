<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $this->addColumnIfMissing('company_profiles', 'holiday_info', function (Blueprint $table): void {
            $table->text('holiday_info')->nullable();
        });
        $this->addColumnIfMissing('ticket_prices', 'is_active', function (Blueprint $table): void {
            $table->boolean('is_active')->default(true);
        });

        if (! Schema::hasTable('catalogs')) {
            Schema::create('catalogs', function (Blueprint $table): void {
                $table->id();
                $table->string('title', 100);
                $table->string('type', 30);
                $table->text('description')->nullable();
                $table->string('image_path')->nullable();
                $table->text('height_requirement')->nullable();
                $table->decimal('price', 12, 2)->nullable();
                $table->unsignedSmallInteger('duration_minutes')->nullable();
                $table->boolean('is_featured')->default(false);
                $table->boolean('is_active')->default(true);
                $table->unsignedInteger('sort_order')->default(0);
                $table->unsignedBigInteger('created_by')->nullable();
                $table->timestamp('created_at')->nullable();
            });
        } else {
            $this->addColumnIfMissing('catalogs', 'height_requirement', function (Blueprint $table): void {
                $table->text('height_requirement')->nullable();
            });
            $this->addColumnIfMissing('catalogs', 'price', function (Blueprint $table): void {
                $table->decimal('price', 12, 2)->nullable();
            });
            $this->addColumnIfMissing('catalogs', 'duration_minutes', function (Blueprint $table): void {
                $table->unsignedSmallInteger('duration_minutes')->nullable();
            });
            $this->addColumnIfMissing('catalogs', 'is_featured', function (Blueprint $table): void {
                $table->boolean('is_featured')->default(false);
            });
            $this->addColumnIfMissing('catalogs', 'is_active', function (Blueprint $table): void {
                $table->boolean('is_active')->default(true);
            });
            $this->addColumnIfMissing('catalogs', 'sort_order', function (Blueprint $table): void {
                $table->unsignedInteger('sort_order')->default(0);
            });
        }

        if (! Schema::hasTable('galleries')) {
            Schema::create('galleries', function (Blueprint $table): void {
                $table->id();
                $table->string('title', 100)->nullable();
                $table->string('image_path');
                $table->string('caption')->nullable();
                $table->boolean('is_active')->default(true);
                $table->unsignedInteger('sort_order')->default(0);
                $table->unsignedBigInteger('uploaded_by')->nullable();
                $table->timestamp('uploaded_at')->nullable();
            });
        } else {
            $this->addColumnIfMissing('galleries', 'is_active', function (Blueprint $table): void {
                $table->boolean('is_active')->default(true);
            });
            $this->addColumnIfMissing('galleries', 'sort_order', function (Blueprint $table): void {
                $table->unsignedInteger('sort_order')->default(0);
            });
        }

        if (! Schema::hasTable('promos_events')) {
            Schema::create('promos_events', function (Blueprint $table): void {
                $table->id();
                $table->string('title', 100);
                $table->string('type', 20);
                $table->text('description')->nullable();
                $table->string('banner_image')->nullable();
                $table->date('start_date')->nullable();
                $table->date('end_date')->nullable();
                $table->text('terms')->nullable();
                $table->string('website_url')->nullable();
                $table->boolean('is_active')->default(true);
                $table->unsignedInteger('sort_order')->default(0);
                $table->unsignedBigInteger('created_by')->nullable();
                $table->timestamp('created_at')->nullable();
            });
        } else {
            $this->addColumnIfMissing('promos_events', 'terms', function (Blueprint $table): void {
                $table->text('terms')->nullable();
            });
            $this->addColumnIfMissing('promos_events', 'website_url', function (Blueprint $table): void {
                $table->string('website_url')->nullable();
            });
            $this->addColumnIfMissing('promos_events', 'is_active', function (Blueprint $table): void {
                $table->boolean('is_active')->default(true);
            });
            $this->addColumnIfMissing('promos_events', 'sort_order', function (Blueprint $table): void {
                $table->unsignedInteger('sort_order')->default(0);
            });
        }

        if (! Schema::hasTable('reviews')) {
            Schema::create('reviews', function (Blueprint $table): void {
                $table->id();
                $table->string('reviewer_name', 100);
                $table->string('reviewer_email')->nullable();
                $table->unsignedTinyInteger('rating');
                $table->text('comment_text');
                $table->string('status', 20)->default('pending');
                $table->unsignedBigInteger('moderated_by')->nullable();
                $table->timestamp('created_at')->nullable();
                $table->timestamp('updated_at')->nullable();
            });
        } else {
            $this->addColumnIfMissing('reviews', 'updated_at', function (Blueprint $table): void {
                $table->timestamp('updated_at')->nullable();
            });
        }

    }

    public function down(): void
    {
        $this->dropColumnIfPresent('reviews', 'updated_at');
        $this->dropColumnIfPresent('promos_events', 'is_active');
        $this->dropColumnIfPresent('promos_events', 'sort_order');
        $this->dropColumnIfPresent('promos_events', 'website_url');
        $this->dropColumnIfPresent('promos_events', 'terms');
        $this->dropColumnIfPresent('galleries', 'sort_order');
        $this->dropColumnIfPresent('galleries', 'is_active');
        $this->dropColumnIfPresent('catalogs', 'sort_order');
        $this->dropColumnIfPresent('catalogs', 'is_active');
        $this->dropColumnIfPresent('catalogs', 'is_featured');
        $this->dropColumnIfPresent('catalogs', 'duration_minutes');
        $this->dropColumnIfPresent('catalogs', 'price');
        $this->dropColumnIfPresent('catalogs', 'height_requirement');
        $this->dropColumnIfPresent('ticket_prices', 'is_active');
        $this->dropColumnIfPresent('company_profiles', 'holiday_info');
    }

    private function addColumnIfMissing(string $tableName, string $columnName, Closure $definition): void
    {
        if (Schema::hasTable($tableName) && ! Schema::hasColumn($tableName, $columnName)) {
            Schema::table($tableName, $definition);
        }
    }

    private function dropColumnIfPresent(string $tableName, string $columnName): void
    {
        if (Schema::hasTable($tableName) && Schema::hasColumn($tableName, $columnName)) {
            Schema::table($tableName, function (Blueprint $table) use ($columnName): void {
                $table->dropColumn($columnName);
            });
        }
    }
};
