import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command, mode }) => ({
    plugins: [
        laravel({
            input: [
                'resources/css/app.css',
                'resources/js/app.jsx',
            ],
            refresh: true,
            // Enable SSR support
            ssr: true,
            ssrLoadModuleOptions: {
                // Don't externalize Inertia packages for SSR
                noExternal: ['@inertiajs/core', '@inertiajs/react'],
            },
        }),
        react(),
    ],
    resolve: {
        alias: {
            '@': '/resources/js',
        },
    },
    server: {
        host: '127.0.0.1',
        port: 5173,
        strictPort: true,
        hmr: {
            host: '127.0.0.1',
        },
    },
    optimizeDeps: {
        include: ['react', 'react-dom', '@inertiajs/core', '@inertiajs/react'],
    },
    build: {
        // Generate SSR manifest for Laravel
        ssrManifest: true,
    },
}));
