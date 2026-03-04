# Restaurant Inventory Management System

A comprehensive full-stack Restaurant Inventory Management System built with **Laravel 11**, **Inertia.js**, **React**, **TypeScript**, and **Tailwind CSS**.

## Table of Contents
- [Architecture Overview](#architecture-overview)
- [Project Structure](#project-structure)
- [Features](#features)
- [Installation & Setup](#installation--setup)
- [API Documentation](#api-documentation)
- [Frontend Components](#frontend-components)
- [Database Schema](#database-schema)
- [Authorization & Policies](#authorization--policies)
- [Queue Jobs](#queue-jobs)
- [Configuration](#configuration)
- [Development Workflow](#development-workflow)

## Architecture Overview

### Backend Stack
- **Framework**: Laravel 11
- **ORM**: Eloquent with relationships
- **Validation**: Form Requests with custom rules
- **Authorization**: Policies with role-based access control
- **Queuing**: Laravel Queue system with job processing
- **API**: RESTful JSON API with Sanctum authentication

### Frontend Stack
- **UI Framework**: React 19 with TypeScript
- **Routing**: Inertia.js (Server-Side Rendering ready)
- **Styling**: Tailwind CSS with custom restaurant theme
- **State Management**: React Hooks with custom useApi hook
- **Charts**: Recharts for data visualization
- **Icons**: Lucide React for modern iconography

### Build Tools
- **Bundler**: Vite with Laravel plugin
- **Node.js**: For build optimization and development

## Project Structure

### Backend
```
app/
├── Http/
│   ├── Controllers/
│   │   └── Api/
│   │       ├── ItemController.php          # Item CRUD & inventory
│   │       ├── CategoryController.php      # Category management
│   │       ├── IngredientController.php    # Ingredient management
│   │       └── InventoryTransactionController.php  # Transaction tracking
│   ├── Requests/
│   │   ├── StoreItemRequest.php
│   │   ├── UpdateItemRequest.php
│   │   ├── StoreCategoryRequest.php
│   │   ├── UpdateCategoryRequest.php
│   │   ├── StoreIngredientRequest.php
│   │   ├── UpdateIngredientRequest.php
│   │   └── InventoryTransactionRequest.php
│   └── Middleware/
├── Models/
│   ├── Item.php                    # Menu items with stock
│   ├── Category.php                # Item categories
│   ├── Ingredient.php              # Recipe ingredients
│   ├── InventoryTransaction.php    # Stock transactions
│   ├── Size.php                    # Item sizes
│   ├── ItemSize.php                # Item-size relationships
│   └── User.php                    # Users with roles
├── Policies/
│   ├── ItemPolicy.php              # Item authorization
│   ├── CategoryPolicy.php          # Category authorization
│   ├── IngredientPolicy.php        # Ingredient authorization
│   └── InventoryTransactionPolicy.php
└── Jobs/
    ├── LowStockNotification.php    # Low stock alerts
    ├── InventoryTransactionNotification.php
    └── OutOfStockAlert.php         # Critical stock alerts
```

### Frontend
```
resources/js/
├── hooks/
│   └── useApi.ts                   # Custom API call hook
├── utils/
│   ├── api.ts                      # Axios configuration
│   └── helpers.ts                  # Formatting & utility functions
├── types/
│   └── inventory.ts                # TypeScript definitions
├── Components/
│   ├── Inventory/
│   │   ├── StockStatusBadge.tsx    # Stock status display
│   │   ├── StockAdjustmentModal.tsx # Adjustment modal
│   │   └── ItemTable.tsx            # Items table component
│   └── ... (existing components)
└── Pages/
    └── Admin/
        ├── InventoryDashboard.jsx  # Main dashboard
        ├── InventoryManagement.jsx # Item management
        ├── TransactionHistory.jsx  # Transaction log
        └── StockReport.jsx         # Analytics & reports
```

## Features

### 1. **Inventory Dashboard**
- Real-time stock overview
- Low stock warnings
- Out of stock alerts
- Category-wise inventory summary
- Quick access to critical items

### 2. **Item Management**
- Full CRUD operations
- Multi-size support (Premium/Solo pricing)
- Category assignment
- Image uploads
- Stock tracking with thresholds
- Availability flags

### 3. **Stock Level Monitoring**
- Real-time stock quantities
- Low stock thresholds (configurable per item)
- Status indicators (Critical/Warning/OK)
- Quick stock adjustments
- Progress visualizations

### 4. **Inventory Transactions**
- Complete transaction history
- Multiple transaction types:
  - Stock In (purchases)
  - Stock Out (sales)
  - Adjustments
  - Damage/Waste
  - Expired items
- Date range filtering
- Audit trail with user tracking
- Reversible transactions (admin only)

### 5. **Analytics & Reporting**
- Stock movement charts
- Stock value distribution
- Low stock trending
- Export reports (CSV)
- Date range analysis
- Item-wise transaction summaries

### 6. **Category Management**
- Organize items by category
- Kitchen vs. customer-facing categories
- Active/inactive toggling
- Sortable displays

### 7. **Role-Based Access Control**
- Admin: Full system access
- Manager: Inventory management & analytics
- Kitchen: View stock, record transactions
- Cashier: View availability
- Customer: View menu

## Installation & Setup

### Prerequisites
- PHP 8.2+
- Node.js 18+
- MySQL/MariaDB
- Composer
- npm or yarn

### Step 1: Install Dependencies
```bash
# Backend dependencies
composer install

# Frontend dependencies
npm install
```

### Step 2: Environment Setup
```bash
# Copy environment example
cp .env.example .env

# Generate app key
php artisan key:generate

# Set up database
php artisan migrate
php artisan db:seed  # Optional: seed demo data
```

### Step 3: Build Frontend Assets
```bash
# Development build
npm run dev

# Production build
npm run build
```

### Step 4: Start Development Server
```bash
# Terminal 1: Laravel server
php artisan serve

# Terminal 2: Vite dev server
npm run dev

# Terminal 3: Queue worker (for notifications)
php artisan queue:listen

# All in one (requires concurrently):
npm run dev-server
```

## API Documentation

### Items Endpoints

#### List Items
```http
GET /api/items?page=1&per_page=15&search=coffee&category_id=1&is_available=true&low_stock=false
```

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Americano",
      "category_id": 1,
      "price": 75.00,
      "stock_quantity": 50,
      "low_stock_threshold": 10,
      ...
    }
  ],
  "meta": {
    "current_page": 1,
    "total": 100,
    "per_page": 15
  }
}
```

#### Create Item
```http
POST /api/items
Content-Type: application/json

{
  "name": "Cappuccino",
  "description": "Espresso with steamed milk",
  "category_id": 1,
  "price": 85.00,
  "stock_quantity": 100,
  "low_stock_threshold": 15,
  "is_available": true,
  "pricing_type": "single"
}
```

#### Update Item
```http
PUT /api/items/{id}
Content-Type: application/json

{
  "name": "Cappuccino",
  "stock_quantity": 90,
  ...
}
```

#### Get Low Stock Items
```http
GET /api/items/low-stock/list?per_page=15
```

#### Update Item Stock
```http
PATCH /api/items/{id}/stock
Content-Type: application/json

{
  "quantity": 85
}
```

### Categories Endpoints

#### List Categories
```http
GET /api/categories?page=1&is_active=true&is_kitchen_category=false
```

#### Get Active Categories Only
```http
GET /api/categories/active/all
```

#### Get Kitchen Categories
```http
GET /api/categories/kitchen/list
```

### Inventory Transactions Endpoints

#### List Transactions
```http
GET /api/transactions?page=1&item_id=1&type=in&start_date=2024-01-01&end_date=2024-01-31
```

#### Record Transaction
```http
POST /api/transactions
Content-Type: application/json

{
  "item_id": 1,
  "type": "in",
  "quantity": 50,
  "reference_type": "purchase",
  "notes": "Restocking from supplier",
  "transaction_date": "2024-01-15T10:30:00"
}
```

#### Get Transaction Summary
```http
GET /api/transactions/summary/generate?start_date=2024-01-01&end_date=2024-01-31
```

**Response:**
```json
[
  {
    "item_id": 1,
    "item_name": "Americano",
    "total_in": 500,
    "total_out": 450,
    "total_damage": 10,
    "total_expired": 5,
    "net_change": 35,
    "transaction_count": 12
  }
]
```

## Frontend Components

### StockStatusBadge
Display item stock status with visual indicators.

```jsx
<StockStatusBadge 
  quantity={item.stock_quantity}
  threshold={item.low_stock_threshold}
  showLabel={true}
/>
```

States:
- **Critical** (Red): Out of stock
- **Warning** (Yellow): Below threshold
- **Normal** (Green): Adequate stock

### StockAdjustmentModal
Modal for adjusting inventory stock.

```jsx
<StockAdjustmentModal
  isOpen={isOpen}
  itemName="Americano"
  currentStock={50}
  onClose={() => setIsOpen(false)}
  onSubmit={async (quantity, type, notes) => {
    // Handle adjustment
  }}
/>
```

### ItemTable
Display items in a sortable, filterable table.

```jsx
<ItemTable
  items={items}
  loading={loading}
  onEdit={(item) => handleEdit(item)}
  onDelete={(item) => handleDelete(item)}
  onAdjustStock={(item) => handleAdjustStock(item)}
/>
```

## Database Schema

### Items Table
```sql
CREATE TABLE items (
  id BIGINT PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  category_id BIGINT FOREIGN KEY,
  price DECIMAL(8,2),
  price_solo DECIMAL(8,2),
  price_whole DECIMAL(8,2),
  pricing_type ENUM('single', 'dual'),
  stock_quantity INTEGER DEFAULT 0,
  low_stock_threshold INTEGER DEFAULT 10,
  is_available BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  has_sizes BOOLEAN DEFAULT FALSE,
  sort_order INTEGER,
  image VARCHAR(255),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### InventoryTransactions Table
```sql
CREATE TABLE inventory_transactions (
  id BIGINT PRIMARY KEY,
  item_id BIGINT FOREIGN KEY,
  type ENUM('in', 'out', 'adjustment', 'damage', 'expired'),
  quantity INTEGER,
  quantity_before INTEGER,
  quantity_after INTEGER,
  reference_type ENUM('sale', 'purchase', 'manual', 'waste'),
  reference_id INTEGER,
  notes TEXT,
  user_id BIGINT FOREIGN KEY,
  transaction_date TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

## Authorization & Policies

### Role Hierarchy
```
Admin
  ├── Full system access
  ├── All CRUD operations
  └── User management

Manager
  ├── Inventory management
  ├── Category management
  ├── Transaction viewing & creation
  └── Report generation

Kitchen
  ├── View item availability
  ├── View ingredients
  ├── Record stock adjustments
  └── View transaction history

Cashier
  ├── View available items
  └── View categories

Customer
  └── View menu only
```

### Policy Examples

```php
// ItemPolicy
public function viewAny(User $user): bool {
    return $user->hasAnyRole(['Admin', 'Manager', 'Kitchen', 'Cashier']);
}

public function create(User $user): bool {
    return $user->hasAnyRole(['Admin', 'Manager', 'Kitchen']);
}

public function delete(User $user, Item $item): bool {
    return $user->hasAnyRole(['Admin', 'Manager']);
}
```

## Queue Jobs

### LowStockNotification
Triggered when item stock falls below threshold.

```php
// Triggered in InventoryTransactionController
InventoryTransactionNotification::dispatch($transaction);
```

**Actions:**
- Create audit log
- Send notifications to managers/admins
- Optionally send email/SMS

### OutOfStockAlert
Triggered when item reaches zero stock.

**Actions:**
- Create urgent audit log
- Update item availability flag
- Send critical alerts

## Configuration

### Model Configuration

Navigate Laravel config files to customize:

```php
// config/inventory.php
return [
    'low_stock_threshold' => 10,
    'enable_notifications' => true,
    'notification_methods' => ['email', 'sms'],
    'currency' => 'PHP',
];
```

### Tailwind Theme Colors

Custom restaurant theme colors (in `tailwind.config.cjs`):

```javascript
colors: {
    'resto': {
        50: '#faf9f7',
        900: '#3d3932',
    },
    'success': { /* Green for well-stocked */ },
    'warning': { /* Yellow for low stock */ },
    'critical': { /* Red for out of stock */ },
}
```

## Development Workflow

### 1. Creating a New API Endpoint

**Step 1: Create Migration**
```bash
php artisan make:migration create_new_table
```

**Step 2: Create Model**
```bash
php artisan make:model NewModel
```

**Step 3: Create Form Request**
```bash
php artisan make:request StoreNewRequest
```

**Step 4: Create Policy**
```bash
php artisan make:policy NewPolicy
```

**Step 5: Create Controller**
```bash
php artisan make:controller Api/NewController
```

**Step 6: Register Routes**
```php
// routes/api.php
Route::apiResource('new', NewController::class);
```

### 2. Creating a React Component

**TypeScript File (`.tsx`):**
```typescript
import React from 'react';
import { ComponentProps } from '@/types/inventory';

interface MyComponentProps {
  data: ComponentProps;
  onAction?: (item: any) => void;
}

export const MyComponent: React.FC<MyComponentProps> = ({
  data,
  onAction,
}) => {
  // Component logic
  return (
    <div className="bg-white rounded-lg p-4">
      {/* Markup */}
    </div>
  );
};
```

### 3. Adding a New Page

```typescript
// resources/js/Pages/Admin/MyPage.jsx
import AdminLayout from '@/Layouts/AdminLayout';
import { useApi } from '@/hooks/useApi';

export default function MyPage() {
  const { data, loading, get } = useApi();

  // Component logic

  return (
    <AdminLayout>
      {/* Page content */}
    </AdminLayout>
  );
}
```

## Best Practices

1. **API Calls**: Always use the `useApi()` hook for consistency
2. **Types**: Define TypeScript interfaces in `/types` directory
3. **Errors**: Handle errors gracefully and show user-friendly messages
4. **Validation**: Use Form Requests on backend for validation
5. **Authorization**: Check policies before sensitive operations
6. **Components**: Keep components small and focused (single responsibility)
7. **Styling**: Use Tailwind utilities + custom restaurant theme colors
8. **Performance**: Use pagination for large lists
9. **Accessibility**: Include proper labels and ARIA attributes
10. **Documentation**: Document complex business logic

## Support & Troubleshooting

### Common Issues

**CORS Errors**
- Ensure Sanctum is properly configured
- Check `config/cors.php`

**Database Errors**
- Run migrations: `php artisan migrate`
- Check database credentials in `.env`

**Build Errors**
- Clear cache: `npm run dev -- --force`
- Rebuild assets: `npm run build`

**Auth Errors**
- Login again
- Clear browser cache
- Check CSRF token in meta tags

## License

This project is licensed under the MIT License.

## Version

**Version**: 1.0.0  
**Last Updated**: 2026-02-26
