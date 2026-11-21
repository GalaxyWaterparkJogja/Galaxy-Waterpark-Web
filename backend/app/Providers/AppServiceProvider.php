<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        RateLimiter::for('public', function (Request $request) {
            return Limit::perMinutes(15, 100)->by($request->ip());
        });

        RateLimiter::for('review-submissions', function (Request $request) {
            return Limit::perMinutes(15, 5)->by($request->ip());
        });

        RateLimiter::for('admin-login', function (Request $request) {
            $email = Str::lower((string) $request->input('email', ''));

            return Limit::perMinutes(15, 5)->by($request->ip().'|'.$email);
        });

        RateLimiter::for('admin-dashboard', function (Request $request) {
            return Limit::perMinutes(15, 100)->by((string) $request->user()?->getAuthIdentifier());
        });
    }
}
