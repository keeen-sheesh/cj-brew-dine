# Fix Inventory System 404 Errors

## Issues:
1. Page resolution mismatch - app.jsx looks for .jsx files but inventory pages are .tsx
2. API 404 errors - /api/items endpoint not found

## Steps:

### Step 1: Fix app.jsx page resolution
- [x] Update app.jsx to support both .jsx and .tsx files
- [x] Change glob pattern to include all file extensions

### Step 2: Clear Laravel caches
- [x] Clear route cache
- [x] Clear config cache
- [x] Clear view cache

### Step 3: Verify API routes are loaded
- [x] Check RouteServiceProvider loads api.php
- [ ] Test API endpoints


### Step 4: Test the fixes
- [ ] Test inventory pages load without 404
- [ ] Test API endpoints return data
