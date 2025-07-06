@echo off
REM TMS Complete Deployment Script for Windows Server
REM This script sets up the entire TMS application for IIS deployment

echo ============================================
echo TMS Complete Deployment Setup
echo ============================================
echo.

REM Check if running as Administrator
net session >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: This script must be run as Administrator
    echo Right-click and select "Run as Administrator"
    pause
    exit /b 1
)

echo Running as Administrator - OK
echo.

REM Step 1: Check prerequisites
echo Step 1: Checking Prerequisites...

REM Check Node.js
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed
    echo Please install Node.js from: https://nodejs.org/
    pause
    exit /b 1
)
echo Node.js - OK

REM Check PostgreSQL
where psql >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: PostgreSQL is not installed
    echo Please install PostgreSQL from: https://www.postgresql.org/download/windows/
    pause
    exit /b 1
)
echo PostgreSQL - OK

REM Check IIS
if not exist "%SystemRoot%\System32\inetsrv\iisreset.exe" (
    echo ERROR: IIS is not installed
    echo Please install IIS with ASP.NET Core Module
    pause
    exit /b 1
)
echo IIS - OK

echo.
echo Step 2: Setting up Application Directory...

REM Create application directory if it doesn't exist
if not exist "C:\inetpub\wwwroot\tms" (
    mkdir "C:\inetpub\wwwroot\tms"
    echo Created TMS directory
)

REM Copy application files
echo Copying application files...
copy server-standard-pg.js "C:\inetpub\wwwroot\tms\server.js"
copy package-standard-pg.json "C:\inetpub\wwwroot\tms\package.json"
copy web.config "C:\inetpub\wwwroot\tms\web.config"
copy .env.production "C:\inetpub\wwwroot\tms\.env"

REM Copy database scripts
copy database-schema.sql "C:\inetpub\wwwroot\tms\"
copy sample-data.sql "C:\inetpub\wwwroot\tms\"

echo Application files copied successfully
echo.

REM Step 3: Install dependencies
echo Step 3: Installing Node.js Dependencies...
cd "C:\inetpub\wwwroot\tms"

npm install --omit=dev
if %ERRORLEVEL% NEQ 0 (
    echo Warning: npm install failed, trying individual packages...
    npm install express@4.18.2
    npm install pg@8.11.3
    npm install express-session@1.17.3
    npm install connect-pg-simple@9.0.1
    npm install helmet@7.1.0
    npm install cors@2.8.5
    npm install compression@1.7.4
    npm install ws@8.14.2
)

echo Dependencies installed successfully
echo.

REM Step 4: Database setup
echo Step 4: Setting up Database...

REM Prompt for PostgreSQL admin password
set /p POSTGRES_ADMIN_PASSWORD=Enter PostgreSQL admin (postgres) password: 

REM Set environment variable for PostgreSQL
set PGPASSWORD=%POSTGRES_ADMIN_PASSWORD%

REM Create database and user
echo Creating database and user...
psql -h localhost -p 5432 -U postgres -d postgres -c "CREATE DATABASE temple_management;" 2>nul
psql -h localhost -p 5432 -U postgres -d postgres -c "CREATE USER temple_app WITH PASSWORD 'TMS2024SecurePass!';" 2>nul
psql -h localhost -p 5432 -U postgres -d postgres -c "GRANT ALL PRIVILEGES ON DATABASE temple_management TO temple_app;"
psql -h localhost -p 5432 -U postgres -d postgres -c "ALTER USER temple_app CREATEDB;"

REM Switch to application user
set PGPASSWORD=TMS2024SecurePass!

REM Create database schema
echo Creating database tables...
psql -h localhost -p 5432 -U temple_app -d temple_management -f database-schema.sql
if %ERRORLEVEL% EQU 0 (
    echo Database schema created successfully
) else (
    echo ERROR: Failed to create database schema
    pause
    exit /b 1
)

REM Load sample data
echo Loading sample data...
psql -h localhost -p 5432 -U temple_app -d temple_management -f sample-data.sql

echo Database setup completed
echo.

REM Step 5: Configure IIS
echo Step 5: Configuring IIS Application...

REM Create application pool
%windir%\system32\inetsrv\appcmd add apppool /name:"TMS-AppPool" /managedRuntimeVersion:"" /processModel.identityType:ApplicationPoolIdentity 2>nul

REM Configure application pool
%windir%\system32\inetsrv\appcmd set apppool "TMS-AppPool" /processModel.idleTimeout:00:00:00
%windir%\system32\inetsrv\appcmd set apppool "TMS-AppPool" /recycling.periodicRestart.time:00:00:00

REM Create IIS application
%windir%\system32\inetsrv\appcmd add app /site.name:"Default Web Site" /path:/tms /physicalPath:"C:\inetpub\wwwroot\tms" /applicationPool:"TMS-AppPool" 2>nul

REM Configure application settings
%windir%\system32\inetsrv\appcmd set config "Default Web Site/tms" -section:system.webServer/defaultDocument /enabled:"true" /+files.[value='server.js']

echo IIS application configured successfully
echo.

REM Step 6: Test the application
echo Step 6: Testing Application...

REM Test database connection
echo Testing database connection...
node -e "
const { Pool } = require('pg');
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'temple_management',
  user: 'temple_app',
  password: 'TMS2024SecurePass!'
});
pool.connect((err, client, release) => {
  if (err) {
    console.log('Database connection failed:', err.message);
    process.exit(1);
  } else {
    console.log('Database connection successful');
    release();
    pool.end();
    process.exit(0);
  }
});
"

if %ERRORLEVEL% EQU 0 (
    echo Database connection test - PASSED
) else (
    echo Database connection test - FAILED
    echo Please check database configuration
)

echo.
echo Step 7: Final Configuration...

REM Create logs directory
if not exist "C:\inetpub\wwwroot\tms\logs" (
    mkdir "C:\inetpub\wwwroot\tms\logs"
)

REM Set permissions
icacls "C:\inetpub\wwwroot\tms" /grant "IIS_IUSRS:(OI)(CI)F" /T >nul 2>&1

REM Restart IIS
echo Restarting IIS...
iisreset /noforce

echo.
echo ============================================
echo TMS Deployment Complete!
echo ============================================
echo.
echo Application Details:
echo - URL: http://localhost:8080/tms
echo - Health Check: http://localhost:8080/tms/api/health
echo - Application Pool: TMS-AppPool
echo - Physical Path: C:\inetpub\wwwroot\tms
echo.
echo Database Details:
echo - Host: localhost:5432
echo - Database: temple_management
echo - Username: temple_app
echo - Password: TMS2024SecurePass!
echo.
echo Next Steps:
echo 1. Open web browser and navigate to: http://localhost:8080/tms
echo 2. Check health endpoint: http://localhost:8080/tms/api/health
echo 3. Test member and temple functionality
echo.
echo If you encounter issues:
echo 1. Check IIS logs in Event Viewer
echo 2. Check application logs in C:\inetpub\wwwroot\tms\logs
echo 3. Verify database connectivity
echo.
echo TMS is ready for production use!
pause