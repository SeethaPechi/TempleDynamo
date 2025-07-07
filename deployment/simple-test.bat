@echo off
REM Simple TMS Test Script - Fixed for Windows Batch

echo ============================================
echo TMS Simple Test
echo ============================================

cd "C:\inetpub\wwwroot\tms" 2>nul || cd "TestKovil" 2>nul || echo Warning: Could not find TMS directory

echo.
echo Current directory: %CD%
echo.

echo Step 1: Checking files...
if exist "server.js" (
    echo ✅ server.js exists
) else (
    echo ❌ server.js NOT FOUND
    if exist "server-standard-pg.js" (
        echo Found server-standard-pg.js, copying to server.js...
        copy server-standard-pg.js server.js
    )
)

if exist "package.json" (
    echo ✅ package.json exists
) else (
    echo ❌ package.json NOT FOUND
)

if exist "node_modules" (
    echo ✅ node_modules directory exists
) else (
    echo ❌ node_modules NOT FOUND - Run npm install
)

echo.
echo Step 2: Testing Node.js...
node --version
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js not working
    pause
    exit /b 1
)

echo.
echo Step 3: Testing database connection...
if exist "test-db-connection.js" (
    node test-db-connection.js
) else (
    echo test-db-connection.js not found
)

echo.
echo Step 4: Testing server startup...
echo Starting server for 5 seconds...
start /min cmd /c "node server.js"
timeout 3 >nul

echo.
echo Step 5: Testing HTTP endpoints...
echo Testing localhost:8080...
curl -s -m 5 http://localhost:8080/ > test-response.txt 2>&1
if exist "test-response.txt" (
    echo Response received:
    type test-response.txt
    echo.
) else (
    echo No response received
)

echo.
echo Step 6: Checking logs...
if exist "logs\tms.log" (
    echo Latest log entries:
    echo ----------------------------------------
    powershell -Command "Get-Content 'logs\tms.log' | Select-Object -Last 10"
    echo ----------------------------------------
) else (
    echo No log file found
)

echo.
echo Test completed.
echo.
echo If you see a blank page, check:
echo 1. IIS is pointing to the correct directory
echo 2. iisnode module is installed
echo 3. Application pool is running
echo 4. web.config is correct
echo.
pause