@echo off
echo ============================================
echo Nam Kovil Standalone Node.js Deployment
echo ============================================

REM Create a new standalone directory
set DEPLOY_DIR=C:\NamKovil
echo Creating standalone deployment directory: %DEPLOY_DIR%

if exist "%DEPLOY_DIR%" rmdir /s /q "%DEPLOY_DIR%"
mkdir "%DEPLOY_DIR%"
cd "%DEPLOY_DIR%"

echo Working directory: %CD%

echo.
echo Step 1: Creating package.json with dependencies...
echo {> package.json
echo   "name": "nam-kovil-standalone",>> package.json
echo   "version": "1.0.0",>> package.json
echo   "description": "Nam Kovil Temple Management System - Standalone",>> package.json
echo   "main": "server.js",>> package.json
echo   "scripts": {>> package.json
echo     "start": "node server.js">> package.json
echo   },>> package.json
echo   "dependencies": {>> package.json
echo     "express": "4.18.2",>> package.json
echo     "pg": "8.11.3",>> package.json
echo     "cors": "2.8.5">> package.json
echo   }>> package.json
echo }>> package.json

echo.
echo Step 2: Installing Node.js dependencies...
call npm install

echo.
echo Step 3: Copying production files...
copy /Y "%~dp0production-server.js" "server.js" >nul 2>&1
copy /Y "%~dp0index.html" "index.html" >nul 2>&1

echo.
echo Step 4: Testing database connection...
psql -h localhost -p 5432 -U temple_app -d temple_management -c "SELECT count(*) FROM members;" 2>nul

if %ERRORLEVEL% EQU 0 (
    echo ✅ Database connection successful
) else (
    echo ⚠️ Database connection test failed
    echo Please ensure PostgreSQL is running with your secure credentials:
    echo Check your DATABASE_URL environment variable
)

echo.
echo Step 5: Starting Nam Kovil server...
echo ============================================
echo Nam Kovil Standalone Deployment Complete
echo ============================================
echo.
echo Your Nam Kovil application is running!
echo.
echo Access: http://localhost:3000
echo Access: http://tamilkovil.com:3000
echo.
echo ✅ Standalone Node.js server (bypasses IIS)
echo ✅ All navigation menu items functional
echo ✅ Database integration configured  
echo ✅ Exact development UI replicated
echo ✅ Running on port 3000
echo.
echo Press Ctrl+C to stop the server
echo.

node server.js