@echo off
REM TMS Database Verification Script
REM Quick script to test database connectivity and table status

echo ============================================
echo TMS Database Verification
echo ============================================

set DB_HOST=localhost
set DB_PORT=5432
set DB_NAME=temple_management
set DB_USER=temple_app

REM Prompt for password
set /p DB_PASSWORD=Enter database password for %DB_USER%: 

REM Set password for psql
set PGPASSWORD=%DB_PASSWORD%

echo.
echo Testing connection to TMS database...
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -c "SELECT 'Connection Successful!' as status, current_timestamp as check_time;"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo Checking database tables and data...
    psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -c "\dt"
    
    echo.
    echo Table row counts:
    psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -c "SELECT 'members' as table_name, COUNT(*) as row_count FROM members UNION ALL SELECT 'temples', COUNT(*) FROM temples UNION ALL SELECT 'relationships', COUNT(*) FROM relationships UNION ALL SELECT 'users', COUNT(*) FROM users ORDER BY table_name;"
    
    echo.
    echo Database verification completed successfully!
) else (
    echo.
    echo ERROR: Cannot connect to database
    echo Please check credentials and ensure PostgreSQL is running
)

echo.
pause