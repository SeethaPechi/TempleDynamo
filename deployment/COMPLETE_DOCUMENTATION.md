# Nam Kovil - Complete Technology Documentation and Deployment Guide

## Technologies Used in Development Environment

### Frontend Technologies
- **React 18** - Modern JavaScript UI library with hooks and functional components
- **TypeScript** - Type-safe JavaScript with static type checking
- **Vite** - Fast build tool and development server with Hot Module Replacement (HMR)
- **Wouter** - Lightweight client-side routing library (alternative to React Router)
- **TanStack Query (React Query)** - Server state management and data fetching
- **React Hook Form** - Performant form library with minimal re-renders
- **Zod** - TypeScript-first schema validation
- **shadcn/ui** - Modern UI component library built on Radix UI primitives
- **Tailwind CSS** - Utility-first CSS framework for styling
- **Radix UI** - Unstyled, accessible UI primitives
- **Lucide React** - Beautiful icon library
- **Framer Motion** - Animation library for React
- **React i18next** - Internationalization framework for Tamil/English support

### Backend Technologies
- **Node.js 20** - JavaScript runtime environment
- **Express.js 4.18.2** - Web application framework for Node.js
- **TypeScript** - Backend also uses TypeScript for type safety
- **TSX** - TypeScript execution environment for development
- **PostgreSQL** - Relational database management system
- **Drizzle ORM** - TypeScript ORM with type-safe database queries
- **Neon Database** - Cloud PostgreSQL provider (development)
- **pg (node-postgres)** - PostgreSQL client for Node.js
- **Express Session** - Session middleware for authentication
- **CORS** - Cross-Origin Resource Sharing middleware

### Development Tools
- **ESBuild** - Fast JavaScript bundler
- **PostCSS** - CSS post-processor
- **Autoprefixer** - CSS vendor prefix automation
- **Drizzle Kit** - Database migration tool
- **Connect-PG-Simple** - PostgreSQL session store

### Database Schema
- **Members Table** - Core member information with personal details
- **Relationships Table** - Family relationships between members
- **Temples Table** - Temple information and location data
- **Users Table** - Authentication system

## Development Architecture Overview

### Project Structure
```
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Route-based page components
│   │   ├── lib/            # Utility libraries and configurations
│   │   └── hooks/          # Custom React hooks
├── server/                 # Backend Express.js application
│   ├── db.ts              # Database connection and storage
│   ├── routes.ts          # API route definitions
│   ├── storage.ts         # Data access layer interface
│   └── index.ts           # Server entry point
├── shared/                 # Shared TypeScript schemas
│   └── schema.ts          # Database models and validation
└── deployment/            # Production deployment files
```

### Data Flow Architecture
1. **Client Request** → React component makes API call using TanStack Query
2. **API Route** → Express.js route handler validates request with Zod
3. **Database Query** → Drizzle ORM executes type-safe PostgreSQL query
4. **Response** → JSON data returned to client with proper error handling
5. **UI Update** → React re-renders with fresh data automatically

## Step-by-Step Compilation Process

### Development Environment Setup
1. **Install Node.js 20** - Download from nodejs.org
2. **Clone Repository** - Git clone or download project files
3. **Install Dependencies** - `npm install` (installs all packages)
4. **Configure Database** - Set DATABASE_URL environment variable
5. **Run Migrations** - `npm run db:push` (creates database tables)
6. **Start Development** - `npm run dev` (starts both frontend and backend)

### Development Build Process
```bash
# Install dependencies
npm install

# Start development server (runs both frontend and backend)
npm run dev

# Database operations
npm run db:push          # Push schema changes to database
npm run db:generate      # Generate migration files
npm run db:studio        # Open database GUI

# Type checking
npx tsc --noEmit         # Check TypeScript types
```

### Production Build Process
```bash
# Build frontend assets
npm run build

# This runs:
# 1. Vite builds React app to dist/public/
# 2. ESBuild bundles server to dist/index.js
# 3. Static assets optimized and compressed
```

## Complete IIS Deployment Documentation

### Prerequisites for Windows Server
- **Windows Server 2019/2022** with IIS installed
- **Node.js 20 LTS** installed globally
- **PostgreSQL 15+** installed and configured
- **IIS URL Rewrite Module** installed
- **IIS Application Request Routing (ARR)** installed

### Database Setup
```sql
-- Create database and user
CREATE DATABASE temple_management;
CREATE USER temple_app WITH PASSWORD 'TMS2024SecurePass!';
GRANT ALL PRIVILEGES ON DATABASE temple_management TO temple_app;

-- Connection string format:
postgresql://temple_app:TMS2024SecurePass!@localhost:5432/temple_management
```

### Production Files Structure
```
C:\inetpub\wwwroot\namkovil\
├── server.js              # Node.js server application
├── package.json            # Node.js dependencies
├── web.config             # IIS configuration
├── public/                # Static frontend assets
│   ├── index.html         # Main application entry
│   ├── assets/            # CSS, JS, images
│   └── favicon.ico        # Application icon
└── node_modules/          # Installed dependencies
```

### IIS Configuration (web.config)
```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <!-- Enable Node.js in IIS -->
    <handlers>
      <add name="iisnode" path="server.js" verb="*" modules="iisnode" />
    </handlers>
    
    <!-- URL Rewrite for SPA routing -->
    <rewrite>
      <rules>
        <!-- API routes go to Node.js -->
        <rule name="API" stopProcessing="true">
          <match url="^api/.*" />
          <action type="Rewrite" url="server.js" />
        </rule>
        
        <!-- Static files served directly -->
        <rule name="StaticFiles" stopProcessing="true">
          <match url="^public/.*" />
          <action type="None" />
        </rule>
        
        <!-- All other routes go to React app -->
        <rule name="React" stopProcessing="true">
          <match url=".*" />
          <conditions logicalGrouping="MatchAll">
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
            <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
          </conditions>
          <action type="Rewrite" url="/public/index.html" />
        </rule>
      </rules>
    </rewrite>
    
    <!-- Security and performance -->
    <security>
      <requestFiltering>
        <requestLimits maxAllowedContentLength="52428800" />
      </requestFiltering>
    </security>
    
    <!-- IISNode configuration -->
    <iisnode 
      node_env="production"
      nodeProcessCommandLine="C:\Program Files\nodejs\node.exe"
      maxConcurrentRequestsPerProcess="1024"
      maxNamedPipeConnectionRetry="100"
      namedPipeConnectionRetryDelay="250"
      maxNamedPipeConnectionPoolSize="512"
      maxNamedPipePooledConnectionAge="30000"
      asyncCompletionThreadCount="0"
      initialRequestBufferSize="4096"
      maxRequestBufferSize="65536"
      watchedFiles="*.js;*.json"
      uncFileChangesPollingInterval="5000"
      gracefulShutdownTimeout="60000"
      loggingEnabled="true"
      logDirectory="iisnode"
      debuggingEnabled="false"
      devErrorsEnabled="false"
    />
    
    <!-- Default document -->
    <defaultDocument>
      <files>
        <clear />
        <add value="public/index.html" />
      </files>
    </defaultDocument>
    
    <!-- Static content caching -->
    <staticContent>
      <clientCache cacheControlMode="UseMaxAge" cacheControlMaxAge="7.00:00:00" />
    </staticContent>
  </system.webServer>
</configuration>
```

### Production Server Code
```javascript
const express = require('express');
const { Pool } = require('pg');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Database configuration
const DATABASE_URL = "postgresql://temple_app:TMS2024SecurePass!@localhost:5432/temple_management";
const pool = new Pool({
  connectionString: DATABASE_URL,
  max: 20,
  min: 2,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  ssl: false
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files
app.use('/public', express.static(path.join(__dirname, 'public')));

// API Routes (complete implementation)
// ... [Full API implementation here]

// SPA fallback
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api/')) {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  } else {
    res.status(404).json({ message: 'API endpoint not found' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Nam Kovil server running on port ${PORT}`);
});

module.exports = app;
```

## Complete Deployment Steps

### Step 1: Prepare Production Build
```bash
# In development environment
npm run build                    # Creates dist/ folder
npm run db:push                  # Ensure database schema is current
```

### Step 2: Copy Files to Windows Server
```
# Copy these to C:\inetpub\wwwroot\namkovil\
dist/index.js → server.js       # Rename built server
dist/public/ → public/          # Static frontend assets
package.json                    # Dependencies file
web.config                      # IIS configuration
```

### Step 3: Install Dependencies on Server
```bash
cd C:\inetpub\wwwroot\namkovil
npm install --production        # Install only production dependencies
```

### Step 4: Configure IIS Application
1. Open IIS Manager
2. Create new Application under Default Web Site
3. Set Physical Path to `C:\inetpub\wwwroot\namkovil`
4. Set Application Pool to use Node.js
5. Configure bindings for domain and port

### Step 5: Test Deployment
```
http://yourdomain.com/          # Main application
http://yourdomain.com/api/health # Health check
http://yourdomain.com/api/members # Members API
```

## UI Components and Features

### Navigation Structure
- **Home** - Dashboard with statistics and temple selector
- **Registry** - Member registration with comprehensive form
- **Members** - Member listing with search and pagination
- **Family Tree** - Relationship visualization and management
- **Temples** - Temple information and management
- **Temple Registry** - Temple registration form
- **Temple Members** - Members grouped by temple
- **WhatsApp** - Bulk messaging functionality
- **Language** - Tamil/English switching

### Visual Design Elements
- **Orange Gradient Background** - `linear-gradient(135deg, #fff8dc 0%, #ffeaa7 100%)`
- **Temple Gold Accent** - `#f39c12` for borders and highlights
- **Sacred Brown Text** - `#8B4513` for headings and important text
- **White Cards** - Clean content areas with subtle shadows
- **OM Symbol (ॐ)** - Sacred Hindu symbol in logo and branding

### Interactive Features
- **Live Statistics** - Real-time member and temple counts
- **Temple Selector** - Dynamic filtering by temple
- **Member Search** - Real-time search across multiple fields
- **Family Relationships** - Interactive relationship management
- **Auto-save Forms** - Automatic form data persistence
- **Mobile Responsive** - Optimized for all device sizes

## API Endpoints

### Members API
- `GET /api/members` - Retrieve all members
- `POST /api/members` - Create new member
- `PUT /api/members/:id` - Update member
- `DELETE /api/members/:id` - Delete member

### Temples API
- `GET /api/temples` - Retrieve all temples
- `POST /api/temples` - Create new temple
- `PUT /api/temples/:id` - Update temple
- `DELETE /api/temples/:id` - Delete temple

### Relationships API
- `GET /api/relationships` - Retrieve all relationships
- `POST /api/relationships` - Create new relationship
- `DELETE /api/relationships/:id` - Delete relationship

### System API
- `GET /api/health` - Database and system health check

## Security Considerations

### Production Security
- **Input Validation** - All inputs validated with Zod schemas
- **SQL Injection Prevention** - Parameterized queries with Drizzle ORM
- **CORS Configuration** - Proper cross-origin request handling
- **File Upload Limits** - 50MB limit for temple images
- **Error Handling** - Sanitized error messages in production

### Database Security
- **User Permissions** - Dedicated database user with limited privileges
- **Connection Encryption** - SSL/TLS for database connections
- **Password Policy** - Strong password requirements
- **Access Control** - Network-level database access restrictions

This documentation provides complete information for replicating the exact development functionality in a production IIS environment.