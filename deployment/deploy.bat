@echo off
REM Temple Management System - Windows IIS Deployment Script
REM Run this script as Administrator

echo ============================================
echo Temple Management System - IIS Deployment
echo ============================================
echo.

REM Check if running as Administrator
net session >nul 2>&1
if %errorLevel% == 0 (
    echo Running as Administrator - OK
) else (
    echo ERROR: This script must be run as Administrator
    echo Right-click and select "Run as Administrator"
    pause
    exit /b 1
)

set SITE_NAME=Temple Management System
set APP_POOL=TempleManagementPool
set SITE_PATH=C:\inetpub\wwwroot\temple-app
set SITE_PORT=80

echo.
echo Step 1: Creating Application Pool...
%windir%\system32\inetsrv\appcmd add apppool /name:"%APP_POOL%" /managedRuntimeVersion: /processModel.identityType:ApplicationPoolIdentity

echo.
echo Step 2: Setting Application Pool Properties...
%windir%\system32\inetsrv\appcmd set apppool "%APP_POOL%" /processModel.idleTimeout:00:00:00
%windir%\system32\inetsrv\appcmd set apppool "%APP_POOL%" /recycling.periodicRestart.time:00:00:00

echo.
echo Step 3: Creating Website Directory...
if not exist "%SITE_PATH%" (
    mkdir "%SITE_PATH%"
    echo Created directory: %SITE_PATH%
) else (
    echo Directory already exists: %SITE_PATH%
)

echo.
echo Step 4: Copying Application Files...
copy /Y server.js "%SITE_PATH%\"
copy /Y package.json "%SITE_PATH%\"
copy /Y web.config "%SITE_PATH%\"
copy /Y index.js "%SITE_PATH%\"
copy /Y environment.template "%SITE_PATH%\"
copy /Y database-schema.sql "%SITE_PATH%\"
copy /Y sample-data.sql "%SITE_PATH%\"
if exist public\ xcopy /E /Y public "%SITE_PATH%\public\"

echo.
echo Step 5: Setting File Permissions...
icacls "%SITE_PATH%" /grant "IIS_IUSRS:(OI)(CI)RX"
icacls "%SITE_PATH%" /grant "BUILTIN\IIS_IUSRS:(OI)(CI)RX"

echo.
echo Step 6: Creating Website...
%windir%\system32\inetsrv\appcmd add site /name:"%SITE_NAME%" /physicalPath:"%SITE_PATH%" /bindings:http/*:%SITE_PORT%:

echo.
echo Step 7: Assigning Application Pool to Website...
%windir%\system32\inetsrv\appcmd set site "%SITE_NAME%" /applicationPool:"%APP_POOL%"

echo.
echo Step 8: Installing Node.js Dependencies...
cd /d "%SITE_PATH%"
call npm install --production

echo.
echo Step 9: Creating Environment File...
if not exist "%SITE_PATH%\.env" (
    echo Creating .env file from template...
    copy "%SITE_PATH%\environment.template" "%SITE_PATH%\.env"
    echo.
    echo IMPORTANT: Edit .env file with your database and security settings
    echo Location: %SITE_PATH%\.env
    echo.
    echo Required changes in .env:
    echo - DATABASE_URL: Update with your PostgreSQL credentials
    echo - SESSION_SECRET: Replace with a secure random string (32+ characters)
    echo - CORS_ORIGIN: Update with your domain name
) else (
    echo .env file already exists, skipping creation
)

echo.
echo Step 10: Starting Application Pool and Website...
%windir%\system32\inetsrv\appcmd start apppool "%APP_POOL%"
%windir%\system32\inetsrv\appcmd start site "%SITE_NAME%"

echo.
echo ============================================
echo Deployment Complete!
echo ============================================
echo.
echo Website URL: http://localhost:%SITE_PORT%
echo Health Check: http://localhost:%SITE_PORT%/health
echo.
echo Next Steps:
echo 1. Configure your database connection in: %SITE_PATH%\.env
echo 2. Run database schema: psql -f database-schema.sql
echo 3. Test the application: http://localhost:%SITE_PORT%/health
echo.
echo For SSL/HTTPS setup, refer to the README.md file
echo.
pause