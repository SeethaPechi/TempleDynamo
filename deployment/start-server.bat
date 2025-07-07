@echo off
echo ============================================
echo Starting Nam Kovil Server
echo ============================================

cd "C:\inetpub\TestKovil"
echo Working directory: %CD%

echo Checking Node.js installation...
node --version 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js not found
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo Testing database connection...
psql -h localhost -p 5432 -U temple_app -d temple_management -c "SELECT count(*) as member_count FROM members;" 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ Database connection verified
) else (
    echo ⚠️ Database connection failed
    echo Please ensure PostgreSQL is running
)

echo.
echo Starting Nam Kovil server on port 8080...
echo Access your application at: http://localhost:8080
echo Press Ctrl+C to stop the server
echo.

REM Start the Node.js server
node server-with-local-db.js

pause