# TMS Windows Server Deployment Guide

## Quick Start

**Run the complete deployment script:**
```cmd
# Run as Administrator
complete-deployment.bat
```

This single script will:
- Check all prerequisites
- Set up the database
- Install dependencies  
- Configure IIS
- Test the application

## Manual Deployment Steps

### 1. Prerequisites
- Windows Server with IIS installed
- Node.js 18+ installed
- PostgreSQL 12+ installed
- Administrator access

### 2. Database Setup
```cmd
setup-database.bat
```
Creates `temple_management` database with user `temple_app`

### 3. Application Installation
```cmd
install-dependencies.bat
```
Installs Node.js packages for production

### 4. Test Application
```cmd
test-application.bat
```
Verifies database connection and server startup

## File Structure

```
C:\inetpub\wwwroot\tms\
├── server.js                 # Main application server
├── package.json              # Dependencies
├── web.config                # IIS configuration
├── .env                      # Environment variables
├── database-schema.sql       # Database tables
├── sample-data.sql          # Sample data
├── logs/                    # Application logs
└── public/                  # Static files (frontend)
```

## Configuration Files

### `.env` (Environment Variables)
```
NODE_ENV=production
PORT=8080
PGHOST=localhost
PGPORT=5432
PGDATABASE=temple_management
PGUSER=temple_app
PGPASSWORD=TMS2024SecurePass!
```

### Database Connection
- **Host**: localhost:5432
- **Database**: temple_management  
- **Username**: temple_app
- **Password**: TMS2024SecurePass!

## Access URLs

- **Application**: http://localhost:8080/tms
- **Health Check**: http://localhost:8080/tms/api/health
- **API Base**: http://localhost:8080/tms/api

## Troubleshooting

### Database Connection Issues

**Error**: "unable to connect local postgres db"

**Solutions**:
1. Check PostgreSQL service is running:
   ```cmd
   services.msc
   # Look for "postgresql-x64-xx" service
   ```

2. Test manual connection:
   ```cmd
   psql -h localhost -p 5432 -U temple_app -d temple_management
   ```

3. Check pg_hba.conf authentication:
   ```
   # Add this line to pg_hba.conf:
   local   all             temple_app                              md5
   host    all             temple_app      127.0.0.1/32           md5
   ```

4. Restart PostgreSQL after changes:
   ```cmd
   net stop postgresql-x64-xx
   net start postgresql-x64-xx
   ```

### IIS Configuration Issues

**Error**: HTTP 500.19 - Invalid web.config

**Solution**: Use the simple web.config:
```cmd
copy web.config.simple web.config
```

**Error**: HTTP 502.3 - Application pool stopped

**Solutions**:
1. Check application pool settings:
   - Set to "No Managed Code"
   - Enable 32-bit applications if needed

2. Check iisnode installation:
   ```cmd
   # Install iisnode from: https://github.com/azure/iisnode
   ```

### Application Issues

**Error**: Module not found

**Solution**: Reinstall dependencies:
```cmd
cd C:\inetpub\wwwroot\tms
install-dependencies.bat
```

**Error**: Permission denied

**Solution**: Set IIS permissions:
```cmd
icacls "C:\inetpub\wwwroot\tms" /grant "IIS_IUSRS:(OI)(CI)F" /T
```

## Production Checklist

- [ ] PostgreSQL service running
- [ ] Database `temple_management` created
- [ ] User `temple_app` has proper permissions
- [ ] Node.js dependencies installed
- [ ] IIS application pool configured
- [ ] Application responds to health check
- [ ] Static files loading correctly
- [ ] Database queries working

## Security Notes

- Change default password `TMS2024SecurePass!` in production
- Update SESSION_SECRET in `.env` file
- Configure firewall rules for database port
- Enable SSL for production deployment
- Regular security updates for all components

## Support

For issues not covered in this guide:
1. Check Windows Event Viewer for IIS errors
2. Check application logs in `C:\inetpub\wwwroot\tms\logs`
3. Test database connectivity manually
4. Verify all services are running

## Performance Optimization

- Enable IIS compression in web.config
- Configure connection pooling in application
- Set appropriate timeout values
- Monitor memory usage and adjust pool settings
- Use production NODE_ENV setting