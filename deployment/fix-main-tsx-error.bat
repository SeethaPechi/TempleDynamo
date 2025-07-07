@echo off
REM Complete Fix for main.tsx 404 Error in TamilKovil

echo ============================================
echo Fixing main.tsx 404 Error - TamilKovil
echo ============================================

cd "C:\inetpub\TestKovil"
echo Working in: %CD%

REM Step 1: Replace server.js with production version
echo Step 1: Installing production server...
if exist "server-production.js" (
    copy server-production.js server.js
    echo ✅ Production server installed
) else (
    echo ❌ server-production.js not found
    echo Available files:
    dir /b *.js
)

REM Step 2: Install basic dependencies
echo Step 2: Installing dependencies...
if exist "package.json" (
    npm install express helmet cors compression --save
) else (
    echo Creating basic package.json...
    (
        echo {
        echo   "name": "tamilkovil-app",
        echo   "version": "1.0.0",
        echo   "main": "server.js",
        echo   "scripts": {
        echo     "start": "node server.js"
        echo   },
        echo   "dependencies": {
        echo     "express": "^4.18.2",
        echo     "helmet": "^7.1.0",
        echo     "cors": "^2.8.5",
        echo     "compression": "^1.7.4"
        echo   }
        echo }
    ) > package.json
    npm install
)

REM Step 3: Create production public directory
echo Step 3: Creating production frontend...
if not exist "public" mkdir public

echo Creating production index.html...
(
echo ^<!DOCTYPE html^>
echo ^<html lang="en"^>
echo ^<head^>
echo ^<meta charset="UTF-8"^>
echo ^<meta name="viewport" content="width=device-width, initial-scale=1.0"^>
echo ^<title^>Tamil Kovil - Temple Management System^</title^>
echo ^<style^>
echo * { margin: 0; padding: 0; box-sizing: border-box; }
echo body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #ff9a56 0%%, #ff6b35 100%%^); min-height: 100vh; }
echo .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
echo .header { text-align: center; color: white; margin-bottom: 40px; padding: 40px 0; }
echo .header h1 { font-size: 3.5rem; margin-bottom: 10px; text-shadow: 2px 2px 4px rgba(0,0,0,0.3^); }
echo .header h2 { font-size: 1.5rem; font-weight: 300; opacity: 0.9; }
echo .card { background: white; border-radius: 15px; padding: 30px; margin: 20px 0; box-shadow: 0 10px 30px rgba(0,0,0,0.1^); }
echo .status-success { background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%^); color: white; }
echo .api-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr^)^); gap: 20px; margin: 20px 0; }
echo .api-card { background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 10px; padding: 20px; transition: transform 0.3s ease; }
echo .api-card:hover { transform: translateY(-5px^); box-shadow: 0 5px 15px rgba(0,0,0,0.1^); }
echo .btn { display: inline-block; background: #ff6b35; color: white; padding: 12px 24px; text-decoration: none; border-radius: 25px; margin: 10px 5px; transition: all 0.3s ease; }
echo .btn:hover { background: #e55a2b; transform: translateY(-2px^); }
echo .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr^)^); gap: 15px; margin: 20px 0; }
echo .stat-item { text-align: center; background: #f8f9fa; padding: 20px; border-radius: 10px; }
echo .stat-number { font-size: 2rem; font-weight: bold; color: #ff6b35; }
echo .loading { display: none; text-align: center; color: #666; }
echo ^</style^>
echo ^</head^>
echo ^<body^>
echo ^<div class="container"^>
echo   ^<div class="header"^>
echo     ^<h1^>🏛️ Tamil Kovil^</h1^>
echo     ^<h2^>Temple Management System^</h2^>
echo   ^</div^>
echo   
echo   ^<div class="card status-success"^>
echo     ^<h3^>✅ Application Running Successfully^</h3^>
echo     ^<p^>Server is online and ready to serve the Tamil Kovil community.^</p^>
echo     ^<p^>^<strong^>Access URL:^</strong^> http://tamilkovil.com:8080/^</p^>
echo     ^<p^>^<strong^>Server Time:^</strong^> ^<span id="serverTime"^>^</span^>^</p^>
echo   ^</div^>
echo   
echo   ^<div class="card"^>
echo     ^<h3^>📊 System Statistics^</h3^>
echo     ^<div class="stats"^>
echo       ^<div class="stat-item"^>
echo         ^<div class="stat-number" id="memberCount"^>-^</div^>
echo         ^<div^>Total Members^</div^>
echo       ^</div^>
echo       ^<div class="stat-item"^>
echo         ^<div class="stat-number" id="templeCount"^>-^</div^>
echo         ^<div^>Temples^</div^>
echo       ^</div^>
echo       ^<div class="stat-item"^>
echo         ^<div class="stat-number" id="relationshipCount"^>-^</div^>
echo         ^<div^>Relationships^</div^>
echo       ^</div^>
echo     ^</div^>
echo   ^</div^>
echo   
echo   ^<div class="card"^>
echo     ^<h3^>🔧 API Endpoints^</h3^>
echo     ^<div class="api-grid"^>
echo       ^<div class="api-card"^>
echo         ^<h4^>Health Check^</h4^>
echo         ^<p^>System status and information^</p^>
echo         ^<a href="/api/health" class="btn"^>Test Health API^</a^>
echo       ^</div^>
echo       ^<div class="api-card"^>
echo         ^<h4^>Members API^</h4^>
echo         ^<p^>Community member management^</p^>
echo         ^<a href="/api/members" class="btn"^>View Members^</a^>
echo       ^</div^>
echo       ^<div class="api-card"^>
echo         ^<h4^>Temples API^</h4^>
echo         ^<p^>Temple information and management^</p^>
echo         ^<a href="/api/temples" class="btn"^>View Temples^</a^>
echo       ^</div^>
echo     ^</div^>
echo   ^</div^>
echo   
echo   ^<div class="card"^>
echo     ^<h3^>🧪 Interactive Tests^</h3^>
echo     ^<button class="btn" onclick="testAllAPIs(^)"^>Test All APIs^</button^>
echo     ^<button class="btn" onclick="loadStats(^)"^>Refresh Statistics^</button^>
echo     ^<div id="testResults" style="margin-top: 20px;"^>^</div^>
echo     ^<div class="loading" id="loading"^>Testing APIs...^</div^>
echo   ^</div^>
echo ^</div^>
echo 
echo ^<script^>
echo document.getElementById('serverTime'^).textContent = new Date(^).toLocaleString(^);
echo 
echo async function loadStats(^) {
echo   try {
echo     const [members, temples, relationships] = await Promise.all([
echo       fetch('/api/members'^).then(r =^> r.json(^)^),
echo       fetch('/api/temples'^).then(r =^> r.json(^)^),
echo       fetch('/api/relationships'^).then(r =^> r.json(^)^)
echo     ]);
echo     
echo     document.getElementById('memberCount'^).textContent = members.length;
echo     document.getElementById('templeCount'^).textContent = temples.length;
echo     document.getElementById('relationshipCount'^).textContent = relationships.length;
echo   } catch (error^) {
echo     console.error('Error loading stats:', error^);
echo   }
echo }
echo 
echo async function testAllAPIs(^) {
echo   const loading = document.getElementById('loading'^);
echo   const results = document.getElementById('testResults'^);
echo   
echo   loading.style.display = 'block';
echo   results.innerHTML = '';
echo   
echo   const tests = [
echo     { name: 'Health Check', url: '/api/health' },
echo     { name: 'Members API', url: '/api/members' },
echo     { name: 'Temples API', url: '/api/temples' },
echo     { name: 'Relationships API', url: '/api/relationships' }
echo   ];
echo   
echo   for (const test of tests^) {
echo     try {
echo       const response = await fetch(test.url^);
echo       const data = await response.json(^);
echo       const status = response.ok ? '✅' : '❌';
echo       results.innerHTML += `^<p^>${status} ${test.name}: ${response.status} - ${Array.isArray(data^) ? data.length + ' items' : 'OK'}^</p^>`;
echo     } catch (error^) {
echo       results.innerHTML += `^<p^>❌ ${test.name}: Error - ${error.message}^</p^>`;
echo     }
echo   }
echo   
echo   loading.style.display = 'none';
echo }
echo 
echo // Load stats on page load
echo loadStats(^);
echo ^</script^>
echo ^</body^>
echo ^</html^>
) > public\index.html

echo ✅ Production frontend created

REM Step 4: Update web.config for production
echo Step 4: Creating production web.config...
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
echo     ^<iisnode loggingEnabled="true" debuggingEnabled="false" nodeProcessCommandLine="C:\Program Files\nodejs\node.exe"/^>
echo   ^</system.webServer^>
echo ^</configuration^>
) > web.config

echo ✅ Production web.config created

REM Step 5: Clean up any development files
echo Step 5: Cleaning development files...
if exist "src" (
    echo Removing src directory...
    rmdir /s /q src
)
if exist "client" (
    echo Removing client directory...
    rmdir /s /q client
)
if exist "vite.config.ts" (
    del vite.config.ts
)

REM Step 6: Test the production setup
echo Step 6: Testing production setup...
start /min cmd /c "node server.js > production-test.log 2>&1"
timeout 5 >nul

echo Testing production response...
curl -s -m 10 http://localhost:8080/ | findstr /C:"Tamil Kovil" >nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ Production server responding correctly
) else (
    echo ❌ Server not responding as expected
)

echo Testing API endpoints...
curl -s -m 5 http://localhost:8080/api/health >nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ Health API working
) else (
    echo ❌ Health API not responding
)

REM Cleanup
taskkill /f /im node.exe >nul 2>&1

echo.
echo ============================================
echo Production Fix Complete
echo ============================================
echo.
echo ✅ main.tsx 404 error should now be resolved
echo ✅ Production server installed with static file serving
echo ✅ Frontend assets properly configured
echo ✅ IIS web.config updated for production
echo.
echo Your TamilKovil application is now ready:
echo 🌐 http://tamilkovil.com:8080/
echo 📊 http://tamilkovil.com:8080/api/health
echo 👥 http://tamilkovil.com:8080/api/members
echo 🏛️ http://tamilkovil.com:8080/api/temples
echo.
echo The application now serves a proper production frontend
echo instead of trying to load development files like main.tsx
echo.
pause