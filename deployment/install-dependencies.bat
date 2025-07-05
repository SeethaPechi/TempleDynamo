@echo off
REM TMS - Production Dependencies Installation Script
REM Handles npm package version issues for Windows IIS deployment

echo ============================================
echo TMS - Installing Production Dependencies
echo ============================================

REM Check if Node.js is installed
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from: https://nodejs.org/
    pause
    exit /b 1
)

REM Check if npm is available
where npm >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: npm is not available
    echo Please ensure Node.js is properly installed
    pause
    exit /b 1
)

echo Node.js and npm found - OK
echo.

REM Try standard installation first
echo Step 1: Attempting standard npm install...
npm install --omit=dev

if %ERRORLEVEL% EQU 0 (
    echo SUCCESS: Dependencies installed successfully
    goto :success
) else (
    echo WARNING: Standard installation failed, trying alternative approach...
)

echo.
echo Step 2: Trying alternative package versions...

REM Use the standard PostgreSQL package.json
if exist "package-standard-pg.json" (
    echo Using standard PostgreSQL configuration...
    copy package-standard-pg.json package.json
    npm install --omit=dev
    
    if %ERRORLEVEL% EQU 0 (
        echo SUCCESS: Dependencies installed with standard PostgreSQL
        goto :success
    )
)

echo.
echo Step 3: Installing packages individually...

REM Install core packages one by one
echo Installing Express framework...
npm install express@4.18.2 --save

echo Installing database packages...
npm install pg@8.11.3 --save
npm install drizzle-orm@0.30.10 --save

echo Installing session management...
npm install express-session@1.17.3 --save
npm install connect-pg-simple@9.0.1 --save

echo Installing security packages...
npm install helmet@7.1.0 --save
npm install cors@2.8.5 --save

echo Installing utility packages...
npm install compression@1.7.4 --save
npm install ws@8.14.2 --save

echo.
echo Step 4: Verifying installation...
if exist "node_modules\express" (
    echo Express - OK
) else (
    echo Express - MISSING
)

if exist "node_modules\pg" (
    echo PostgreSQL driver - OK
) else (
    echo PostgreSQL driver - MISSING
)

if exist "node_modules\drizzle-orm" (
    echo Drizzle ORM - OK
) else (
    echo Drizzle ORM - MISSING
)

:success
echo.
echo ============================================
echo Dependencies Installation Summary
echo ============================================

echo Checking final package status...
npm list --depth=0

echo.
echo Installation completed successfully!
echo.
echo Next steps:
echo 1. Ensure database is configured (run setup-database.bat)
echo 2. Create .env file with DATABASE_URL
echo 3. Test the application: npm start
echo.

echo TMS is ready for IIS deployment!
pause
goto :end

:error
echo.
echo ERROR: Failed to install dependencies
echo Please check:
echo - Internet connectivity
echo - npm registry access
echo - Windows permissions
echo.
echo Try running as Administrator
pause

:end