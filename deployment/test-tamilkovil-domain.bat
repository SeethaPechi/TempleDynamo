@echo off
REM Test TamilKovil Domain Configuration

echo ============================================
echo TamilKovil Domain Test - tamilkovil.com:8080
echo ============================================

cd "C:\inetpub\TestKovil"

echo Step 1: Checking IIS Site Binding...
echo Current IIS sites and bindings:
%windir%\system32\inetsrv\appcmd list site | findstr tamilkovil
if %ERRORLEVEL% NEQ 0 (
    echo Checking for any site on port 8080...
    %windir%\system32\inetsrv\appcmd list site | findstr 8080
)

echo.
echo Step 2: Testing DNS Resolution...
echo Checking if tamilkovil.com resolves...
nslookup tamilkovil.com
echo.
ping tamilkovil.com -n 1

echo.
echo Step 3: Testing Local Host File...
echo Checking Windows hosts file for tamilkovil.com...
findstr /C:"tamilkovil.com" C:\Windows\System32\drivers\etc\hosts
if %ERRORLEVEL% NEQ 0 (
    echo tamilkovil.com not found in hosts file
    echo To test locally, add this line to C:\Windows\System32\drivers\etc\hosts:
    echo 127.0.0.1 tamilkovil.com
)

echo.
echo Step 4: Testing Port 8080 Connectivity...
echo Testing if port 8080 is listening...
netstat -an | findstr :8080
if %ERRORLEVEL% EQU 0 (
    echo ✅ Port 8080 is active
) else (
    echo ❌ Port 8080 not listening
)

echo.
echo Step 5: Testing Different Access Methods...

echo Testing localhost:8080...
curl -s -m 5 http://localhost:8080/ | findstr /C:"Tamil" >nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ localhost:8080 works
) else (
    echo ❌ localhost:8080 not responding
)

echo Testing with Host header...
curl -s -m 5 -H "Host: tamilkovil.com" http://localhost:8080/ | findstr /C:"Tamil" >nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ Host header test works
) else (
    echo ❌ Host header test failed
)

echo Testing direct domain (if DNS works^)...
curl -s -m 10 http://tamilkovil.com:8080/ | findstr /C:"Tamil" >nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ tamilkovil.com:8080 works
) else (
    echo ❌ tamilkovil.com:8080 not accessible
)

echo.
echo Step 6: Checking Windows Firewall...
echo Checking if port 8080 is allowed...
netsh advfirewall firewall show rule name="Port 8080" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ✅ Firewall rule for port 8080 exists
) else (
    echo ❌ No firewall rule for port 8080
    echo To create firewall rule, run as Administrator:
    echo netsh advfirewall firewall add rule name="Port 8080" dir=in action=allow protocol=TCP localport=8080
)

echo.
echo Step 7: Application Files Check...
if exist "server.js" (
    echo ✅ server.js exists
) else (
    echo ❌ server.js missing
)

if exist "public\index.html" (
    echo ✅ public\index.html exists
) else (
    echo ❌ public\index.html missing
)

echo.
echo ============================================
echo Domain Test Summary
echo ============================================
echo.
echo Expected access: http://tamilkovil.com:8080/
echo Application path: C:\inetpub\TestKovil
echo.
echo Common domain issues:
echo 1. DNS not pointing to this server
echo 2. Windows hosts file missing entry
echo 3. IIS binding not configured correctly
echo 4. Windows Firewall blocking port 8080
echo 5. Application not starting properly
echo.
echo Quick fixes:
echo 1. Add to hosts file: 127.0.0.1 tamilkovil.com
echo 2. Create firewall rule for port 8080
echo 3. Restart IIS: iisreset
echo 4. Check IIS site binding in IIS Manager
echo.
pause