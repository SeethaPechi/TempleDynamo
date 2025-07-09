# IONOS Domain Redirect to Replit Setup Guide

## Overview
This guide shows you how to redirect your existing IONOS domain to your Nam Kovil application deployed on Replit at `tamilkovil.replit.app`.

## Step 1: Deploy to Replit First

### Deploy Your Application
1. **Click the Deploy button** in your Replit interface
2. **Wait for deployment to complete** - you'll get a URL like `tamilkovil.replit.app`
3. **Test the Replit URL** to ensure everything works correctly

### Verify Replit Deployment
Your Nam Kovil application should be accessible at:
- **Main App**: `https://tamilkovil.replit.app`
- **API Health**: `https://tamilkovil.replit.app/api/health`
- **Member List**: `https://tamilkovil.replit.app/api/members`

## Step 2: IONOS DNS Configuration

### Method 1: CNAME Redirect (Recommended)

**Login to IONOS Control Panel:**
1. Go to [ionos.com](https://www.ionos.com) and login
2. Navigate to **Domains & SSL** → **Domains**
3. Click on your domain name
4. Go to **DNS** settings

**Configure DNS Records:**
```
Type    Name    Value                    TTL
CNAME   @       tamilkovil.replit.app    3600
CNAME   www     tamilkovil.replit.app    3600
```

**Important Notes:**
- Some registrars don't allow CNAME for root domain (@)
- If CNAME @ fails, use Method 2 (A Record + Redirect)

### Method 2: A Record + HTTP Redirect

**If CNAME doesn't work for root domain:**

1. **Get Replit's IP Address:**
```bash
# Run this command to get the IP
nslookup tamilkovil.replit.app
# or
dig tamilkovil.replit.app
```

2. **Configure DNS Records:**
```
Type    Name    Value                    TTL
A       @       REPLIT_IP_ADDRESS       3600
CNAME   www     tamilkovil.replit.app    3600
```

3. **Set up HTTP Redirect in IONOS:**
   - In IONOS control panel, find **Website Redirect** or **URL Forwarding**
   - Redirect `yourdomain.com` → `https://tamilkovil.replit.app`
   - Enable **301 Permanent Redirect**

### Method 3: IONOS Web Redirect Service

**Using IONOS Built-in Redirect:**
1. In IONOS control panel, go to **Website & Shops**
2. Select **Redirect Domain**
3. Configure redirect:
   - **Source**: `yourdomain.com`
   - **Target**: `https://tamilkovil.replit.app`
   - **Type**: 301 Permanent Redirect
   - **Include Path**: Yes (recommended)

## Step 3: Advanced Redirect Options

### Option A: Simple Domain Redirect
**Result**: `yourdomain.com` → `tamilkovil.replit.app`
- Users see the Replit URL in their browser
- Simplest setup, works immediately

### Option B: Transparent Proxy (Advanced)
**Result**: Users see `yourdomain.com` but content from Replit
- Requires IONOS hosting plan with PHP/Apache
- More complex but cleaner URLs

**Create `.htaccess` file in IONOS web space:**
```apache
RewriteEngine On
RewriteCond %{HTTP_HOST} ^yourdomain\.com$ [NC,OR]
RewriteCond %{HTTP_HOST} ^www\.yourdomain\.com$ [NC]
RewriteRule ^(.*)$ https://tamilkovil.replit.app/$1 [P,L]

# Optional: Hide Replit branding
Header always edit Set-Cookie "^(.*)$" "$1; SameSite=None; Secure"
ProxyPreserveHost On
ProxyPassReverse / https://tamilkovil.replit.app/
```

### Option C: Subdomain Redirect
**Setup**: `app.yourdomain.com` → `tamilkovil.replit.app`

**DNS Configuration:**
```
Type    Name    Value                    TTL
CNAME   app     tamilkovil.replit.app    3600
```

## Step 4: SSL/HTTPS Configuration

### Replit Automatic SSL
- Replit provides free SSL certificates automatically
- Your app will be available at `https://tamilkovil.replit.app`

### IONOS SSL for Your Domain
**If using transparent proxy (Option B):**
1. Purchase SSL certificate from IONOS
2. Install on your domain
3. Configure HTTPS redirect

**Free SSL Option:**
- Use Cloudflare as DNS provider (free SSL included)
- Point your domain to Cloudflare
- Configure Cloudflare to redirect to Replit

## Step 5: Testing Your Setup

### DNS Propagation Check
```bash
# Check if your domain resolves correctly
nslookup yourdomain.com

# Test the redirect
curl -I http://yourdomain.com

# Should show 301/302 redirect to tamilkovil.replit.app
```

### Online Testing Tools
- **DNS Checker**: [dnschecker.org](https://dnschecker.org)
- **Redirect Checker**: [httpstatus.io](https://httpstatus.io)
- **SSL Test**: [ssllabs.com](https://www.ssllabs.com/ssltest/)

### Full Application Test
1. **Visit**: `http://yourdomain.com`
2. **Should redirect to**: `https://tamilkovil.replit.app`
3. **Verify**: All navigation menu items work
4. **Test**: Member registration and temple data

## Step 6: IONOS-Specific Instructions

### Access IONOS Control Panel
1. Login at [ionos.com](https://www.ionos.com)
2. Go to **Control Panel** → **Domains & SSL**
3. Select your domain

### DNS Management
1. Click **DNS** in the domain menu
2. **Delete existing A records** if any
3. **Add new records** as shown above
4. **Save changes**

### URL Redirect Setup
1. Go to **Website & Shops** → **Website Builder**
2. Select **Domain Redirect**
3. Configure:
   - **Domain**: yourdomain.com
   - **Target URL**: https://tamilkovil.replit.app
   - **Redirect type**: 301 Permanent
   - **Forward path**: Yes

### Common IONOS Settings
```
Domain: yourdomain.com
Target: https://tamilkovil.replit.app
Type: 301 Permanent Redirect
Preserve Path: Yes
Include WWW: Yes
```

## Step 7: Verification Checklist

✅ **Replit deployment is working**
- `https://tamilkovil.replit.app` loads correctly
- All 9 navigation menu items functional
- Database statistics showing correct member count

✅ **DNS configuration complete**
- A or CNAME records pointing to Replit
- WWW subdomain configured
- TTL set appropriately (3600 seconds)

✅ **Redirect working**
- `http://yourdomain.com` redirects to Replit
- `http://www.yourdomain.com` redirects to Replit
- Mobile and desktop browsers both work

✅ **SSL/HTTPS working**
- Secure connection established
- No certificate warnings
- Mixed content issues resolved

## Troubleshooting

### DNS Issues
**Problem**: Domain doesn't resolve
**Solution**: 
- Check DNS propagation (takes 15min-48hrs)
- Verify correct IP/CNAME values
- Clear browser DNS cache

### Redirect Issues
**Problem**: Domain loads but doesn't redirect
**Solution**:
- Check IONOS redirect configuration
- Verify 301 redirect is enabled
- Test with different browsers

### SSL Issues
**Problem**: Certificate warnings
**Solution**:
- Replit handles SSL automatically
- Ensure redirect uses HTTPS (not HTTP)
- Check mixed content issues

### IONOS-Specific Issues
**Problem**: CNAME not working for root domain
**Solution**:
- Use IONOS redirect service instead
- Or use A record + manual redirect
- Contact IONOS support for assistance

## Timeline Expectations

- **DNS Changes**: 15 minutes to 48 hours
- **IONOS Redirect**: Usually immediate
- **SSL Certificate**: Automatic with Replit
- **Full Propagation**: Up to 48 hours globally

## Alternative Solutions

### If IONOS Doesn't Support Your Needs:

**Option 1: Transfer DNS to Cloudflare**
- Keep domain registered with IONOS
- Use Cloudflare for DNS (free)
- Better redirect and SSL options

**Option 2: Use Subdomain**
- `app.yourdomain.com` → `tamilkovil.replit.app`
- Easier to configure
- Still professional appearance

**Option 3: Keep Both Deployments**
- Replit for development/staging
- Windows Server for production
- Use IONOS to point to Windows Server

## Success Criteria

Your setup is successful when:
1. ✅ `yourdomain.com` automatically redirects to `tamilkovil.replit.app`
2. ✅ All Nam Kovil features work correctly on Replit
3. ✅ SSL certificate shows secure connection
4. ✅ Database statistics display your 47+ members
5. ✅ Both mobile and desktop access work perfectly
6. ✅ All 9 navigation menu items are functional

## Final Result

**User Experience:**
1. User types `yourdomain.com` in browser
2. Automatically redirected to `https://tamilkovil.replit.app`
3. Sees complete Nam Kovil application with all features
4. Professional appearance with SSL security
5. All functionality exactly as in development

This setup gives you the best of both worlds: your custom domain for branding and Replit's reliable hosting infrastructure for your Nam Kovil temple management system.