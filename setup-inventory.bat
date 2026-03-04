@echo off
REM Restaurant Inventory Management System - Windows Setup Script

echo.
echo ==========================================
echo Restaurant Inventory Management System
echo Quick Setup for Windows
echo ==========================================
echo.

REM Step 1: Install dependencies
echo [Step 1] Installing dependencies...
echo Installing PHP dependencies...
call composer install

echo Installing Node dependencies...
call npm install

echo Done!
echo.

REM Step 2: Environment setup
echo [Step 2] Setting up environment...
if not exist .env (
    echo Copying .env.example to .env...
    copy .env.example .env
    echo [OK] .env file created
) else (
    echo [!] .env file already exists
)
echo.

REM Step 3: Generate app key
echo [Step 3] Generating application key...
call php artisan key:generate
echo.

REM Step 4: Database setup
echo [Step 4] Setting up database...
call php artisan migrate --force
echo [OK] Database migrations completed
echo.

REM Step 5: Build frontend
echo [Step 5] Building frontend assets...
call npm run build
echo [OK] Frontend build completed
echo.

echo.
echo ==========================================
echo [SUCCESS] Setup Complete!
echo ==========================================
echo.
echo Next Steps:
echo.
echo Option 1 - Run services separately:
echo   Terminal 1: php artisan serve
echo   Terminal 2: npm run dev
echo   Terminal 3: php artisan queue:listen
echo.
echo Option 2 - Run all together:
echo   npm run dev-server (requires concurrently package)
echo.
echo ==========================================
echo Access Information:
echo ==========================================
echo URL: http://localhost:8000
echo API: http://localhost:8000/api
echo.
echo Default Admin Credentials:
echo Email: admin@example.com
echo Role: Admin
echo.
echo Documentation: Read INVENTORY_SYSTEM_DOCS.md
echo.
pause
