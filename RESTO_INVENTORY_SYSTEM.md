# Restaurant Inventory Management System - Technical Documentation

## Overview

This is a full-stack Restaurant Inventory Management System built with:
- **Backend**: Laravel 11 with Eloquent ORM, Form Requests, Policies, and Queues
- **Frontend**: Inertia.js + React 19 with TypeScript
- **Styling**: Tailwind CSS with custom restaurant theme
- **Build Tools**: Vite configured via Laravel Vite Plugin

---

## Architecture

### Backend (Laravel 11)

#### Models
- **Item**: Menu items with stock tracking, pricing (single/dual), sizes support
- **Category**: Food categories with kitchen category support
- **Ingredient**: Raw ingredients for recipes
- **InventoryTransaction**: Stock movements (in, out, adjustment, damage, expired)
- **User**: Authentication with roles (Admin, Cashier, Kitchen)

#### API Controllers
- `ItemController` - CRUD operations, low stock alerts, stock updates
- `CategoryController` - Category management, kitchen categories
- `IngredientController` - Ingredient management
- `InventoryTransactionController` - Transaction history, summaries

#### Form Requests (Validation)
- `StoreItemRequest` / `UpdateItemRequest`
- `StoreCategoryRequest` / `UpdateCategoryRequest`
- `StoreIngredientRequest` / `UpdateIngredientRequest`
- `InventoryTransactionRequest`

#### Policies (Authorization)
- `ItemPolicy` - View, create, update, delete, updateStock
- `CategoryPolicy` - View, create, update, delete
- `IngredientPolicy` - View, create, update, delete
- `InventoryTransactionPolicy` - View, create, delete, viewAudit

#### Jobs (Queues)
- `LowStockNotification` - Alerts when items fall below threshold
- `OutOfStockAlert` - Critical alerts when items run out
- `InventoryTransactionNotification` - Logs all stock movements

---

### Frontend (Inertia.js + React)

#### Pages
- **InventoryDashboard** - Overview with KPIs, low stock alerts
- **InventoryManagement** - Full item list with search/filter
- **StockReport** - Detailed stock analytics
- **TransactionHistory** - Stock movement logs

#### Components
- **ItemTable** - Paginated items display with actions
- **StockStatusBadge** - Visual status indicators (critical/warning/normal)
- **StockProgressBar** - Stock level visualization
- **StockAdjustmentModal** - Stock in/out/adjustment interface

#### Utilities
- **useApi** - Custom hook for API calls
- **helpers** - Formatting utilities (currency, dates)

---

### Styling (Tailwind CSS)

Custom theme with restaurant brand colors:

```
javascript
// warm neutrals (resto)
resto: { 50: '#faf9f7', ..., 900: '#3d3932' }

// success (well-stocked)
success: { 50: '#f0fdf4', ..., 900: '#145231' }

// warning (low stock)
warning: { 50: '#fffbeb', ..., 900: '#78350f' }

// critical (out of stock)
critical: { 50: '#fef2f2', ..., 900: '#7f1d1d' }
```

---

## Server-Side Rendering (SSR) Configuration

### Vite Configuration
The project is configured for SSR with the following setup:

```javascript
// vite.config.js
export default defineConfig(({ mode }) => ({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.jsx'],
            refresh: true,
            ssr: true,
            ssrLoadModuleOptions: {
                noExternal: ['@inertiajs/core', '@inertiajs/react'],
            },
        }),
        react(),
    ],
    // ... other config
}));
```

### Environment Variables
To enable SSR in production:
```
env
INERTIA_SSR_ENABLED=true
INERTIA_SSR_URL=http://localhost:13714
INERTIA_SSR_TIMEOUT=60
```

### SSR Handler Service
Located at `app/Services/SsrHandler.php` - handles SSR rendering logic.

---

## Queue Configuration

The system uses database queues by default. To process jobs:

```
bash
# Start queue worker
php artisan queue:work

# Or with supervisor for production
php artisan queue:listen
```

### Queue Configuration (config/queue.php)
- Default: `database`
- Failed jobs: `database-uuids`

---

## API Endpoints

### Items
- `GET /api/items` - List all items (paginated, filterable)
- `POST /api/items` - Create new item
- `GET /api/items/{item}` - Get item details
- `PUT /api/items/{item}` - Update item
- `DELETE /api/items/{item}` - Delete item
- `GET /api/items/low-stock/list` - Get low stock items
- `PATCH /api/items/{item}/stock` - Quick stock update

### Categories
- `GET /api/categories` - List all categories
- `POST /api/categories` - Create category
- `GET /api/categories/active/all` - Get active categories
- `GET /api/categories/kitchen/list` - Kitchen categories

### Ingredients
- `GET /api/ingredients` - List all ingredients
- `POST /api/ingredients` - Create ingredient
- `GET /api/ingredients/low-stock/list` - Low stock alerts

### Transactions
- `GET /api/transactions` - List transactions (filterable)
- `POST /api/transactions` - Create transaction (adjusts stock)
- `GET /api/transactions/summary/generate` - Date range summary

---

## Getting Started

### Installation
```
bash
composer install
npm install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan db:seed  # Optional: seed demo data
```

### Development
```
bash
# Start Vite dev server
npm run dev

# Start Laravel server
php artisan serve

# Process queue (in separate terminal)
php artisan queue:listen
```

### Production Build
```
bash
npm run build
```

### Enable SSR (Production)
1. Build SSR bundle: `npm run build:ssr`
2. Set environment: `INERTIA_SSR_ENABLED=true`
3. Start SSR server (requires Node.js)

---

## Project Structure

```
cj-brew-dine/
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── Api/           # API Controllers
│   │   │   └── Admin/         # Page Controllers
│   │   ├── Middleware/
│   │   └── Requests/         # Form Requests
│   ├── Jobs/                  # Queue Jobs
│   ├── Models/               # Eloquent Models
│   ├── Policies/             # Authorization Policies
│   ├── Providers/            # Service Providers
│   └── Services/             # Business Logic
├── config/                   # Configuration files
├── database/
│   ├── migrations/           # Database migrations
│   └── seeders/             # Seeders
├── resources/
│   └── js/
│       ├── Components/       # React components
│       ├── Pages/            # Inertia pages
│       ├── hooks/            # Custom hooks
│       ├── types/            # TypeScript types
│       └── utils/            # Helper functions
├── routes/
│   ├── api.php              # API routes
│   └── web.php              # Web routes
└── vite.config.js           # Vite configuration
```

---

## Security Features

- **Authentication**: Laravel Sanctum
- **Authorization**: Policy-based access control
- **Validation**: Form Request validation
- **CSRF Protection**: Built-in Laravel
- **API Authentication**: Bearer tokens

---

## License

MIT License
