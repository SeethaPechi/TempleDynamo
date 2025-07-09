@echo off
REM Temple Management System (TMS) - PostgreSQL Database Setup Script
REM This script automatically creates database, tables, and loads sample data
REM Run this script as Administrator on Windows Server

echo ============================================
echo TMS - PostgreSQL Database Setup
echo ============================================
echo.

REM Database Configuration Variables
set DB_HOST=localhost
set DB_PORT=5432
set DB_NAME=temple_management
set DB_USER=temple_app
set DB_PASSWORD=YOUR_SECURE_PASSWORD
set POSTGRES_ADMIN=postgres
set POSTGRES_ADMIN_PASSWORD=

REM Check if PostgreSQL is installed and accessible
echo Step 1: Checking PostgreSQL Installation...
where psql >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: PostgreSQL is not installed or not in PATH
    echo Please install PostgreSQL and ensure psql is accessible
    echo Download from: https://www.postgresql.org/download/windows/
    pause
    exit /b 1
)
echo PostgreSQL found - OK

REM Prompt for PostgreSQL admin password if not set
if "%POSTGRES_ADMIN_PASSWORD%"=="" (
    echo.
    set /p POSTGRES_ADMIN_PASSWORD=Enter PostgreSQL admin postgres password: 
)

REM Test connection to PostgreSQL
echo.
echo Step 2: Testing PostgreSQL Connection...
echo SELECT version(); | psql -h %DB_HOST% -p %DB_PORT% -U %POSTGRES_ADMIN% -d postgres >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Cannot connect to PostgreSQL server
    echo Please check:
    echo - PostgreSQL service is running
    echo - Host: %DB_HOST%, Port: %DB_PORT%
    echo - Admin username: %POSTGRES_ADMIN%
    echo - Admin password is correct
    pause
    exit /b 1
)
echo PostgreSQL connection successful

REM Set PGPASSWORD for automated commands
set PGPASSWORD=%POSTGRES_ADMIN_PASSWORD%

REM Create database and user
echo.
echo Step 3: Creating Database and User...
echo Creating database: %DB_NAME%
psql -h %DB_HOST% -p %DB_PORT% -U %POSTGRES_ADMIN% -d postgres -c "CREATE DATABASE %DB_NAME%;" 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Database %DB_NAME% already exists or error occurred
)

echo Creating user: %DB_USER%
psql -h %DB_HOST% -p %DB_PORT% -U %POSTGRES_ADMIN% -d postgres -c "CREATE USER %DB_USER% WITH PASSWORD '%DB_PASSWORD%';" 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo User %DB_USER% already exists or error occurred
)

echo Granting privileges...
psql -h %DB_HOST% -p %DB_PORT% -U %POSTGRES_ADMIN% -d postgres -c "GRANT ALL PRIVILEGES ON DATABASE %DB_NAME% TO %DB_USER%;"
psql -h %DB_HOST% -p %DB_PORT% -U %POSTGRES_ADMIN% -d postgres -c "ALTER USER %DB_USER% CREATEDB;"

REM Switch to application user credentials
set PGPASSWORD=%DB_PASSWORD%

REM Create database schema
echo.
echo Step 4: Creating Database Tables...
if exist "database-schema.sql" (
    echo Running database schema creation...
    psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f database-schema.sql
    if %ERRORLEVEL% EQU 0 (
        echo Database schema created successfully
    ) else (
        echo ERROR: Failed to create database schema
        pause
        exit /b 1
    )
) else (
    echo ERROR: database-schema.sql file not found
    echo Please ensure database-schema.sql is in the same directory as this script
    pause
    exit /b 1
)

REM Load sample data
echo.
echo Step 5: Loading Sample Data...
if exist "sample-data.sql" (
    echo Loading sample temples and users...
    psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f sample-data.sql
    if %ERRORLEVEL% EQU 0 (
        echo Sample data loaded successfully
    ) else (
        echo WARNING: Some sample data may not have loaded correctly
    )
) else (
    echo WARNING: sample-data.sql file not found
    echo Sample data will not be loaded
)

REM Verify database setup
echo.
echo Step 6: Verifying Database Setup...
echo Checking tables...
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -c "\dt"

echo.
echo Checking table row counts...
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -c "SELECT 'members' as table_name, COUNT(*) as row_count FROM members UNION ALL SELECT 'temples', COUNT(*) FROM temples UNION ALL SELECT 'relationships', COUNT(*) FROM relationships UNION ALL SELECT 'users', COUNT(*) FROM users;"

REM Create connection string for application
echo.
echo Step 7: Generating Connection Information...
set CONNECTION_STRING=postgresql://%DB_USER%:%DB_PASSWORD%@%DB_HOST%:%DB_PORT%/%DB_NAME%

echo.
echo ============================================
echo Database Setup Complete!
echo ============================================
echo.
echo Database Connection Details:
echo Host: %DB_HOST%
echo Port: %DB_PORT%
echo Database: %DB_NAME%
echo Username: %DB_USER%
echo Password: %DB_PASSWORD%
echo.
echo Connection String for .env file:
echo DATABASE_URL=%CONNECTION_STRING%
echo.
echo Next Steps:
echo 1. Update your .env file with the connection string above
echo 2. Test your TMS application connection
echo 3. Access TMS at: http://localhost:8080
echo.

REM Create a .env snippet file for easy copying
echo Creating .env configuration snippet...
echo # TMS Database Configuration > database-config.env
echo DATABASE_URL=%CONNECTION_STRING% >> database-config.env
echo PGHOST=%DB_HOST% >> database-config.env
echo PGPORT=%DB_PORT% >> database-config.env
echo PGDATABASE=%DB_NAME% >> database-config.env
echo PGUSER=%DB_USER% >> database-config.env
echo PGPASSWORD=%DB_PASSWORD% >> database-config.env

echo.
echo Database configuration saved to: database-config.env
echo You can copy this content to your .env file
echo.

REM Test application connection
echo Step 8: Testing Application Connection...
echo Testing connection with application credentials...
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -c "SELECT 'TMS Database Ready!' as status, current_timestamp as setup_time;"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo SUCCESS: TMS Database is ready for production use!
) else (
    echo.
    echo WARNING: Database setup completed but connection test failed
    echo Please verify credentials and connectivity manually
)

echo.
echo For troubleshooting, check:
echo - PostgreSQL service status: services.msc
echo - Firewall settings for port %DB_PORT%
echo - Database logs in PostgreSQL data directory
echo.
pause