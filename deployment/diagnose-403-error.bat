@echo off
REM Diagnose 403 Forbidden Error for TamilKovil

echo ============================================
echo Diagnosing 403 Forbidden Error - TamilKovil
echo ============================================

cd "C:\inetpub\TestKovil"
echo Working directory: %CD%

REM Step 1: Check if directory exists and is accessible
echo Step 1: Directory access check...
if exist "C:\inetpub\TestKovil" (
    echo ✅ TestKovil directory exists
) else (
    echo ❌ TestKovil directory NOT FOUND
    echo Available directories in C:\inetpub:
    dir C:\inetpub /b
    goto :end
)

REM Step 2: Check file permissions
echo Step 2: File permissions check...
echo Current directory permissions:
icacls "C:\inetpub\TestKovil"

echo Checking for required accounts:
icacls "C:\inetpub\TestKovil" | findstr /i "iis_iusrs"
if %ERRORLEVEL% EQU 0 (
    echo ✅ IIS_IUSRS has permissions
) else (
    echo ❌ IIS_IUSRS missing permissions
)

icacls "C:\inetpub\TestKovil" | findstr /i "iusr"
if %ERRORLEVEL% EQU 0 (
    echo ✅ IUSR has permissions
) else (
    echo ❌ IUSR missing permissions
)

REM Step 3: Check IIS site configuration
echo Step 3: IIS site configuration...
echo All IIS sites:
%windir%\system32\inetsrv\appcmd list site

echo Applications in sites:
%windir%\system32\inetsrv\appcmd list app

echo Virtual directories:
%windir%\system32\inetsrv\appcmd list vdir

REM Step 4: Check application pools
echo Step 4: Application pool status...
echo All application pools:
%windir%\system32\inetsrv\appcmd list apppool

echo Application pool that might be running TestKovil:
%windir%\system32\inetsrv\appcmd list apppool | findstr -i "testkovil\|default"

REM Step 5: Check if Node.js and iisnode are working
echo Step 5: Node.js and iisnode check...
echo Node.js version:
node --version 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js not found or not in PATH
) else (
    echo ✅ Node.js is available
)

echo Checking for iisnode module:
%windir%\system32\inetsrv\appcmd list module | findstr -i iisnode
if %ERRORLEVEL% EQU 0 (
    echo ✅ iisnode module is installed
) else (
    echo ❌ iisnode module NOT installed
)

REM Step 6: Check files in TestKovil directory
echo Step 6: TestKovil directory contents...
echo Files in TestKovil:
dir /b

echo Looking for key files:
if exist "server.js" (
    echo ✅ server.js exists
) else (
    echo ❌ server.js missing
)

if exist "web.config" (
    echo ✅ web.config exists
    echo web.config content:
    type web.config
) else (
    echo ❌ web.config missing
)

if exist "index.html" (
    echo ✅ index.html exists
) else (
    echo ❌ index.html missing
)

if exist "public\index.html" (
    echo ✅ public\index.html exists
) else (
    echo ❌ public\index.html missing
)

REM Step 7: Check port binding
echo Step 7: Port and binding check...
echo Checking what's listening on port 8080:
netstat -an | findstr :8080
if %ERRORLEVEL% EQU 0 (
    echo ✅ Something is listening on port 8080
) else (
    echo ❌ Nothing listening on port 8080
)

echo Checking IIS site bindings for port 8080:
%windir%\system32\inetsrv\appcmd list site | findstr 8080

REM Step 8: Check Windows Event Logs for recent IIS errors
echo Step 8: Recent IIS errors...
echo Checking for recent IIS errors in Event Log:
powershell -Command "Get-EventLog -LogName System -Source 'Microsoft-Windows-IIS*' -After (Get-Date).AddHours(-1) -ErrorAction SilentlyContinue | Select-Object -First 5 | Format-Table TimeGenerated, EntryType, Message -Wrap"

echo Checking Application Event Log:
powershell -Command "Get-EventLog -LogName Application -Source '*IIS*' -After (Get-Date).AddHours(-1) -ErrorAction SilentlyContinue | Select-Object -First 5 | Format-Table TimeGenerated, EntryType, Message -Wrap"

REM Step 9: Test different access methods
echo Step 9: Testing different access methods...

echo Testing localhost access:
curl -s -I http://localhost:8080/ 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ localhost accessible
) else (
    echo ❌ localhost not accessible
)

echo Testing with IP address:
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4"') do (
    set IP=%%a
    goto :testip
)
:testip
curl -s -I http://%IP::=/=%:8080/ 2>nul

echo Testing direct file access:
curl -s -I http://localhost:8080/index.html 2>nul

REM Step 10: Check for conflicting applications
echo Step 10: Checking for conflicts...
echo Processes using port 8080:
netstat -ano | findstr :8080

echo Services that might conflict:
sc query | findstr /i "iis\|apache\|nginx"

:end
echo.
echo ============================================
echo Diagnostic Summary
echo ============================================
echo.
echo Common 403 causes and solutions:
echo.
echo 1. PERMISSIONS ISSUE:
echo    - IIS_IUSRS needs full control of C:\inetpub\TestKovil
echo    - Run: icacls "C:\inetpub\TestKovil" /grant "IIS_IUSRS:(OI)(CI)F" /T
echo.
echo 2. MISSING IISNODE MODULE:
echo    - Download and install iisnode from Microsoft
echo    - URL: https://github.com/azure/iisnode
echo.
echo 3. WRONG SITE CONFIGURATION:
echo    - Site must point to C:\inetpub\TestKovil
echo    - Binding must be: http tamilkovil.com 8080
echo.
echo 4. APPLICATION POOL ISSUE:
echo    - App pool must be running
echo    - Identity should have access to files
echo.
echo 5. MISSING FILES:
echo    - Need server.js and web.config in TestKovil directory
echo    - Default document (index.html) should exist
echo.
echo Next steps:
echo 1. Run: fix-403-forbidden.bat
echo 2. Check IIS Manager site configuration
echo 3. Install iisnode if missing
echo 4. Check Windows Event Viewer for detailed errors
echo.
pause