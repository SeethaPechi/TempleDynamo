@echo off
REM TMS Blank Page Diagnostic Script
REM This script helps identify why the website shows a blank page

echo ============================================
echo TMS Blank Page Diagnostics
echo ============================================
echo.

cd "C:\inetpub\wwwroot\tms"

echo Step 1: Checking file structure...
echo Files in TMS directory:
dir /b

echo.
echo Step 2: Checking if server.js exists...
if exist "server.js" (
    echo ✅ server.js found
) else (
    echo ❌ server.js NOT found
    echo This is likely the problem!
)

echo.
echo Step 3: Checking if public directory exists...
if exist "public" (
    echo ✅ public directory found
    echo Files in public directory:
    dir public /b
) else (
    echo ❌ public directory NOT found
    echo Creating public directory with test file...
    mkdir public
)

echo.
echo Step 4: Checking logs...
if exist "logs" (
    echo ✅ logs directory found
    if exist "logs\tms.log" (
        echo Latest log entries:
        echo ----------------------------------------
        tail -20 "logs\tms.log" 2>nul || (
            powershell -Command "Get-Content 'logs\tms.log' | Select-Object -Last 20"
        )
        echo ----------------------------------------
    ) else (
        echo ❌ No log file found (tms.log)
    )
) else (
    echo ❌ logs directory NOT found
)

echo.
echo Step 5: Testing Node.js server directly...
echo Starting server for 10 seconds to capture logs...
timeout 2 >nul
start /min cmd /c "node server.js > server-test.log 2>&1"
timeout 8 >nul

echo Server test output:
echo ----------------------------------------
if exist "server-test.log" (
    type "server-test.log"
) else (
    echo No server output captured
)
echo ----------------------------------------

echo.
echo Step 6: Testing HTTP endpoints...
echo Testing health check...
curl -s http://localhost:8080/api/health
echo.

echo Testing root endpoint...
curl -s -I http://localhost:8080/
echo.

echo.
echo Step 7: Checking IIS Application Pool...
%windir%\system32\inetsrv\appcmd list apppool "TMS-AppPool"

echo.
echo Step 8: Checking IIS Application...
%windir%\system32\inetsrv\appcmd list app | findstr tms

echo.
echo Step 9: Environment variables check...
echo NODE_ENV: %NODE_ENV%
echo PORT: %PORT%
echo PGHOST: %PGHOST%
echo PGPORT: %PGPORT%
echo PGDATABASE: %PGDATABASE%
echo PGUSER: %PGUSER%

echo.
echo Step 10: Testing database connection...
if exist "test-db-connection.js" (
    node test-db-connection.js
) else (
    echo Database test script not found
    node --version
)

echo.
echo ============================================
echo Diagnostic Summary
echo ============================================
echo.
echo Common causes of blank page:
echo 1. Missing public/index.html file
echo 2. IIS not configured to serve Node.js
echo 3. Application pool stopped or misconfigured
echo 4. iisnode module not installed
echo 5. Database connection preventing startup
echo 6. Missing dependencies in node_modules
echo.
echo Quick fixes to try:
echo 1. Copy server-standard-pg.js to server.js
echo 2. Run: npm install in this directory
echo 3. Restart IIS: iisreset
echo 4. Check Event Viewer for IIS errors
echo 5. Test directly: node server.js
echo.
echo For detailed logs, check:
echo - C:\inetpub\wwwroot\tms\logs\tms.log
echo - Windows Event Viewer > Applications and Services Logs > IIS
echo - C:\inetpub\wwwroot\tms\server-test.log
echo.
pause