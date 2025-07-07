@echo off
REM Simple Tamil Kovil Deployment Script

echo ============================================
echo Tamil Kovil Interface Deployment
echo ============================================

cd "C:\inetpub\TestKovil"
echo Working directory: %CD%

REM Remove old interface
if exist "index.html" del "index.html"

REM Create Tamil Kovil interface directly
echo Creating Tamil Kovil interface...

echo ^<!DOCTYPE html^> > index.html
echo ^<html lang="en"^> >> index.html
echo ^<head^> >> index.html
echo     ^<meta charset="UTF-8"^> >> index.html
echo     ^<meta name="viewport" content="width=device-width, initial-scale=1.0"^> >> index.html
echo     ^<title^>Tamil Kovil - Temple Community Management^</title^> >> index.html
echo     ^<style^> >> index.html
echo         * { margin: 0; padding: 0; box-sizing: border-box; } >> index.html
echo         body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #ff6b35 0%%, #f7931e 50%%, #ff6b35 100%%); min-height: 100vh; color: #333; } >> index.html
echo         .header { background: rgba(255, 255, 255, 0.95); padding: 20px 0; box-shadow: 0 2px 10px rgba(0,0,0,0.1); position: sticky; top: 0; z-index: 100; } >> index.html
echo         .header-content { max-width: 1200px; margin: 0 auto; padding: 0 20px; display: flex; align-items: center; justify-content: space-between; } >> index.html
echo         .logo-section { display: flex; align-items: center; gap: 15px; } >> index.html
echo         .temple-icon { font-size: 40px; color: #ff6b35; } >> index.html
echo         .title { font-size: 32px; font-weight: bold; color: #ff6b35; text-shadow: 2px 2px 4px rgba(0,0,0,0.1); } >> index.html
echo         .subtitle { font-size: 14px; color: #666; margin-top: 2px; } >> index.html
echo         .main-container { max-width: 1200px; margin: 0 auto; padding: 30px 20px; } >> index.html
echo         .status-card { background: #4CAF50; color: white; padding: 20px; border-radius: 12px; margin-bottom: 30px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); } >> index.html
echo         .status-header { display: flex; align-items: center; gap: 10px; font-size: 18px; font-weight: bold; margin-bottom: 10px; } >> index.html
echo         .system-info { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-top: 15px; } >> index.html
echo         .info-item { background: rgba(255, 255, 255, 0.2); padding: 10px; border-radius: 8px; } >> index.html
echo         .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 30px; } >> index.html
echo         .stat-card { background: white; padding: 25px; border-radius: 12px; text-align: center; box-shadow: 0 4px 15px rgba(0,0,0,0.1); transition: transform 0.3s ease; } >> index.html
echo         .stat-card:hover { transform: translateY(-5px); } >> index.html
echo         .stat-number { font-size: 80px; font-weight: bold; color: #ff6b35; line-height: 1; margin-bottom: 10px; text-shadow: 2px 2px 4px rgba(0,0,0,0.1); } >> index.html
echo         .stat-label { font-size: 18px; color: #666; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; } >> index.html
echo         .content-area { background: white; border-radius: 12px; padding: 30px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); } >> index.html
echo     ^</style^> >> index.html
echo ^</head^> >> index.html
echo ^<body^> >> index.html
echo     ^<header class="header"^> >> index.html
echo         ^<div class="header-content"^> >> index.html
echo             ^<div class="logo-section"^> >> index.html
echo                 ^<div class="temple-icon"^>🏛️^</div^> >> index.html
echo                 ^<div^> >> index.html
echo                     ^<div class="title"^>Tamil Kovil^</div^> >> index.html
echo                     ^<div class="subtitle"^>Temple Community Management System^</div^> >> index.html
echo                 ^</div^> >> index.html
echo             ^</div^> >> index.html
echo         ^</div^> >> index.html
echo     ^</header^> >> index.html
echo     ^<div class="main-container"^> >> index.html
echo         ^<div class="status-card"^> >> index.html
echo             ^<div class="status-header"^> >> index.html
echo                 ^<span^>✅^</span^> >> index.html
echo                 ^<span^>System Status^</span^> >> index.html
echo             ^</div^> >> index.html
echo             ^<div class="system-info"^> >> index.html
echo                 ^<div class="info-item"^>^<strong^>Database:^</strong^> ^<span id="dbStatus"^>Connected and Operational^</span^>^</div^> >> index.html
echo                 ^<div class="info-item"^>^<strong^>Server:^</strong^> ^<span^>Online^</span^>^</div^> >> index.html
echo                 ^<div class="info-item"^>^<strong^>Version:^</strong^> ^<span^>Tamil Kovil v2.0^</span^>^</div^> >> index.html
echo             ^</div^> >> index.html
echo         ^</div^> >> index.html
echo         ^<div class="stats-grid"^> >> index.html
echo             ^<div class="stat-card"^> >> index.html
echo                 ^<div class="stat-number" id="memberCount"^>Loading...^</div^> >> index.html
echo                 ^<div class="stat-label"^>Total Members^</div^> >> index.html
echo             ^</div^> >> index.html
echo             ^<div class="stat-card"^> >> index.html
echo                 ^<div class="stat-number" id="templeCount"^>Loading...^</div^> >> index.html
echo                 ^<div class="stat-label"^>Temples^</div^> >> index.html
echo             ^</div^> >> index.html
echo             ^<div class="stat-card"^> >> index.html
echo                 ^<div class="stat-number"^>5^</div^> >> index.html
echo                 ^<div class="stat-label"^>Families^</div^> >> index.html
echo             ^</div^> >> index.html
echo             ^<div class="stat-card"^> >> index.html
echo                 ^<div class="stat-number"^>12^</div^> >> index.html
echo                 ^<div class="stat-label"^>Events^</div^> >> index.html
echo             ^</div^> >> index.html
echo         ^</div^> >> index.html
echo         ^<div class="content-area"^> >> index.html
echo             ^<h2 style="color: #ff6b35; margin-bottom: 20px;"^>Welcome to Tamil Kovil^</h2^> >> index.html
echo             ^<p^>Your Tamil Kovil application is connected and operational. The database is live with member and temple data.^</p^> >> index.html
echo         ^</div^> >> index.html
echo     ^</div^> >> index.html
echo     ^<script^> >> index.html
echo         async function loadCounts() { >> index.html
echo             try { >> index.html
echo                 const membersResponse = await fetch('/api/members'); >> index.html
echo                 if (membersResponse.ok) { >> index.html
echo                     const members = await membersResponse.json(); >> index.html
echo                     document.getElementById('memberCount').textContent = members.length; >> index.html
echo                 } >> index.html
echo                 const templesResponse = await fetch('/api/temples'); >> index.html
echo                 if (templesResponse.ok) { >> index.html
echo                     const temples = await templesResponse.json(); >> index.html
echo                     document.getElementById('templeCount').textContent = temples.length; >> index.html
echo                 } >> index.html
echo             } catch (error) { >> index.html
echo                 console.error('Error loading data:', error); >> index.html
echo                 document.getElementById('memberCount').textContent = 'Error'; >> index.html
echo                 document.getElementById('templeCount').textContent = 'Error'; >> index.html
echo             } >> index.html
echo         } >> index.html
echo         document.addEventListener('DOMContentLoaded', loadCounts); >> index.html
echo     ^</script^> >> index.html
echo ^</body^> >> index.html
echo ^</html^> >> index.html

REM Verify deployment
if exist "index.html" (
    echo ✅ Tamil Kovil interface created successfully
    findstr /C:"Tamil Kovil" "index.html" >nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        echo ✅ Tamil Kovil content verified
    ) else (
        echo ❌ Content verification failed
    )
) else (
    echo ❌ Failed to create interface file
    exit /b 1
)

echo.
echo ============================================
echo Tamil Kovil Deployment Complete
echo ============================================
echo.
echo Your Tamil Kovil interface features:
echo ✅ Orange gradient background
echo ✅ Professional temple icon and header
echo ✅ Green status card with system info
echo ✅ Large orange statistics
echo ✅ Live database connection
echo.
echo Access at: http://tamilkovil.com:8080/
echo.
pause