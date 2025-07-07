@echo off
echo ============================================
echo Installing Nam Kovil Dependencies
echo ============================================

cd "C:\inetpub\TestKovil"
echo Working directory: %CD%

echo.
echo Installing Node.js packages...
echo.

REM Initialize npm if needed
if not exist "package.json" (
    echo Initializing npm project...
    call npm init -y
)

echo Installing Express and PostgreSQL packages...
call npm install --save express@4.18.2 pg@8.11.3 cors@2.8.5

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo NPM install failed. Trying alternative method...
    echo.
    
    REM Create node_modules directory
    if not exist "node_modules" mkdir "node_modules"
    
    REM Try global installation
    echo Installing packages globally...
    call npm install -g express pg cors
    
    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo ❌ Failed to install Node.js packages
        echo.
        echo Please install manually:
        echo 1. npm install express
        echo 2. npm install pg
        echo 3. npm install cors
        echo.
        pause
        exit /b 1
    )
)

echo.
echo ✅ Dependencies installed successfully!
echo.

echo Testing package availability...
node -e "console.log('Express:', require('express') ? 'OK' : 'FAIL')" 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Express module test failed
) else (
    echo Express module: OK
)

node -e "console.log('PostgreSQL:', require('pg') ? 'OK' : 'FAIL')" 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo PostgreSQL module test failed
) else (
    echo PostgreSQL module: OK
)

echo.
echo ============================================
echo Dependencies Installation Complete
echo ============================================
echo.
echo You can now run: node server-with-local-db.js
echo.
pause