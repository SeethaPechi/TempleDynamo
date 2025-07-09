@echo off
REM Configure Database Connection for Nam Kovil

echo ============================================
echo Configuring Database Connection
echo ============================================

cd "C:\inetpub\TestKovil"
echo Working directory: %CD%

REM Set environment variables for database connection
echo Setting database environment variables...
REM SECURITY: Replace with your actual secure credentials
setx DATABASE_URL "postgresql://YOUR_DB_USER:YOUR_SECURE_PASSWORD@localhost:5432/temple_management" /M
setx PGHOST "localhost" /M
setx PGPORT "5432" /M
setx PGDATABASE "temple_management" /M
setx PGUSER "YOUR_DB_USER" /M
setx PGPASSWORD "YOUR_SECURE_PASSWORD" /M

REM Test database connection
echo Testing database connection...
psql -h localhost -p 5432 -U temple_app -d temple_management -c "SELECT count(*) as member_count FROM members;" 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ Database connection successful
) else (
    echo ⚠️ Database connection test failed - please verify PostgreSQL is running
    echo.
    echo Database Configuration:
    echo • Host: localhost
    echo • Port: 5432
    echo • Database: temple_management
    echo • User: temple_app
    echo • Password: [Your secure password]
    echo.
    echo Make sure PostgreSQL service is running and the database exists.
)

REM Test specific tables
echo Testing database tables...
psql -h localhost -p 5432 -U temple_app -d temple_management -c "\dt" 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ Database tables accessible
) else (
    echo ⚠️ Database tables check failed
)

echo.
echo ============================================
echo Database Configuration Complete
echo ============================================
echo.
echo Database settings configured:
echo • Connection String: postgresql://temple_app:****@localhost:5432/temple_management
echo • Environment variables set system-wide
echo • Ready for Nam Kovil application deployment
echo.
pause