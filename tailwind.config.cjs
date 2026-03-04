/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: 'class',
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/**/*.blade.php',
        './resources/**/*.js',
        './resources/**/*.jsx',
        './resources/**/*.ts',
        './resources/**/*.tsx',
        './app/**/*.php',
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Figtree', "system-ui", "ui-sans-serif", "-apple-system"],
                serif: ['Merriweather', 'serif'],
                mono: ['Source Code Pro', 'monospace'],
            },
            colors: {
                // Restaurant brand colors - Warm neutrals
                'resto': {
                    50: '#faf9f7',
                    100: '#f5f3ef',
                    200: '#e8e4dd',
                    300: '#d4ccc2',
                    400: '#b8ada1',
                    500: '#a09588',
                    600: '#8b7d72',
                    700: '#6f6659',
                    800: '#584f46',
                    900: '#3d3932',
                },
                // Success - inventory well-stocked
                'success': {
                    50: '#f0fdf4',
                    100: '#dcfce7',
                    200: '#bbf7d0',
                    300: '#86efac',
                    400: '#4ade80',
                    500: '#22c55e',
                    600: '#16a34a',
                    700: '#15803d',
                    800: '#166534',
                    900: '#145231',
                },
                // Warning - low stock alert
                'warning': {
                    50: '#fffbeb',
                    100: '#fef3c7',
                    200: '#fde68a',
                    300: '#fcd34d',
                    400: '#fbbf24',
                    500: '#f59e0b',
                    600: '#d97706',
                    700: '#b45309',
                    800: '#92400e',
                    900: '#78350f',
                },
                // Critical - out of stock/urgent
                'critical': {
                    50: '#fef2f2',
                    100: '#fee2e2',
                    200: '#fecaca',
                    300: '#fca5a5',
                    400: '#f87171',
                    500: '#ef4444',
                    600: '#dc2626',
                    700: '#b91c1c',
                    800: '#991b1b',
                    900: '#7f1d1d',
                },
                // Deprecated: old colors (kept for reference)
                'cj-gold': '#D5A724',
                'cj-dark-gold': '#B8951E',
                'cj-blue': '#3498db',
                'cj-red': '#e74c3c',
                'cj-green': '#2ecc71',
            },
            backgroundColor: {
                'resto-light': '#faf9f7',
                'resto-dark': '#1f1d1a',
            },
            textColor: {
                'resto-dark': '#3d3932',
                'resto-light': '#faf9f7',
            },
            borderColor: (theme) => ({
                ...theme('colors'),
                'resto-border': '#d4ccc2',
            }),
            ringColor: (theme) => ({
                ...theme('colors'),
                DEFAULT: '#a09588',
            }),
            spacing: {
                '128': '32rem',
                '144': '36rem',
            },
            maxWidth: {
                '7xl': '80rem',
                '8xl': '88rem',
            },
            backdropBlur: {
                'xs': '2px',
            },
            shadows: {
                'card': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
                'subtle': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
            },
            animation: {
                'spin-slow': 'spin 3s linear infinite',
                'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            },
            transitionDuration: {
                '250': '250ms',
            },
        },
    },
    safelist: [
        // Dynamic color classes
        'bg-success-50',
        'bg-success-100',
        'bg-warning-50',
        'bg-warning-100',
        'bg-critical-50',
        'bg-critical-100',
        'text-success-700',
        'text-warning-700',
        'text-critical-700',
        'border-success-300',
        'border-warning-300',
        'border-critical-300',
    ],
    plugins: [
        require('@tailwindcss/forms'),
        require('@tailwindcss/typography'),
        // Custom rounded corners plugin
        function({ addUtilities }) {
            addUtilities({
                '.rounded-restaurant': {
                    borderRadius: '0.5rem',
                },
                '.shadow-elevated': {
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                },
            });
        },
    ],
}