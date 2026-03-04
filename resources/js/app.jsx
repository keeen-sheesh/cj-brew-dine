import '../css/app.css';
import './bootstrap';

import { createInertiaApp } from '@inertiajs/react';
import { createRoot } from 'react-dom/client';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

// Import all pages eagerly - .jsx only
const pages = import.meta.glob('./Pages/**/*.jsx', { eager: true });

const resolvePage = (name) => {
    // Try different path formats
    const paths = [
        `./Pages/${name}.jsx`,
        `./Pages/${name}`,
    ];
    
    for (const path of paths) {
        if (pages[path]) {
            return pages[path];
        }
    }
    
    // Try case-insensitive match
    const availablePaths = Object.keys(pages);
    const normalizedName = name.toLowerCase().replace(/\//g, '');
    const match = availablePaths.find(p => {
        const pathNormalized = p.toLowerCase().replace(/[^a-z]/g, '');
        return pathNormalized.includes(normalizedName);
    });
    
    if (match) {
        return pages[match];
    }
    
    throw new Error(`Page not found: ${name}. Available pages: ${availablePaths.join(', ')}`);
};

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) => {
        const page = resolvePage(name);
        return page.default || page;
    },
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(<App {...props} />);
    },
    progress: {
        color: '#4B5563',
    },
});
