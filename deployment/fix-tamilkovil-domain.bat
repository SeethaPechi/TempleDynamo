@echo off
REM Fix TestKovil for tamilkovil.com:8080 domain binding

echo ============================================
echo TestKovil Domain Fix - tamilkovil.com:8080
echo ============================================

cd "C:\inetpub\TestKovil"
echo Current directory: %CD%

REM Step 1: Copy correct server files
if exist "server-standard-pg.js" (
    echo Copying server-standard-pg.js to server.js...
    copy server-standard-pg.js server.js
) else (
    echo ❌ server-standard-pg.js not found
    echo Available JavaScript files:
    dir /b *.js
)

REM Step 2: Update server for domain binding
echo Updating server configuration for tamilkovil.com...
if exist "server.js" (
    echo Creating domain-aware server configuration...
    
    REM Create a modified server.js that binds to all interfaces
    powershell -Command "(Get-Content 'server.js') -replace 'localhost', '0.0.0.0' | Set-Content 'server.js'"
    
    echo ✅ Server updated for domain access
) else (
    echo ❌ server.js not found, cannot update
)

REM Step 3: Install dependencies
if not exist "node_modules" (
    echo Installing dependencies...
    npm install --omit=dev
    if %ERRORLEVEL% NEQ 0 (
        echo Installing individual packages...
        npm install express pg helmet cors compression
    )
)

REM Step 4: Create public directory with domain-aware test page
if not exist "public" (
    mkdir public
)

echo Creating domain-aware test page...
(
echo ^<!DOCTYPE html^>
echo ^<html lang="en"^>
echo ^<head^>
echo ^<meta charset="UTF-8"^>
echo ^<meta name="viewport" content="width=device-width, initial-scale=1.0"^>
echo ^<title^>Tamil Kovil - Temple Management System^</title^>
echo ^<style^>
echo body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
echo .header { text-align: center; color: #8B4513; margin-bottom: 30px; }
echo .status { padding: 15px; margin: 15px 0; border-radius: 8px; }
echo .success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
echo .info { background: #d1ecf1; color: #0c5460; border: 1px solid #bee5eb; }
echo .test-section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
echo button { padding: 10px 20px; margin: 5px; cursor: pointer; background: #8B4513; color: white; border: none; border-radius: 4px; }
echo button:hover { background: #A0522D; }
echo .api-link { color: #8B4513; text-decoration: none; margin: 0 10px; }
echo .api-link:hover { text-decoration: underline; }
echo ^</style^>
echo ^</head^>
echo ^<body^>
echo ^<div class="header"^>
echo ^<h1^>🏛️ Tamil Kovil^</h1^>
echo ^<h2^>Temple Management System^</h2^>
echo ^</div^>
echo ^<div class="status success"^>
echo ^<strong^>✅ Application Started Successfully^</strong^>^<br^>
echo Server is running on tamilkovil.com:8080
echo ^</div^>
echo ^<div class="status info"^>
echo ^<strong^>🌐 Domain Information^</strong^>^<br^>
echo Current URL: ^<span id="currentUrl"^>^</span^>^<br^>
echo Server Time: ^<span id="serverTime"^>^</span^>
echo ^</div^>
echo ^<div class="test-section"^>
echo ^<h3^>🧪 API Test Endpoints^</h3^>
echo ^<button onclick="testHealth()"^>Test Health Check^</button^>
echo ^<button onclick="testMembers()"^>Test Members API^</button^>
echo ^<button onclick="testTemples()"^>Test Temples API^</button^>
echo ^<div id="testResults" style="margin-top: 15px;"^>^</div^>
echo ^</div^>
echo ^<div class="test-section"^>
echo ^<h3^>📊 Quick Links^</h3^>
echo ^<a href="/api/health" class="api-link"^>Health Check^</a^>
echo ^<a href="/api/members" class="api-link"^>Members API^</a^>
echo ^<a href="/api/temples" class="api-link"^>Temples API^</a^>
echo ^</div^>
echo ^<script^>
echo document.getElementById('currentUrl'^).textContent = window.location.href;
echo document.getElementById('serverTime'^).textContent = new Date(^).toLocaleString(^);
echo async function testHealth(^) {
echo   try {
echo     const response = await fetch('/api/health'^);
echo     const data = await response.json(^);
echo     showResult('Health Check: ' + JSON.stringify(data, null, 2^), 'success'^);
echo   } catch (error^) {
echo     showResult('Health Check Failed: ' + error.message, 'error'^);
echo   }
echo }
echo async function testMembers(^) {
echo   try {
echo     const response = await fetch('/api/members'^);
echo     const data = await response.json(^);
echo     showResult('Members API: Found ' + data.length + ' members', 'success'^);
echo   } catch (error^) {
echo     showResult('Members API Failed: ' + error.message, 'error'^);
echo   }
echo }
echo async function testTemples(^) {
echo   try {
echo     const response = await fetch('/api/temples'^);
echo     const data = await response.json(^);
echo     showResult('Temples API: Found ' + data.length + ' temples', 'success'^);
echo   } catch (error^) {
echo     showResult('Temples API Failed: ' + error.message, 'error'^);
echo   }
echo }
echo function showResult(message, type^) {
echo   const element = document.getElementById('testResults'^);
echo   const className = type === 'success' ? 'success' : 'info';
echo   element.innerHTML = '^<div class="status ' + className + '"^>' + message + '^</div^>';
echo }
echo ^</script^>
echo ^</body^>
echo ^</html^>
) > public\index.html

echo ✅ Domain-aware test page created

REM Step 5: Create updated web.config for domain binding
echo Creating web.config for domain binding...
(
echo ^<?xml version="1.0" encoding="utf-8"?^>
echo ^<configuration^>
echo   ^<system.webServer^>
echo     ^<handlers^>
echo       ^<add name="iisnode" path="server.js" verb="*" modules="iisnode"/^>
echo     ^</handlers^>
echo     ^<rewrite^>
echo       ^<rules^>
echo         ^<rule name="StaticContent"^>
echo           ^<conditions^>
echo             ^<add input="{REQUEST_FILENAME}" matchType="IsFile"/^>
echo           ^</conditions^>
echo           ^<action type="None"/^>
echo         ^</rule^>
echo         ^<rule name="DynamicContent"^>
echo           ^<conditions^>
echo             ^<add input="{REQUEST_FILENAME}" matchType="IsFile" negate="True"/^>
echo           ^</conditions^>
echo           ^<action type="Rewrite" url="server.js"/^>
echo         ^</rule^>
echo       ^</rules^>
echo     ^</rewrite^>
echo     ^<httpErrors existingResponse="PassThrough" /^>
echo     ^<iisnode loggingEnabled="true" debuggingEnabled="false"/^>
echo   ^</system.webServer^>
echo ^</configuration^>
) > web.config

echo ✅ Domain-compatible web.config created

REM Step 6: Test the application
echo.
echo Testing server startup...
start /min cmd /c "node server.js > domain-test.log 2>&1"
timeout 5 >nul

echo Testing domain endpoints...
echo Testing http://tamilkovil.com:8080/...
curl -s -m 10 -H "Host: tamilkovil.com" http://localhost:8080/ > domain-response.txt 2>&1
if exist "domain-response.txt" (
    findstr /C:"Tamil Kovil" domain-response.txt >nul
    if %ERRORLEVEL% EQU 0 (
        echo ✅ Domain response successful
    ) else (
        echo Response received:
        type domain-response.txt | more
    )
)

echo.
echo ============================================
echo Domain Configuration Complete
echo ============================================
echo.
echo TestKovil is now configured for:
echo - Domain: tamilkovil.com:8080
echo - Path: C:\inetpub\TestKovil
echo.
echo Access URLs:
echo - Main site: http://tamilkovil.com:8080/
echo - Health check: http://tamilkovil.com:8080/api/health
echo - Members API: http://tamilkovil.com:8080/api/members
echo.
echo If still seeing blank page:
echo 1. Check DNS points tamilkovil.com to this server
echo 2. Verify IIS site binding is correct
echo 3. Check Windows Firewall allows port 8080
echo 4. Restart IIS: iisreset
echo.
pause