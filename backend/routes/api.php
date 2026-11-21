<?php

use App\Http\Controllers\AdminContentController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\PublicController;
use Illuminate\Support\Facades\Route;

Route::post('/admin/login', [AdminController::class, 'login'])
    ->middleware('throttle:admin-login');

Route::middleware(['auth:sanctum', 'abilities:admin:dashboard', 'admin', 'throttle:admin-dashboard'])
    ->prefix('admin')
    ->group(function (): void {
        Route::get('/dashboard', [AdminController::class, 'dashboard']);
        Route::get('/reviews', [AdminController::class, 'reviews']);
        Route::patch('/reviews/{id}', [AdminController::class, 'updateReviewStatus']);
        Route::get('/account', [AdminController::class, 'account']);
        Route::patch('/account', [AdminController::class, 'updateAccount']);
        Route::get('/company-contact', [AdminController::class, 'companyContact']);
        Route::patch('/company-contact', [AdminController::class, 'updateCompanyContact']);
        Route::get('/catalogs', [AdminContentController::class, 'catalogs']);
        Route::post('/catalogs', [AdminContentController::class, 'createCatalog']);
        Route::patch('/catalogs/{id}', [AdminContentController::class, 'updateCatalog']);
        Route::delete('/catalogs/{id}', [AdminContentController::class, 'deleteCatalog']);
        Route::get('/promos-events', [AdminContentController::class, 'promotionsEvents']);
        Route::post('/promos-events', [AdminContentController::class, 'createPromotionEvent']);
        Route::patch('/promos-events/{id}', [AdminContentController::class, 'updatePromotionEvent']);
        Route::delete('/promos-events/{id}', [AdminContentController::class, 'deletePromotionEvent']);
        Route::get('/partner-description', [AdminContentController::class, 'partnerDescription']);
        Route::patch('/partner-description', [AdminContentController::class, 'updatePartnerDescription']);
        Route::get('/profile', [AdminContentController::class, 'profile']);
        Route::post('/profile', [AdminContentController::class, 'updateProfile']);
        Route::get('/schedule', [AdminContentController::class, 'schedule']);
        Route::patch('/schedule', [AdminContentController::class, 'updateSchedule']);
        Route::get('/tickets', [AdminContentController::class, 'tickets']);
        Route::patch('/tickets/{id}', [AdminContentController::class, 'updateTicket']);
        Route::get('/gallery', [AdminContentController::class, 'gallery']);
        Route::post('/gallery', [AdminContentController::class, 'createGalleryItem']);
        Route::post('/gallery/{id}', [AdminContentController::class, 'updateGalleryItem']);
        Route::delete('/gallery/{id}', [AdminContentController::class, 'deleteGalleryItem']);
        Route::post('/logout', [AdminController::class, 'logout']);
    });

Route::middleware('throttle:public')->group(function (): void {
    Route::get('/public/home', [PublicController::class, 'home']);
    Route::get('/public/profile', [PublicController::class, 'profile']);
    Route::get('/public/tickets', [PublicController::class, 'tickets']);
    Route::get('/public/schedule', [PublicController::class, 'schedule']);
    Route::get('/public/attractions', [PublicController::class, 'attractions']);
    Route::get('/public/facilities', [PublicController::class, 'facilities']);
    Route::get('/public/hydrotherapy', [PublicController::class, 'hydrotherapy']);
    Route::get('/public/gallery', [PublicController::class, 'gallery']);
    Route::get('/public/gallery/{id}/image', [PublicController::class, 'galleryImage']);
    Route::get('/public/promotions', [PublicController::class, 'promotions']);
    Route::get('/public/events', [PublicController::class, 'events']);
    Route::get('/public/sponsors', [PublicController::class, 'sponsors']);
    Route::get('/public/partners', [PublicController::class, 'partners']);
    Route::get('/public/reviews', [PublicController::class, 'reviews']);
});

Route::post('/public/reviews', [PublicController::class, 'submitReview'])
    ->middleware('throttle:review-submissions');
