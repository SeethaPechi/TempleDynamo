# Nam Kovil - Domain Configuration Guide

## Overview
This guide will help you configure your custom domain to redirect to your Nam Kovil production deployment on Windows Server with IIS.

## Prerequisites
- Your Nam Kovil application deployed using `iis-complete-deploy.bat`
- Custom domain registered and DNS managed by you
- Access to your domain registrar's DNS management panel
- Windows Server with public IP address

## Step 1: DNS Configuration

### A. Point Your Domain to Your Server
Configure these DNS records in your domain registrar's panel:

```
Type    Name    Value                    TTL
A       @       YOUR_SERVER_PUBLIC_IP    3600
A       www     YOUR_SERVER_PUBLIC_IP    3600
CNAME   *       yourdomain.com           3600
```

**Example for domain `namkovil.org`:**
```
A       @       203.0.113.10    3600
A       www     203.0.113.10    3600
CNAME   *       namkovil.org    3600
```

### B. Verify DNS Propagation
Use these tools to verify your DNS is working:
- **nslookup**: `nslookup yourdomain.com`
- **Online tools**: whatsmydns.net, dnschecker.org
- **Command line**: `ping yourdomain.com`

**DNS propagation typically takes 15 minutes to 48 hours**

## Step 2: IIS Domain Binding

### Automatic Configuration (Recommended)
The deployment script will prompt you for your domain:

```batch
# Run the deployment script
iis-complete-deploy.bat

# When prompted, enter your domain:
Domain: yourdomain.com
```

### Manual Configuration (Alternative)
If you need to configure manually later:

```batch
# Add domain bindings
%systemroot%\system32\inetsrv\appcmd set site "Default Web Site" /+bindings.[protocol='http',bindingInformation='*:80:yourdomain.com']
%systemroot%\system32\inetsrv\appcmd set site "Default Web Site" /+bindings.[protocol='http',bindingInformation='*:80:www.yourdomain.com']

# For port 8080 (optional)
%systemroot%\system32\inetsrv\appcmd set site "Default Web Site" /+bindings.[protocol='http',bindingInformation='*:8080:yourdomain.com']
```

## Step 3: SSL/HTTPS Configuration (Optional but Recommended)

### A. Obtain SSL Certificate
**Option 1: Let's Encrypt (Free)**
```batch
# Install win-acme tool
# Download from: https://www.win-acme.com/
win-acme.exe --target manual --host yourdomain.com --webroot C:\inetpub\wwwroot\namkovil
```

**Option 2: Commercial SSL Certificate**
1. Purchase SSL certificate from your preferred provider
2. Generate CSR on Windows Server
3. Install certificate in IIS

### B. Configure HTTPS Redirect
Uncomment the HTTPS redirect rule in `web.config`:

```xml
<!-- Uncomment this section in web.config -->
<rule name="Redirect to HTTPS" stopProcessing="true">
  <match url=".*" />
  <conditions>
    <add input="{HTTPS}" pattern="off" ignoreCase="true" />
  </conditions>
  <action type="Redirect" url="https://{HTTP_HOST}/{R:0}" redirectType="Permanent" />
</rule>
```

## Step 4: Firewall and Network Configuration

### Windows Server Firewall
```batch
# Allow HTTP (port 80)
netsh advfirewall firewall add rule name="Nam Kovil HTTP" dir=in action=allow protocol=TCP localport=80

# Allow HTTPS (port 443) if using SSL
netsh advfirewall firewall add rule name="Nam Kovil HTTPS" dir=in action=allow protocol=TCP localport=443
```

### Router/Cloud Provider Configuration
- **AWS/Azure**: Configure Security Groups to allow ports 80, 443
- **Physical Server**: Configure router port forwarding
- **VPS/Dedicated**: Usually open by default

## Step 5: Testing Your Domain

### Basic Connectivity Test
```batch
# Test DNS resolution
nslookup yourdomain.com

# Test HTTP connectivity
curl -I http://yourdomain.com/namkovil

# Test API endpoints
curl http://yourdomain.com/namkovil/api/health
```

### Full Application Test
1. **Main Application**: `http://yourdomain.com/namkovil`
2. **API Health**: `http://yourdomain.com/namkovil/api/health`
3. **Member List**: `http://yourdomain.com/namkovil/api/members`
4. **Temple List**: `http://yourdomain.com/namkovil/api/temples`

## Step 6: Domain Redirect Configuration

### Canonical Domain Setup
The web.config includes automatic canonical domain redirects:

```xml
<!-- This ensures all traffic goes to your primary domain -->
<rule name="Canonical Domain" stopProcessing="true">
  <match url=".*" />
  <conditions>
    <add input="{HTTP_HOST}" pattern="^(?!yourdomain\.com$).*" />
    <add input="{HTTP_HOST}" pattern="^(?!localhost).*" />
  </conditions>
  <action type="Redirect" url="http://yourdomain.com/{R:0}" redirectType="Permanent" />
</rule>
```

This redirects:
- `www.yourdomain.com` → `yourdomain.com`
- `old-domain.com` → `yourdomain.com`
- Any other domain pointing to your server → `yourdomain.com`

## Common Domain Scenarios

### Scenario 1: Primary Domain (yourdomain.com)
```
DNS: A record @ → YOUR_SERVER_IP
URL: http://yourdomain.com/namkovil
```

### Scenario 2: Subdomain (namkovil.yourdomain.com)
```
DNS: A record namkovil → YOUR_SERVER_IP
URL: http://namkovil.yourdomain.com/
IIS Binding: namkovil.yourdomain.com
```

### Scenario 3: Custom Port
```
DNS: A record @ → YOUR_SERVER_IP
URL: http://yourdomain.com:8080/namkovil
Firewall: Allow port 8080
```

### Scenario 4: Root Domain Redirect
To serve Nam Kovil at the root (`yourdomain.com` instead of `yourdomain.com/namkovil`):

1. **Move application to root:**
```batch
%systemroot%\system32\inetsrv\appcmd delete app "Default Web Site/namkovil"
%systemroot%\system32\inetsrv\appcmd add app /site.name:"Default Web Site" /path:/ /physicalPath:"C:\inetpub\wwwroot\namkovil"
```

2. **Update web.config:** Remove `/namkovil` from all paths

## Troubleshooting

### DNS Issues
```bash
# Check if domain resolves to your server
nslookup yourdomain.com

# Check if server is reachable
ping yourdomain.com

# Test specific port
telnet yourdomain.com 80
```

### IIS Issues
```batch
# Check IIS bindings
%systemroot%\system32\inetsrv\appcmd list sites

# Check application pool status
%systemroot%\system32\inetsrv\appcmd list apppools

# Restart IIS
iisreset
```

### Application Issues
```batch
# Check Node.js logs
type C:\inetpub\wwwroot\namkovil\iisnode\*.log

# Test API directly
curl http://localhost:8080/namkovil/api/health
```

## Security Considerations

### Domain Security
- **DNSSEC**: Enable if supported by your registrar
- **Domain Lock**: Enable domain transfer lock
- **Privacy Protection**: Enable WHOIS privacy

### Server Security
- **SSL Certificate**: Use HTTPS in production
- **Security Headers**: Add security headers to web.config
- **Regular Updates**: Keep Windows Server and IIS updated

### Application Security
- **Database Access**: Restrict PostgreSQL network access
- **File Permissions**: Limit IIS user permissions
- **Backup Strategy**: Regular backups of application and database

## Success Criteria

Your domain setup is successful when:
1. ✅ `http://yourdomain.com/namkovil` loads the Nam Kovil application
2. ✅ All navigation menu items work correctly
3. ✅ Database statistics display your member count
4. ✅ API endpoints respond correctly
5. ✅ `www.yourdomain.com` redirects to `yourdomain.com`
6. ✅ SSL certificate (if configured) shows secure connection

## Support Information

### DNS Record Examples
Replace `yourdomain.com` and `203.0.113.10` with your actual values:

```
yourdomain.com.         3600    IN    A       203.0.113.10
www.yourdomain.com.     3600    IN    A       203.0.113.10
*.yourdomain.com.       3600    IN    CNAME   yourdomain.com.
```

### Final URL Structure
- **Application**: `http://yourdomain.com/namkovil`
- **Member Registry**: `http://yourdomain.com/namkovil#registry`
- **Member List**: `http://yourdomain.com/namkovil#members`
- **Family Tree**: `http://yourdomain.com/namkovil#family-tree`
- **Temples**: `http://yourdomain.com/namkovil#temples`
- **API Health**: `http://yourdomain.com/namkovil/api/health`

This configuration provides a professional domain setup that exactly replicates your development environment functionality while serving from your custom domain.