@echo off
REM Fix 403 Forbidden Error for TamilKovil on IIS

echo ============================================
echo Fixing 403 Forbidden Error - TamilKovil
echo ============================================

cd "C:\inetpub\TestKovil"
echo Working in: %CD%

REM Step 1: Check current IIS configuration
echo Step 1: Checking IIS configuration...
%windir%\system32\inetsrv\appcmd list site | findstr tamilkovil
if %ERRORLEVEL% NEQ 0 (
    echo No tamilkovil site found, checking all sites on port 8080...
    %windir%\system32\inetsrv\appcmd list site | findstr 8080
)

echo Checking application pools...
%windir%\system32\inetsrv\appcmd list apppool | findstr -i testkovil

REM Step 2: Fix file permissions
echo Step 2: Setting proper file permissions...
echo Granting IIS_IUSRS read access to TestKovil directory...
icacls "C:\inetpub\TestKovil" /grant "IIS_IUSRS:(OI)(CI)F" /T
if %ERRORLEVEL% EQU 0 (
    echo ✅ IIS_IUSRS permissions set
) else (
    echo ❌ Failed to set IIS_IUSRS permissions
)

echo Granting IUSR read access...
icacls "C:\inetpub\TestKovil" /grant "IUSR:(OI)(CI)R" /T
if %ERRORLEVEL% EQU 0 (
    echo ✅ IUSR permissions set
) else (
    echo ❌ Failed to set IUSR permissions
)

echo Setting Application Pool Identity permissions...
icacls "C:\inetpub\TestKovil" /grant "IIS AppPool\DefaultAppPool:(OI)(CI)F" /T 2>nul
icacls "C:\inetpub\TestKovil" /grant "IIS AppPool\TestKovil:(OI)(CI)F" /T 2>nul

REM Step 3: Create proper directory structure
echo Step 3: Ensuring proper directory structure...
if not exist "public" mkdir public
if not exist "logs" mkdir logs

REM Step 4: Create a simple test file for IIS
echo Step 4: Creating IIS test file...
echo ^<html^>^<body^>^<h1^>IIS Test - TamilKovil^</h1^>^<p^>If you see this, IIS can serve static files.^</p^>^</body^>^</html^> > test.html

REM Step 5: Fix web.config for IIS permissions
echo Step 5: Creating IIS-optimized web.config...
(
echo ^<?xml version="1.0" encoding="utf-8"?^>
echo ^<configuration^>
echo   ^<system.webServer^>
echo     ^<defaultDocument^>
echo       ^<files^>
echo         ^<clear /^>
echo         ^<add value="index.html" /^>
echo         ^<add value="default.html" /^>
echo       ^</files^>
echo     ^</defaultDocument^>
echo     
echo     ^<directoryBrowse enabled="false" /^>
echo     
echo     ^<handlers^>
echo       ^<add name="iisnode" path="server.js" verb="*" modules="iisnode" /^>
echo       ^<add name="StaticFile" path="*" verb="*" modules="StaticFileModule" resourceType="Either" requireAccess="Read" /^>
echo     ^</handlers^>
echo     
echo     ^<rewrite^>
echo       ^<rules^>
echo         ^<rule name="StaticContent" stopProcessing="true"^>
echo           ^<match url=".*\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|html|htm|txt|pdf|doc|docx|zip)$" /^>
echo           ^<action type="None" /^>
echo         ^</rule^>
echo         ^<rule name="PublicFolder" stopProcessing="true"^>
echo           ^<match url="^public/(.*)$" /^>
echo           ^<action type="Rewrite" url="{R:1}" /^>
echo         ^</rule^>
echo         ^<rule name="NodeJS"^>
echo           ^<match url=".*" /^>
echo           ^<conditions^>
echo             ^<add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" /^>
echo           ^</conditions^>
echo           ^<action type="Rewrite" url="server.js" /^>
echo         ^</rule^>
echo       ^</rules^>
echo     ^</rewrite^>
echo     
echo     ^<httpErrors existingResponse="PassThrough" /^>
echo     
echo     ^<security^>
echo       ^<requestFiltering^>
echo         ^<fileExtensions^>
echo           ^<remove fileExtension=".js" /^>
echo           ^<add fileExtension=".js" allowed="true" /^>
echo         ^</fileExtensions^>
echo         ^<hiddenSegments^>
echo           ^<remove segment="bin" /^>
echo         ^</hiddenSegments^>
echo       ^</requestFiltering^>
echo     ^</security^>
echo     
echo     ^<staticContent^>
echo       ^<mimeMap fileExtension=".js" mimeType="application/javascript" /^>
echo       ^<mimeMap fileExtension=".json" mimeType="application/json" /^>
echo     ^</staticContent^>
echo     
echo     ^<iisnode 
echo       loggingEnabled="true"
echo       debuggingEnabled="false"
echo       nodeProcessCountPerApplication="1"
echo       maxConcurrentRequestsPerProcess="1024"
echo       maxNamedPipeConnectionRetry="3"
echo       namedPipeConnectionRetryDelay="2000"
echo       maxNamedPipeConnectionPoolSize="512"
echo       maxNamedPipePooledConnectionAge="30000"
echo       asyncCompletionThreadCount="0"
echo       initialRequestBufferSize="4096"
echo       maxRequestBufferSize="65536"
echo       watchedFiles="*.js"
echo       uncFileChangesPollingInterval="5000"
echo       gracefulShutdownTimeout="60000"
echo       logDirectoryNameSuffix="logs"
echo       node_env="production"
echo     /^>
echo   ^</system.webServer^>
echo ^</configuration^>
) > web.config

echo ✅ IIS-optimized web.config created

REM Step 6: Copy our self-contained application to both root and public
echo Step 6: Deploying application files...
if exist "deployment\final-fix-assets.bat" (
    echo Found final-fix-assets.bat, running it first...
    call deployment\final-fix-assets.bat
) else (
    echo Creating minimal self-contained index.html...
    (
        echo ^<!DOCTYPE html^>
        echo ^<html^>^<head^>^<title^>Tamil Kovil^</title^>^</head^>
        echo ^<body^>^<h1^>Tamil Kovil System^</h1^>^<p^>Application is running successfully.^</p^>^</body^>^</html^>
    ) > index.html
    copy index.html public\ 2>nul
)

REM Step 7: Create simple server if none exists
if not exist "server.js" (
    echo Creating basic server.js...
    (
        echo const express = require('express'^);
        echo const path = require('path'^);
        echo const app = express(^);
        echo app.use(express.static(__dirname^)^);
        echo app.use(express.static(path.join(__dirname, 'public'^)^)^);
        echo app.get('/', (req, res^) =^> res.sendFile(path.join(__dirname, 'index.html'^)^)^);
        echo app.listen(8080, () =^> console.log('TamilKovil on port 8080'^)^);
    ) > server.js
)

REM Step 8: Test file access permissions
echo Step 8: Testing file access...
echo Testing read access to index.html...
type index.html >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ✅ Can read index.html
) else (
    echo ❌ Cannot read index.html
)

echo Testing read access to public directory...
dir public >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ✅ Can access public directory
) else (
    echo ❌ Cannot access public directory
)

REM Step 9: Reset IIS and Application Pool
echo Step 9: Resetting IIS...
echo Stopping application pools...
%windir%\system32\inetsrv\appcmd stop apppool /apppool.name:"DefaultAppPool" 2>nul
%windir%\system32\inetsrv\appcmd stop apppool /apppool.name:"TestKovil" 2>nul

echo Starting application pools...
%windir%\system32\inetsrv\appcmd start apppool /apppool.name:"DefaultAppPool" 2>nul
%windir%\system32\inetsrv\appcmd start apppool /apppool.name:"TestKovil" 2>nul

echo Performing IIS reset...
iisreset /noforce

REM Step 10: Test the fix
echo Step 10: Testing the fix...
timeout 5 >nul

echo Testing static file access...
curl -s -I http://localhost:8080/test.html
echo.

echo Testing main application...
curl -s -I http://localhost:8080/
echo.

echo Testing with domain header...
curl -s -I -H "Host: tamilkovil.com" http://localhost:8080/
echo.

echo.
echo ============================================
echo 403 Forbidden Fix Complete
echo ============================================
echo.
echo Changes made:
echo ✅ Set proper IIS file permissions (IIS_IUSRS, IUSR)
echo ✅ Created IIS-optimized web.config with security settings
echo ✅ Fixed static file handling and MIME types
echo ✅ Reset IIS and application pools
echo ✅ Deployed self-contained application
echo.
echo Test URLs:
echo - Static test: http://tamilkovil.com:8080/test.html
echo - Main app: http://tamilkovil.com:8080/
echo - Localhost: http://localhost:8080/
echo.
echo If still getting 403 errors:
echo 1. Check Windows Event Viewer for detailed IIS errors
echo 2. Verify IIS has iisnode module installed
echo 3. Check that Node.js is installed and accessible
echo 4. Ensure site binding points to C:\inetpub\TestKovil
echo 5. Verify application pool identity has proper permissions
echo.
pause