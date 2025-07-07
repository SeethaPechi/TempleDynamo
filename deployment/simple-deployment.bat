@echo off
echo ============================================
echo Nam Kovil Production Deployment
echo ============================================

cd "C:\inetpub\TestKovil"
echo Working directory: %CD%

if exist "index.html" del "index.html"

echo Creating Nam Kovil interface...

echo ^<!DOCTYPE html^> > index.html
echo ^<html lang="en"^> >> index.html
echo ^<head^> >> index.html
echo     ^<meta charset="UTF-8"^> >> index.html
echo     ^<meta name="viewport" content="width=device-width, initial-scale=1.0"^> >> index.html
echo     ^<title^>Nam Kovil - Divine Portal^</title^> >> index.html
echo     ^<style^> >> index.html
echo         body { font-family: Arial, sans-serif; margin: 0; padding: 0; background: linear-gradient(135deg, #fff8dc 0%%, #ffeaa7 100%%); min-height: 100vh; } >> index.html
echo         .nav { background: rgba(255,255,255,0.95); padding: 1rem; border-bottom: 1px solid #ddd; position: sticky; top: 0; z-index: 100; } >> index.html
echo         .nav-content { max-width: 1200px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; } >> index.html
echo         .nav-brand { font-size: 1.5rem; font-weight: bold; color: #8B4513; text-decoration: none; } >> index.html
echo         .nav-links { display: flex; gap: 2rem; list-style: none; margin: 0; padding: 0; } >> index.html
echo         .nav-link { color: #333; text-decoration: none; padding: 0.5rem 1rem; border-radius: 4px; transition: all 0.3s; } >> index.html
echo         .nav-link:hover { background: rgba(255,204,102,0.3); color: #ff6600; } >> index.html
echo         .main-content { max-width: 1200px; margin: 0 auto; padding: 2rem; } >> index.html
echo         .hero-title { font-size: 3rem; font-weight: bold; color: #8B4513; text-align: center; margin-bottom: 1rem; } >> index.html
echo         .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; margin: 2rem 0; } >> index.html
echo         .stat-card { background: white; border-radius: 12px; padding: 2rem; text-align: center; box-shadow: 0 4px 15px rgba(0,0,0,0.1); cursor: pointer; transition: transform 0.3s; } >> index.html
echo         .stat-card:hover { transform: translateY(-3px); } >> index.html
echo         .stat-number { font-size: 2.5rem; font-weight: bold; color: #ff6600; margin-bottom: 0.5rem; } >> index.html
echo         .stat-label { font-size: 0.9rem; color: #666; font-weight: 500; } >> index.html
echo         .content-area { background: white; border-radius: 12px; padding: 2rem; margin: 2rem 0; box-shadow: 0 4px 15px rgba(0,0,0,0.1); min-height: 400px; } >> index.html
echo         .loading { text-align: center; padding: 2rem; color: #666; } >> index.html
echo         .error { text-align: center; padding: 2rem; color: #ff4444; } >> index.html
echo         .status-indicator { display: inline-block; width: 12px; height: 12px; border-radius: 50%%; margin-right: 8px; } >> index.html
echo         .status-connected { background: #4CAF50; } >> index.html
echo         .status-disconnected { background: #f44336; } >> index.html
echo     ^</style^> >> index.html
echo ^</head^> >> index.html
echo ^<body^> >> index.html
echo     ^<nav class="nav"^> >> index.html
echo         ^<div class="nav-content"^> >> index.html
echo             ^<a href="#" class="nav-brand"^>Nam Kovil^</a^> >> index.html
echo             ^<ul class="nav-links"^> >> index.html
echo                 ^<li^>^<a href="#" class="nav-link" onclick="showPage('home')"^>Home^</a^>^</li^> >> index.html
echo                 ^<li^>^<a href="#" class="nav-link" onclick="showPage('members')"^>Members^</a^>^</li^> >> index.html
echo                 ^<li^>^<a href="#" class="nav-link" onclick="showPage('registry')"^>Registry^</a^>^</li^> >> index.html
echo                 ^<li^>^<a href="#" class="nav-link" onclick="showPage('temples')"^>Temples^</a^>^</li^> >> index.html
echo                 ^<li^>^<a href="#" class="nav-link" onclick="showPage('family')"^>Family Tree^</a^>^</li^> >> index.html
echo             ^</ul^> >> index.html
echo         ^</div^> >> index.html
echo     ^</nav^> >> index.html
echo     ^<main class="main-content"^> >> index.html
echo         ^<h1 class="hero-title"^>Nam Kovil Community Portal^</h1^> >> index.html
echo         ^<div class="stats-grid"^> >> index.html
echo             ^<div class="stat-card" onclick="loadMembers()"^> >> index.html
echo                 ^<div class="stat-number" id="memberCount"^>Loading...^</div^> >> index.html
echo                 ^<div class="stat-label"^>Total Members^</div^> >> index.html
echo             ^</div^> >> index.html
echo             ^<div class="stat-card" onclick="loadTemples()"^> >> index.html
echo                 ^<div class="stat-number" id="templeCount"^>Loading...^</div^> >> index.html
echo                 ^<div class="stat-label"^>Temples^</div^> >> index.html
echo             ^</div^> >> index.html
echo             ^<div class="stat-card"^> >> index.html
echo                 ^<div class="stat-number"^>^<span class="status-indicator" id="dbStatus"^>^</span^>DB^</div^> >> index.html
echo                 ^<div class="stat-label"^>Database Status^</div^> >> index.html
echo             ^</div^> >> index.html
echo         ^</div^> >> index.html
echo         ^<div class="content-area" id="contentArea"^> >> index.html
echo             ^<div class="loading"^>Welcome to Nam Kovil Community Portal^</div^> >> index.html
echo         ^</div^> >> index.html
echo     ^</main^> >> index.html
echo     ^<script^> >> index.html
echo         let currentPage = 'home'; >> index.html
echo         let membersData = []; >> index.html
echo         let templesData = []; >> index.html
echo. >> index.html
echo         function showPage(page) { >> index.html
echo             currentPage = page; >> index.html
echo             const contentArea = document.getElementById('contentArea'); >> index.html
echo             const navLinks = document.querySelectorAll('.nav-link'); >> index.html
echo             navLinks.forEach(link =^> link.classList.remove('active')); >> index.html
echo             event.target.classList.add('active'); >> index.html
echo. >> index.html
echo             switch(page) { >> index.html
echo                 case 'home': >> index.html
echo                     contentArea.innerHTML = '^<div class="loading"^>Welcome to Nam Kovil Community Portal^</div^>'; >> index.html
echo                     break; >> index.html
echo                 case 'members': >> index.html
echo                     loadMembers(); >> index.html
echo                     break; >> index.html
echo                 case 'registry': >> index.html
echo                     showRegistry(); >> index.html
echo                     break; >> index.html
echo                 case 'temples': >> index.html
echo                     loadTemples(); >> index.html
echo                     break; >> index.html
echo                 case 'family': >> index.html
echo                     showFamilyTree(); >> index.html
echo                     break; >> index.html
echo             } >> index.html
echo         } >> index.html
echo. >> index.html
echo         async function loadData() { >> index.html
echo             try { >> index.html
echo                 const [membersResponse, templesResponse, healthResponse] = await Promise.all([ >> index.html
echo                     fetch('/api/members'), >> index.html
echo                     fetch('/api/temples'), >> index.html
echo                     fetch('/api/health') >> index.html
echo                 ]); >> index.html
echo. >> index.html
echo                 if (membersResponse.ok) { >> index.html
echo                     membersData = await membersResponse.json(); >> index.html
echo                     document.getElementById('memberCount').textContent = membersData.length; >> index.html
echo                 } >> index.html
echo. >> index.html
echo                 if (templesResponse.ok) { >> index.html
echo                     templesData = await templesResponse.json(); >> index.html
echo                     document.getElementById('templeCount').textContent = templesData.length; >> index.html
echo                 } >> index.html
echo. >> index.html
echo                 if (healthResponse.ok) { >> index.html
echo                     document.getElementById('dbStatus').className = 'status-indicator status-connected'; >> index.html
echo                 } else { >> index.html
echo                     document.getElementById('dbStatus').className = 'status-indicator status-disconnected'; >> index.html
echo                 } >> index.html
echo             } catch (error) { >> index.html
echo                 console.error('Error loading data:', error); >> index.html
echo                 document.getElementById('memberCount').textContent = 'Error'; >> index.html
echo                 document.getElementById('templeCount').textContent = 'Error'; >> index.html
echo                 document.getElementById('dbStatus').className = 'status-indicator status-disconnected'; >> index.html
echo             } >> index.html
echo         } >> index.html
echo. >> index.html
echo         function loadMembers() { >> index.html
echo             const contentArea = document.getElementById('contentArea'); >> index.html
echo             if (membersData.length === 0) { >> index.html
echo                 contentArea.innerHTML = '^<div class="error"^>No members found or failed to load data^</div^>'; >> index.html
echo                 return; >> index.html
echo             } >> index.html
echo. >> index.html
echo             let html = '^<h2^>Members List^</h2^>^<div style="display: grid; gap: 1rem;"^>'; >> index.html
echo             membersData.forEach(member =^> { >> index.html
echo                 html += `^<div style="background: #f9f9f9; padding: 1rem; border-radius: 8px;"^> >> index.html
echo                     ^<h3^>${member.fullName ^|^| member.full_name}^</h3^> >> index.html
echo                     ^<p^>Email: ${member.email ^|^| 'N/A'}^</p^> >> index.html
echo                     ^<p^>Phone: ${member.phone ^|^| 'N/A'}^</p^> >> index.html
echo                     ^<p^>City: ${member.currentCity ^|^| member.current_city ^|^| 'N/A'}^</p^> >> index.html
echo                 ^</div^>`; >> index.html
echo             }); >> index.html
echo             html += '^</div^>'; >> index.html
echo             contentArea.innerHTML = html; >> index.html
echo         } >> index.html
echo. >> index.html
echo         function loadTemples() { >> index.html
echo             const contentArea = document.getElementById('contentArea'); >> index.html
echo             if (templesData.length === 0) { >> index.html
echo                 contentArea.innerHTML = '^<div class="error"^>No temples found or failed to load data^</div^>'; >> index.html
echo                 return; >> index.html
echo             } >> index.html
echo. >> index.html
echo             let html = '^<h2^>Temples List^</h2^>^<div style="display: grid; gap: 1rem;"^>'; >> index.html
echo             templesData.forEach(temple =^> { >> index.html
echo                 html += `^<div style="background: #f9f9f9; padding: 1rem; border-radius: 8px;"^> >> index.html
echo                     ^<h3^>${temple.templeName ^|^| temple.temple_name}^</h3^> >> index.html
echo                     ^<p^>Deity: ${temple.deity ^|^| 'N/A'}^</p^> >> index.html
echo                     ^<p^>Location: ${temple.village ^|^| 'N/A'}, ${temple.state ^|^| 'N/A'}^</p^> >> index.html
echo                 ^</div^>`; >> index.html
echo             }); >> index.html
echo             html += '^</div^>'; >> index.html
echo             contentArea.innerHTML = html; >> index.html
echo         } >> index.html
echo. >> index.html
echo         function showRegistry() { >> index.html
echo             document.getElementById('contentArea').innerHTML = '^<h2^>Member Registry^</h2^>^<p^>Registry form will be implemented here.^</p^>'; >> index.html
echo         } >> index.html
echo. >> index.html
echo         function showFamilyTree() { >> index.html
echo             document.getElementById('contentArea').innerHTML = '^<h2^>Family Tree^</h2^>^<p^>Family tree visualization will be implemented here.^</p^>'; >> index.html
echo         } >> index.html
echo. >> index.html
echo         // Load data when page loads >> index.html
echo         document.addEventListener('DOMContentLoaded', loadData); >> index.html
echo     ^</script^> >> index.html
echo ^</body^> >> index.html
echo ^</html^> >> index.html

echo.
echo ✅ Interface created successfully
echo.

echo Testing database connection...
psql -h localhost -p 5432 -U temple_app -d temple_management -c "SELECT count(*) as member_count FROM members;" 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ Database connection verified
) else (
    echo ⚠️ Database connection test failed
    echo Please ensure PostgreSQL is running and credentials are correct
)

echo.
echo ============================================
echo Nam Kovil Deployment Complete
echo ============================================
echo.
echo Your Nam Kovil application is ready at:
echo http://localhost:8080
echo http://tamilkovil.com:8080
echo.
echo To start the server:
echo node server-with-local-db.js
echo.
pause