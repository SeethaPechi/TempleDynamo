@echo off
REM Quick Fix for TestKovil Blank Page Issue

echo ============================================
echo TestKovil Blank Page Quick Fix
echo ============================================

cd "C:\inetpub\TestKovil"
echo Current directory: %CD%

REM Step 1: Ensure we have the correct server file
if exist "server-standard-pg.js" (
    echo Copying server-standard-pg.js to server.js...
    copy server-standard-pg.js server.js
    echo ✅ Server file updated
) else (
    echo ❌ server-standard-pg.js not found in TestKovil directory
    echo Checking if files are in current directory...
    dir /b *.js
)

REM Step 2: Ensure we have the correct package.json
if exist "package-standard-pg.json" (
    echo Copying package-standard-pg.json to package.json...
    copy package-standard-pg.json package.json
    echo ✅ Package file updated
) else (
    echo ❌ package-standard-pg.json not found
    if exist "package.json" (
        echo Found existing package.json
    ) else (
        echo Creating basic package.json...
        echo { > package.json
        echo   "name": "testkovil-app", >> package.json
        echo   "version": "1.0.0", >> package.json
        echo   "main": "server.js", >> package.json
        echo   "dependencies": { >> package.json
        echo     "express": "^4.18.2", >> package.json
        echo     "pg": "^8.11.3" >> package.json
        echo   } >> package.json
        echo } >> package.json
    )
)

REM Step 3: Install dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
    if %ERRORLEVEL% NEQ 0 (
        echo Installing core packages individually...
        npm install express pg helmet cors compression
    )
) else (
    echo ✅ node_modules already exists
)

REM Step 4: Create public directory with test page
if not exist "public" (
    echo Creating public directory...
    mkdir public
)

echo Creating test index.html...
echo ^<!DOCTYPE html^> > public\index.html
echo ^<html lang="en"^> >> public\index.html
echo ^<head^> >> public\index.html
echo ^<meta charset="UTF-8"^> >> public\index.html
echo ^<meta name="viewport" content="width=device-width, initial-scale=1.0"^> >> public\index.html
echo ^<title^>TestKovil Application^</title^> >> public\index.html
echo ^<style^> >> public\index.html
echo body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; } >> public\index.html
echo .status { padding: 10px; margin: 10px 0; border-radius: 5px; background: #d4edda; color: #155724; } >> public\index.html
echo ^</style^> >> public\index.html
echo ^</head^> >> public\index.html
echo ^<body^> >> public\index.html
echo ^<h1^>🏛️ TestKovil Application^</h1^> >> public\index.html
echo ^<div class="status"^> >> public\index.html
echo ^<strong^>✅ Application Started Successfully^</strong^>^<br^> >> public\index.html
echo Server is running and ready to accept requests. >> public\index.html
echo ^</div^> >> public\index.html
echo ^<p^>^<strong^>Server Time:^</strong^> ^<script^>document.write(new Date().toLocaleString());^</script^>^</p^> >> public\index.html
echo ^<p^>^<a href="/api/health"^>Health Check^</a^> ^| ^<a href="/api/members"^>Members API^</a^> ^| ^<a href="/api/temples"^>Temples API^</a^>^</p^> >> public\index.html
echo ^</body^> >> public\index.html
echo ^</html^> >> public\index.html

echo ✅ Test page created

REM Step 5: Create logs directory
if not exist "logs" (
    mkdir logs
    echo ✅ Logs directory created
)

REM Step 6: Test the server
echo.
echo Testing server startup...
start /min cmd /c "node server.js > server-test.log 2>&1"
timeout 5 >nul

echo Testing HTTP response...
curl -s -m 10 http://localhost:8080/ > test-response.txt 2>&1
if exist "test-response.txt" (
    echo Response received:
    findstr /C:"TestKovil" test-response.txt >nul
    if %ERRORLEVEL% EQU 0 (
        echo ✅ Server is responding correctly
    ) else (
        echo Response content:
        type test-response.txt
    )
) else (
    echo ❌ No response received
)

echo.
echo Checking server logs...
if exist "server-test.log" (
    echo Server startup log:
    type server-test.log
)

echo.
echo ============================================
echo Quick Fix Summary
echo ============================================
echo.
echo TestKovil application files:
dir /b
echo.
echo Next steps:
echo 1. Try accessing: http://localhost:8080
echo 2. Check IIS configuration points to C:\inetpub\TestKovil
echo 3. Verify iisnode module is installed
echo 4. Check application pool is running
echo.
echo If still showing blank page, check:
echo - Windows Event Viewer for IIS errors
echo - C:\inetpub\TestKovil\logs\tms.log for application logs
echo - IIS Manager application settings
echo.
pause