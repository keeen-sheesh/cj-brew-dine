<?php

namespace App\Providers;

use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;
use Inertia\Inertia;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Register SSR handler
        $this->app->singleton(\App\Services\SsrHandler::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Configure Vite
        Vite::prefetch(concurrency: 3);

        // Configure Inertia
        $this->configureInertia();
    }

    /**
     * Configure Inertia for SSR support
     */
    protected function configureInertia(): void
    {
        // Set root view
        Inertia::setRootView('app');

        // Share app configuration
        Inertia::share([
            'app' => [
                'name' => config('app.name'),
                'env' => config('app.env'),
                'debug' => config('app.debug'),
            ],
        ]);
    }
}
