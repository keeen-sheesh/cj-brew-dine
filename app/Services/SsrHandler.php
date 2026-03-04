<?php

namespace App\Services;

use Illuminate\Support\Facades\File;
use Inertia\Inertia;

class SsrHandler
{
    /**
     * Check if SSR is enabled
     */
    public function isEnabled(): bool
    {
        return config('inertia.ssr.enabled', false) && $this->ssrBundleExists();
    }

    /**
     * Check if SSR bundle exists
     */
    public function ssrBundleExists(): bool
    {
        $path = public_path('assets/ssr.js');
        return file_exists($path);
    }

    /**
     * Render the page with SSR
     */
    public function render(string $page, array $props): string
    {
        if (!$this->isEnabled()) {
            return '';
        }

        $manifest = $this->getManifest();
        $ssrScript = public_path('assets/ssr.js');

        if (!file_exists($ssrScript)) {
            return '';
        }

        try {
            // For SSR, we'll return empty string and let client-side handle it
            // In production, you'd use a Node.js SSR server
            // This is a simplified approach for Laravel
            return '';
        } catch (\Exception $e) {
            report($e);
            return '';
        }
    }

    /**
     * Get the SSR manifest
     */
    protected function getManifest(): ?array
    {
        $manifestPath = public_path('assets/manifest.json');
        
        if (!file_exists($manifestPath)) {
            return null;
        }

        return json_decode(file_get_contents($manifestPath), true);
    }

    /**
     * Get asset URL with hot reload in development
     */
    public function getAssetUrl(string $path): string
    {
        if (app()->isLocal()) {
            return 'http://localhost:5173/' . ltrim($path, '/');
        }

        return asset($path);
    }

    /**
     * Get the SSR bundle URL
     */
    public function getSsrBundleUrl(): ?string
    {
        if (!$this->ssrBundleExists()) {
            return null;
        }

        return $this->getAssetUrl('assets/ssr.js');
    }
}
