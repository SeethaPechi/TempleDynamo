@echo off
REM TestKovil Application Diagnostic Script

echo ============================================
echo TestKovil Application Diagnostics
echo ============================================

cd "C:\inetpub\TestKovil"
echo Current directory: %CD%

echo.
echo Step 1: Checking TestKovil file structure...
echo Files in TestKovil directory:
dir /b

echo.
echo Step 2: Checking critical files...
if exist "server.js" (
    echo ✅ server.js found
) else (
    echo ❌ server.js NOT found
    if exist "index.js" (
        echo Found index.js instead
    )
)

if exist "package.json" (
    echo ✅ package.json found
) else (
    echo ❌ package.json NOT found
)

if exist "node_modules" (
    echo ✅ node_modules directory found
) else (
    echo ❌ node_modules NOT found - need to run npm install
)

if exist "public" (
    echo ✅ public directory found
    echo Files in public:
    dir public /b 2>nul
) else (
    echo ❌ public directory NOT found
)

echo.
echo Step 3: Checking web.config...
if exist "web.config" (
    echo ✅ web.config found
    echo Checking web.config content...
    findstr /C:"server.js" web.config >nul
    if %ERRORLEVEL% EQU 0 (
        echo ✅ web.config points to server.js
    ) else (
        echo ❌ web.config may not be configured correctly
    )
) else (
    echo ❌ web.config NOT found
)

echo.
echo Step 4: Testing Node.js...
node --version
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js not working
) else (
    echo ✅ Node.js is working
)

echo.
echo Step 5: Checking IIS configuration...
echo Application pools:
%windir%\system32\inetsrv\appcmd list apppool | findstr TestKovil

echo IIS applications:
%windir%\system32\inetsrv\appcmd list app | findstr TestKovil

echo.
echo Step 6: Testing database connection...
if exist "test-db-connection.js" (
    node test-db-connection.js
) else (
    echo Database test script not found
)

echo.
echo Step 7: Testing server startup manually...
echo Starting server for 10 seconds...
start /min cmd /c "node server.js > manual-test.log 2>&1"
timeout 8 >nul
taskkill /f /im node.exe >nul 2>&1

if exist "manual-test.log" (
    echo Server startup log:
    echo ----------------------------------------
    type manual-test.log
    echo ----------------------------------------
) else (
    echo No server log captured
)

echo.
echo Step 8: Testing HTTP endpoints...
echo Testing root URL...
curl -s -I http://localhost:8080/ 2>nul
echo.

echo Testing health endpoint...
curl -s http://localhost:8080/api/health 2>nul
echo.

echo.
echo Step 9: Checking logs...
if exist "logs" (
    if exist "logs\tms.log" (
        echo Latest log entries:
        echo ----------------------------------------
        powershell -Command "if (Test-Path 'logs\tms.log') { Get-Content 'logs\tms.log' | Select-Object -Last 10 }"
        echo ----------------------------------------
    ) else (
        echo No application log file found
    )
) else (
    echo No logs directory found
)

echo.
echo ============================================
echo Diagnostic Summary
echo ============================================
echo.
echo TestKovil Installation Check:
echo - Location: C:\inetpub\TestKovil
echo - Expected URL: http://localhost:8080
echo.
echo Common blank page causes:
echo 1. Missing server.js file (should be main entry point)
echo 2. Missing node_modules (run npm install)
echo 3. IIS not configured for Node.js (need iisnode module)
echo 4. web.config pointing to wrong file
echo 5. Application pool stopped or misconfigured
echo.
echo To fix:
echo 1. Run: fix-testkovil-blank-page.bat
echo 2. Check IIS Manager for TestKovil application
echo 3. Verify iisnode module is installed
echo 4. Check Windows Event Viewer for errors
echo.
pause