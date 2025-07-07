# TamilKovil Domain Setup Guide

## Current Configuration
- **Domain**: tamilkovil.com:8080
- **Application Path**: C:\inetpub\TestKovil
- **IIS Binding**: http://tamilkovil.com:8080/

## Quick Setup Steps

### 1. Run Domain Fix Script
```cmd
cd C:\inetpub\TestKovil
fix-tamilkovil-domain.bat
```

### 2. Configure DNS/Hosts File
For local testing, add to `C:\Windows\System32\drivers\etc\hosts`:
```
127.0.0.1 tamilkovil.com
```

### 3. Configure Windows Firewall
Run as Administrator:
```cmd
netsh advfirewall firewall add rule name="Port 8080" dir=in action=allow protocol=TCP localport=8080
```

### 4. Verify IIS Binding
In IIS Manager:
- Site name should point to C:\inetpub\TestKovil
- Binding should be: http tamilkovil.com 8080

### 5. Test Access
- Local: http://localhost:8080/
- Domain: http://tamilkovil.com:8080/
- Health: http://tamilkovil.com:8080/api/health

## Troubleshooting Commands

### Test Domain Configuration
```cmd
test-tamilkovil-domain.bat
```

### Check IIS Status
```cmd
iisreset
%windir%\system32\inetsrv\appcmd list site
```

### Test Server Response
```cmd
curl -H "Host: tamilkovil.com" http://localhost:8080/
```

## Common Issues

1. **Blank Page**: Missing server.js or public files
2. **DNS Issues**: Domain doesn't resolve to server
3. **Firewall**: Port 8080 blocked
4. **IIS Config**: Wrong application path or binding

## File Structure
```
C:\inetpub\TestKovil\
├── server.js (main application)
├── package.json (dependencies)
├── web.config (IIS configuration)
├── public\index.html (frontend)
├── node_modules\ (installed packages)
└── logs\ (application logs)
```

## Expected URLs
- **Main Application**: http://tamilkovil.com:8080/
- **API Health Check**: http://tamilkovil.com:8080/api/health
- **Members API**: http://tamilkovil.com:8080/api/members
- **Temples API**: http://tamilkovil.com:8080/api/temples