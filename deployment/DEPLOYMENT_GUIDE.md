# Nam Kovil - Complete IIS Deployment Guide

## Overview
This guide provides step-by-step instructions to deploy the Nam Kovil Temple Management System to Windows Server with IIS, replicating the exact functionality and appearance of the development environment.

## Prerequisites

### Windows Server Requirements
- **Windows Server 2019/2022** with IIS role installed
- **Node.js 20 LTS** (download from nodejs.org)
- **PostgreSQL 15+** installed and configured
- **IIS URL Rewrite Module** (download from Microsoft)
- **IIS Application Request Routing (ARR)** (download from Microsoft)
- **Administrator privileges** for deployment

### Database Setup
```sql
-- Run these commands in PostgreSQL as superuser
CREATE DATABASE temple_management;
CREATE USER temple_app WITH PASSWORD 'TMS2024SecurePass!';
GRANT ALL PRIVILEGES ON DATABASE temple_management TO temple_app;

-- Verify connection works
psql -h localhost -p 5432 -U temple_app -d temple_management -c "SELECT NOW();"
```

## Deployment Files Structure

Your deployment will create the following structure:
```
C:\inetpub\wwwroot\namkovil\
├── server.js              # Node.js Express server
├── index.html             # React frontend (built)
├── package.json           # Node.js dependencies
├── web.config             # IIS configuration
├── node_modules/          # Dependencies (auto-installed)
└── iisnode/              # IIS Node.js logs
```

## Step-by-Step Deployment

### Step 1: Download Deployment Files
Copy these files from your development environment to Windows Server:
- `deployment/iis-complete-deploy.bat`
- `deployment/server.js`
- `deployment/web.config`
- `deployment/index.html`
- `deployment/package.json` (auto-created by script)

### Step 2: Run Complete Deployment
```batch
# On Windows Server, open Command Prompt as Administrator
cd C:\path\to\deployment\files
iis-complete-deploy.bat
```

The script will automatically:
1. Create deployment directory `C:\inetpub\wwwroot\namkovil`
2. Install Node.js dependencies
3. Configure IIS Application Pool for Node.js
4. Create IIS Application with proper bindings
5. Set up URL rewriting for Single Page Application
6. Configure Windows Firewall
7. Set proper folder permissions
8. Test database connection

### Step 3: Verify Deployment
After deployment completes, test these URLs:

**Main Application:**
- http://localhost:8080/namkovil
- http://tamilkovil.com:8080/namkovil

**API Endpoints:**
- http://localhost:8080/namkovil/api/health
- http://localhost:8080/namkovil/api/members
- http://localhost:8080/namkovil/api/temples
- http://localhost:8080/namkovil/api/relationships

## Expected Functionality

### User Interface Features
The deployed application will have identical functionality to development:

**Navigation Menu (All Clickable):**
- Home - Dashboard with statistics
- Registry - Member registration form
- Members - Member listing and search
- Family Tree - Relationship management
- Temples - Temple information
- Temple Registry - Temple registration
- Temple Members - Members grouped by temple
- WhatsApp - Messaging functionality
- English - Language switcher

**Visual Design:**
- Orange gradient background: `linear-gradient(135deg, #fff8dc 0%, #ffeaa7 100%)`
- Temple gold accents: `#f39c12`
- Sacred brown text: `#8B4513`
- OM symbol (ॐ) branding
- Responsive design for all devices

**Interactive Features:**
- Live member/temple statistics
- Temple selector dropdown
- Real-time search functionality
- Family relationship visualization
- Auto-save form functionality
- Database connectivity indicator

### API Functionality
All APIs will work exactly as in development:

**Members API:**
- GET /api/members - List all members
- POST /api/members - Create new member
- PUT /api/members/:id - Update member
- DELETE /api/members/:id - Delete member

**Temples API:**
- GET /api/temples - List all temples
- POST /api/temples - Create new temple
- PUT /api/temples/:id - Update temple
- DELETE /api/temples/:id - Delete temple

**Relationships API:**
- GET /api/relationships - List all relationships
- POST /api/relationships - Create relationship
- DELETE /api/relationships/:id - Delete relationship

**System API:**
- GET /api/health - Database and system status

## Troubleshooting

### Common Issues and Solutions

**1. IIS Node.js Handler Not Found**
```
Error: The specified module could not be found.
```
Solution: Install IIS Node.js module
```batch
# Download and install iisnode from Microsoft
# Restart IIS after installation
iisreset
```

**2. Database Connection Failed**
```
Error: Database connection failed
```
Solution: Verify PostgreSQL credentials and network access
```sql
-- Test connection manually
psql -h localhost -p 5432 -U temple_app -d temple_management
```

**3. Static Files Not Loading**
```
Error: 404 for CSS/JS files
```
Solution: Check web.config URL rewrite rules and file permissions
```batch
# Reset folder permissions
icacls C:\inetpub\wwwroot\namkovil /grant "IIS_IUSRS:(OI)(CI)F" /T
```

**4. Application Pool Stops Frequently**
```
Error: Application pool keeps stopping
```
Solution: Configure application pool for Node.js
```batch
# Disable idle timeout and periodic restart
%systemroot%\system32\inetsrv\appcmd set apppool "NamKovilAppPool" /processModel.idleTimeout:00:00:00
%systemroot%\system32\inetsrv\appcmd set apppool "NamKovilAppPool" /recycling.periodicRestart.time:00:00:00
```

### Performance Optimization

**1. Enable Static Content Caching**
The web.config includes caching headers for static content.

**2. Configure Connection Pooling**
The Node.js server uses PostgreSQL connection pooling with optimal settings.

**3. Enable Gzip Compression**
Add to web.config if needed:
```xml
<httpCompression directory="%SystemDrive%\inetpub\temp\IIS Temporary Compressed Files">
  <scheme name="gzip" dll="%Windir%\system32\inetsrv\gzip.dll" />
  <dynamicTypes>
    <add mimeType="text/*" enabled="true" />
    <add mimeType="message/*" enabled="true" />
    <add mimeType="application/javascript" enabled="true" />
    <add mimeType="application/json" enabled="true" />
  </dynamicTypes>
</httpCompression>
```

## Management and Monitoring

### IIS Management
- **IIS Manager**: Start → Administrative Tools → IIS Manager
- **Application Pool**: NamKovilAppPool
- **Physical Path**: C:\inetpub\wwwroot\namkovil
- **Logs**: C:\inetpub\wwwroot\namkovil\iisnode\

### Database Management
- **Connection String**: postgresql://temple_app:****@localhost:5432/temple_management
- **Tables**: members, temples, relationships, users
- **Backup**: Regular PostgreSQL backups recommended

### Security Considerations
- **Database Access**: Limited to temple_app user
- **File Permissions**: IIS_IUSRS and IUSR only
- **Network Access**: Firewall rules for port 8080
- **Input Validation**: All APIs use parameterized queries

## Success Criteria

Your deployment is successful when:
1. ✅ Main application loads at http://tamilkovil.com:8080/namkovil
2. ✅ All 9 navigation menu items are clickable and functional
3. ✅ Database statistics display correctly (member count, temple count)
4. ✅ Temple selector dropdown is populated with your temple data
5. ✅ API health check returns "connected" status
6. ✅ Members page displays your existing 47+ members
7. ✅ Visual design matches development exactly (orange gradient, OM symbol)
8. ✅ All forms and search functionality work properly

## Support and Maintenance

### Regular Maintenance
- Monitor IIS application pool performance
- Check database connection health
- Review iisnode logs for errors
- Update Node.js dependencies as needed

### Backup Strategy
- Database: Daily PostgreSQL backups
- Application: Backup entire C:\inetpub\wwwroot\namkovil folder
- Configuration: Export IIS configuration

This deployment provides a production-ready Nam Kovil application that exactly replicates your development environment functionality while leveraging Windows Server and IIS infrastructure.