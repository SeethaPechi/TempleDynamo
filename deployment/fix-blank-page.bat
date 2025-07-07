@echo off
REM Quick Fix for TMS Blank Page Issue

echo ============================================
echo TMS Blank Page Quick Fix
echo ============================================

echo Current directory: %CD%

REM Step 1: Ensure we have the correct server file
if exist "server-standard-pg.js" (
    echo Copying server-standard-pg.js to server.js...
    copy server-standard-pg.js server.js
    echo ✅ Server file updated
) else (
    echo ❌ server-standard-pg.js not found
)

REM Step 2: Ensure we have the correct package.json
if exist "package-standard-pg.json" (
    echo Copying package-standard-pg.json to package.json...
    copy package-standard-pg.json package.json
    echo ✅ Package file updated
) else (
    echo ❌ package-standard-pg.json not found
)

REM Step 3: Install dependencies
echo Installing dependencies...
npm install --omit=dev
if %ERRORLEVEL% NEQ 0 (
    echo Installing core packages individually...
    npm install express pg helmet cors compression
)

REM Step 4: Create public directory with test page
if not exist "public" (
    echo Creating public directory...
    mkdir public
)

echo Creating test index.html...
echo ^<!DOCTYPE html^> > public\index.html
echo ^<html^>^<head^>^<title^>TMS Test^</title^>^</head^> >> public\index.html
echo ^<body^>^<h1^>TMS is working!^</h1^>^<p^>Server is running successfully.^</p^>^</body^>^</html^> >> public\index.html

REM Step 5: Test the server
echo Testing server startup...
start /min cmd /c "node server.js"
timeout 3 >nul

echo Testing HTTP response...
curl -s http://localhost:8080/ | findstr "TMS"
if %ERRORLEVEL% EQU 0 (
    echo ✅ Server is responding correctly
) else (
    echo ❌ Server not responding - check logs
)

echo.
echo Quick fix completed!
echo Try accessing: http://localhost:8080
echo.
pause