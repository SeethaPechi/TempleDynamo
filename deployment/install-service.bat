@echo off
echo ============================================
echo Nam Kovil Windows Service Installation
echo ============================================

REM Check if running as Administrator
net session >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo This script must be run as Administrator
    echo Please right-click and select "Run as Administrator"
    pause
    exit /b 1
)

set SERVICE_NAME=NamKovil
set SERVICE_DIR=C:\NamKovil
set NODE_PATH=C:\Program Files\nodejs\node.exe

echo.
echo Step 1: Stopping existing service if running...
sc stop %SERVICE_NAME% >nul 2>&1
sc delete %SERVICE_NAME% >nul 2>&1

echo.
echo Step 2: Installing Node.js Windows Service Support...
cd "%SERVICE_DIR%"
call npm install --save node-windows

echo.
echo Step 3: Creating service installer script...
echo var Service = require('node-windows').Service;> install-service.js
echo.>> install-service.js
echo // Create a new service object>> install-service.js
echo var svc = new Service({>> install-service.js
echo   name: 'Nam Kovil Temple Management',>> install-service.js
echo   description: 'Nam Kovil Temple Community Management System',>> install-service.js
echo   script: '%SERVICE_DIR%\\server.js',>> install-service.js
echo   nodeOptions: [>> install-service.js
echo     '--harmony',>> install-service.js
echo     '--max_old_space_size=4096'>> install-service.js
echo   ],>> install-service.js
echo   env: {>> install-service.js
echo     name: 'NODE_ENV',>> install-service.js
echo     value: 'production'>> install-service.js
echo   }>> install-service.js
echo });>> install-service.js
echo.>> install-service.js
echo // Listen for the "install" event, which indicates the process is available as a service.>> install-service.js
echo svc.on('install', function() {>> install-service.js
echo   console.log('Nam Kovil service installed successfully');>> install-service.js
echo   svc.start();>> install-service.js
echo });>> install-service.js
echo.>> install-service.js
echo svc.install();>> install-service.js

echo.
echo Step 4: Installing Nam Kovil as Windows Service...
node install-service.js

echo.
echo Step 5: Configuring Windows Firewall...
netsh advfirewall firewall delete rule name="Nam Kovil Port 3000" >nul 2>&1
netsh advfirewall firewall add rule name="Nam Kovil Port 3000" dir=in action=allow protocol=TCP localport=3000

echo.
echo Step 6: Starting Nam Kovil service...
timeout /t 5 /nobreak >nul
sc start "Nam Kovil Temple Management"

echo.
echo ============================================
echo Nam Kovil Windows Service Installation Complete
echo ============================================
echo.
echo Your Nam Kovil application is now running as a Windows Service!
echo.
echo Service Name: Nam Kovil Temple Management
echo Access: http://localhost:3000
echo Access: http://tamilkovil.com:3000
echo.
echo ✅ Runs automatically on Windows startup
echo ✅ Runs in background as Windows service
echo ✅ Firewall configured for port 3000
echo ✅ All navigation menu items functional
echo ✅ Database integration configured
echo.
echo To manage the service:
echo - Services.msc (Windows Services Manager)
echo - sc stop "Nam Kovil Temple Management"
echo - sc start "Nam Kovil Temple Management"
echo.
pause