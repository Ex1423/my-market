@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo.
echo  ========================================
echo     Shopping - Dev Server
echo  ========================================
echo.

where npm >nul 2>&1
if errorlevel 1 (
    echo  [ERROR] npm not found. Please install Node.js from https://nodejs.org
    echo.
    pause
    exit /b 1
)

if not exist "package.json" (
    echo  [ERROR] package.json not found. Run this from project root.
    echo.
    pause
    exit /b 1
)

if not exist "node_modules" (
    echo  [1/2] Installing dependencies...
    call npm install
    if errorlevel 1 (
        echo  [ERROR] npm install failed
        pause
        exit /b 1
    )
    echo  [OK] Dependencies installed
    echo.
)

echo  [START] Next.js dev server
echo.
echo  ----------------------------------------
echo   URL: http://localhost:3000
echo   Stop: Ctrl + C
echo  ----------------------------------------
echo.

npm run dev

echo.
echo  ----------------------------------------
echo   Server stopped
echo  ----------------------------------------
pause
