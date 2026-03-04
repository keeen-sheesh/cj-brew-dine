## 🍽️ Restaurant Inventory Management System - QUICK START

### ⚡ 5-Minute Setup

#### Windows Users:
```batch
setup-inventory.bat
```

#### Linux/Mac Users:
```bash
chmod +x setup-inventory.sh
./setup-inventory.sh
```

#### Manual Setup:
```bash
# 1. Install dependencies
composer install
npm install

# 2. Configure environment
cp .env.example .env
php artisan key:generate

# 3. Setup database
php artisan migrate

# 4. Build frontend
npm run build
```

---

### ✅ What Was Built For You

**Backend (Laravel 11)**
- 4 REST API Controllers (Items, Categories, Ingredients, Transactions)
- 7 Form Requests with validation
- 4 Authorization Policies
- 3 Queue Jobs for notifications
- Complete database models

**Frontend (React + TypeScript)**
- 4 Full pages (Dashboard, Management, History, Reports)
- 4 Reusable components
- Custom API hook
- Tailwind CSS with restaurant theme

**Documentation**
- `INVENTORY_SYSTEM_DOCS.md` - Complete documentation
- `API_TESTING_GUIDE.md` - 50+ API examples
- `IMPLEMENTATION_SUMMARY.md` - What was created

---

### 🚀 Running The System

#### Option 1: Separate Terminals (Recommended for Dev)
```bash
# Terminal 1
php artisan serve

# Terminal 2
npm run dev

# Terminal 3
php artisan queue:listen
```

#### Option 2: Single Command
```bash
npm run dev-server  # All three in one (requires concurrently)
```

#### Access:
- 🌐 **App**: `http://localhost:8000`
- 🔌 **API**: `http://localhost:8000/api`

---

### 📌 Key Endpoints

**Items**
```
GET    /api/items                    - List items
POST   /api/items                    - Create item
PATCH  /api/items/{id}/stock         - Update stock
GET    /api/items/low-stock/list     - Low stock items
```

**Transactions**
```
GET    /api/transactions             - List transactions
POST   /api/transactions             - Record transaction
GET    /api/transactions/summary/generate - Analytics
```

**Categories**
```
GET    /api/categories               - List categories
GET    /api/categories/active/all    - Active only
```

**Full list**: See `API_TESTING_GUIDE.md`

---

### 🎨 Pages Created

1. **Dashboard** (`/admin/inventory`)
   - KPI cards, alerts, category overview

2. **Inventory Management** (`/admin/inventory-management`)
   - Item list, search, stock adjustment

3. **Transaction History** (`/admin/transactions`)
   - Transaction log, filtering, export

4. **Stock Report** (`/admin/reports`)
   - Charts, analytics, low stock summary

---

### 🔐 Default Login Configuration

Configure in your `.env` or database:
```
Email: admin@example.com
Role: admin
```

---

### 📚 Read More

**First Time?**
→ Read: `IMPLEMENTATION_SUMMARY.md`

**Want API Details?**
→ Read: `API_TESTING_GUIDE.md`

**Full Documentation?**
→ Read: `INVENTORY_SYSTEM_DOCS.md`

---

### 🆘 Troubleshooting

**Database Error?**
```bash
php artisan migrate
php artisan migrate:refresh  # Reset (deletes data!)
```

**Node/npm Error?**
```bash
npm install
npm run dev
```

**'js' files not found?**
```bash
npm run build
# Then restart `php artisan serve`
```

**Port 8000 already in use?**
```bash
php artisan serve --port=8001
```

**Queue not working?**
```bash
php artisan queue:listen --tries=1
```

---

### 🎯 Next Steps

1. ✅ Run setup script (or manual setup above)
2. ✅ Start the three services
3. ✅ Access `http://localhost:8000`
4. ✅ Login with your admin credentials
5. ✅ Explore the inventory dashboard
6. ✅ Read `API_TESTING_GUIDE.md` for examples

---

### 💡 Tips

- **TypeScript**: All frontend code is `.tsx`/`.ts` for better type safety
- **Tailwind**: Use custom colors like `resto-500`, `warning-500`, `critical-500`
- **API**: All endpoints return JSON with pagination
- **Auth**: Use Sanctum tokens for API calls
- **Roles**: Admin > Manager > Kitchen > Cashier > Customer

---

### 📞 Need Help?

1. Check `INVENTORY_SYSTEM_DOCS.md` (Troubleshooting section)
2. Review `API_TESTING_GUIDE.md` for examples
3. Check `app/Http/Controllers/Api/*` for implementation details
4. Review `resources/js/Pages/Admin/*` for React patterns

---

**Status**: ✅ Ready to Use

Start with: `php artisan serve` + `npm run dev`

Then visit: `http://localhost:8000`

Enjoy! 🎉
