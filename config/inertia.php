<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Server-Side Rendering
    |--------------------------------------------------------------------------
    |
    | This option controls whether Inertia renders pages on the server using
    | server-side rendering. This can improve performance for users on slower
    | devices and provides better SEO. However, it requires a Node.js server
    | running the SSR bundle.
    |
    */
    'ssr' => [
        'enabled' => env('INERTIA_SSR_ENABLED', false),
        'url' => env('INERTIA_SSR_URL', 'http://localhost:13714'),
        'timeout' => env('INERTIA_SSR_TIMEOUT', 60),
    ],

    /*
    |--------------------------------------------------------------------------
    | Asset Versioning
    |--------------------------------------------------------------------------
    |
    | The current asset version. This is used by Inertia to determine whether
    | the asset has changed. If you're using version control, you can set
    | this to the hash of the latest commit.
    |
    */
    'version' => env('INERTIA_VERSION', null),

    /*
    |--------------------------------------------------------------------------
    | Default Options
    |--------------------------------------------------------------------------
    |
    | Here you can configure default options for Inertia requests. These will
    | be used for all Inertia responses unless overridden on the page level.
    |
    */
    'defaults' => [
        'auth' => [
            'user' => null,
        ],
        'csrf_token' => null,
    ],
];
