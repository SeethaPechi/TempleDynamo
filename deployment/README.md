# Temple Management System - IIS Deployment Guide

## Overview
This guide provides step-by-step instructions for deploying the Temple Management System on Windows IIS with Node.js support.

## Prerequisites

### Server Requirements
- Windows Server 2016/2019/2022 or Windows 10/11
- IIS (Internet Information Services) enabled
- Node.js 18.x or higher
- PostgreSQL 12+ database server
- iisnode module for IIS

### Software Installation
1. **Install Node.js**: Download from https://nodejs.org (LTS version recommended)
2. **Install iisnode**: Download from https://github.com/Azure/iisnode/releases
3. **Install PostgreSQL**: Download from https://www.postgresql.org/download/

## Database Setup

### 1. Create Database
```sql
-- Connect to PostgreSQL as superuser
CREATE DATABASE temple_management;
CREATE USER temple_app WITH PASSWORD 'secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE temple_management TO temple_app;
```

### 2. Initialize Schema
```bash
# Navigate to deployment folder
cd deployment
# Run schema creation
psql -h localhost -U temple_app -d temple_management -f database-schema.sql
# Insert sample data (optional)
psql -h localhost -U temple_app -d temple_management -f sample-data.sql
```

## Application Deployment

### 1. Prepare Application Files
Copy the following files to your IIS web directory (e.g., `C:\inetpub\wwwroot\temple-app\`):
- `server.js` (main application file)
- `package.json` (dependencies)
- `web.config` (IIS configuration)
- `public/` folder (static files - create after build)

### 2. Install Dependencies
```bash
# Navigate to application directory
cd C:\inetpub\wwwroot\temple-app\
# Install production dependencies
npm install --production
```

### 3. Configure Environment Variables
Create `.env` file in application root:
```
NODE_ENV=production
DATABASE_URL=postgresql://temple_app:secure_password_here@localhost:5432/temple_management
PORT=5000
SESSION_SECRET=your_secure_session_secret_here
```

### 4. IIS Configuration

#### Create Application Pool
1. Open IIS Manager
2. Right-click "Application Pools" → "Add Application Pool"
3. Name: `TempleManagementPool`
4. .NET CLR Version: `No Managed Code`
5. Managed Pipeline Mode: `Integrated`

#### Create Website
1. Right-click "Sites" → "Add Website"
2. Site name: `Temple Management System`
3. Application pool: `TempleManagementPool`
4. Physical path: `C:\inetpub\wwwroot\temple-app\`
5. Port: `80` (or your preferred port)

#### Configure URL Rewrite
Ensure the `web.config` file is in the application root. This handles routing for the React frontend.

## Security Configuration

### 1. File Permissions
Set appropriate permissions for the application folder:
- IIS_IUSRS: Read & Execute
- Application Pool Identity: Full Control

### 2. Firewall
Open necessary ports in Windows Firewall:
- HTTP: Port 80
- HTTPS: Port 443 (if using SSL)
- PostgreSQL: Port 5432 (for database access)

### 3. SSL Certificate (Recommended)
1. Obtain SSL certificate from trusted CA
2. Install certificate in IIS
3. Configure HTTPS binding
4. Redirect HTTP to HTTPS

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `production` |
| `DATABASE_URL` | PostgreSQL connection | `postgresql://user:pass@host:port/db` |
| `PORT` | Application port | `5000` |
| `SESSION_SECRET` | Session encryption key | `random_secure_string` |

## Monitoring and Maintenance

### Log Files
- Application logs: `logs/` directory
- IIS logs: `C:\inetpub\logs\LogFiles\`
- Node.js logs: Check iisnode logs in application directory

### Health Check
Access: `http://your-domain/health`
Should return: `{"status":"healthy","timestamp":"...","version":"1.0.0"}`

### Database Backup
```bash
# Create backup
pg_dump -h localhost -U temple_app temple_management > backup_$(date +%Y%m%d).sql

# Restore backup
psql -h localhost -U temple_app -d temple_management < backup_20241230.sql
```

## Troubleshooting

### Common Issues

#### 1. Node.js Not Found
- Ensure Node.js is installed and in system PATH
- Restart IIS after Node.js installation

#### 2. Database Connection Error
- Verify PostgreSQL service is running
- Check DATABASE_URL environment variable
- Test connection: `psql -h localhost -U temple_app -d temple_management`

#### 3. Static Files Not Loading
- Verify `public/` folder exists and contains built files
- Check file permissions
- Review IIS URL Rewrite rules

#### 4. Application Pool Crashes
- Check Windows Event Viewer
- Review iisnode logs
- Verify Node.js application starts manually: `node server.js`

### Performance Optimization

1. **Enable Compression**: Already configured in `web.config`
2. **Static File Caching**: Set appropriate cache headers
3. **Database Indexing**: Monitor query performance
4. **Memory Management**: Configure Node.js memory limits if needed

## Support

For technical support or questions:
1. Check application logs for error details
2. Review this documentation
3. Test database connectivity
4. Verify IIS configuration matches this guide

## Version Information
- Application Version: 1.0.0
- Node.js: 18.x+
- PostgreSQL: 12+
- IIS: 10.0+