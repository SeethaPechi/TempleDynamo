// Temple Management System - Production Server
// Standard PostgreSQL version for Windows Server deployment

const express = require('express');
const path = require('path');
const compression = require('compression');
const helmet = require('helmet');
const cors = require('cors');
const { Pool } = require('pg');
const fs = require('fs');

// Create logs directory if it doesn't exist
if (!fs.existsSync('./logs')) {
  fs.mkdirSync('./logs', { recursive: true });
}

// Enhanced logging function
function log(level, message, data = null) {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] [${level.toUpperCase()}] ${message}${data ? ' | Data: ' + JSON.stringify(data) : ''}`;
  
  console.log(logEntry);
  
  // Write to log file
  fs.appendFileSync('./logs/tms.log', logEntry + '\n');
}

const app = express();
const PORT = process.env.PORT || 8080;

log('info', 'Starting TMS Server', { port: PORT, nodeEnv: process.env.NODE_ENV });

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  log('info', `${req.method} ${req.url}`, { 
    ip: req.ip, 
    userAgent: req.get('User-Agent'),
    headers: req.headers 
  });
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    log('info', `${req.method} ${req.url} - ${res.statusCode}`, { 
      duration: `${duration}ms`,
      size: res.get('Content-Length') || 0
    });
  });
  
  next();
});

// Database configuration for local PostgreSQL
const dbConfig = {
  host: process.env.PGHOST || 'localhost',
  port: process.env.PGPORT || 5432,
  database: process.env.PGDATABASE || 'temple_management',
  user: process.env.PGUSER || 'temple_app',
  password: process.env.PGPASSWORD || 'TMS2024SecurePass!',
  ssl: false, // Local PostgreSQL doesn't need SSL
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

// Create PostgreSQL connection pool
const pool = new Pool(dbConfig);

// Test database connection
log('info', 'Testing database connection', dbConfig);
pool.connect((err, client, release) => {
  if (err) {
    log('error', 'Database connection failed', { 
      error: err.message, 
      code: err.code,
      config: {
        host: dbConfig.host,
        port: dbConfig.port,
        database: dbConfig.database,
        user: dbConfig.user
      }
    });
  } else {
    log('info', 'Database connection successful');
    client.query('SELECT version()', (queryErr, result) => {
      if (!queryErr) {
        log('info', 'Database version check', { version: result.rows[0].version });
      }
      release();
    });
  }
});

// Security and compression middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https:", "data:"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "https:", "wss:"],
      fontSrc: ["'self'", "https:", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

app.use(compression());
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Check if public directory exists
const publicDir = path.join(__dirname, 'public');
log('info', 'Checking public directory', { path: publicDir, exists: fs.existsSync(publicDir) });

if (!fs.existsSync(publicDir)) {
  log('warn', 'Public directory does not exist, creating it');
  fs.mkdirSync(publicDir, { recursive: true });
  
  // Create a simple index.html for testing
  const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TMS - Temple Management System</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .status { padding: 10px; margin: 10px 0; border-radius: 5px; }
        .success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
        .error { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
        .info { background: #d1ecf1; color: #0c5460; border: 1px solid #bee5eb; }
        .test-section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        button { padding: 10px 20px; margin: 5px; cursor: pointer; }
    </style>
</head>
<body>
    <h1>🏛️ Temple Management System</h1>
    <div class="status success">
        <strong>✅ Application Started Successfully</strong><br>
        Server is running and ready to accept requests.
    </div>
    
    <div class="test-section">
        <h2>🔍 System Status</h2>
        <p><strong>Server Time:</strong> <span id="serverTime"></span></p>
        <p><strong>Application:</strong> TMS v1.0.0</p>
        <p><strong>Environment:</strong> Production</p>
        
        <h3>🧪 Test API Endpoints</h3>
        <button onclick="testHealth()">Test Health Check</button>
        <button onclick="testMembers()">Test Members API</button>
        <button onclick="testTemples()">Test Temples API</button>
        
        <div id="testResults" style="margin-top: 15px;"></div>
    </div>
    
    <div class="test-section">
        <h2>📊 Database Status</h2>
        <button onclick="testDatabase()">Test Database Connection</button>
        <div id="dbResults" style="margin-top: 15px;"></div>
    </div>
    
    <script>
        // Update server time
        document.getElementById('serverTime').textContent = new Date().toLocaleString();
        
        async function testHealth() {
            showResult('testResults', 'Testing health endpoint...', 'info');
            try {
                const response = await fetch('/api/health');
                const data = await response.json();
                showResult('testResults', 'Health Check: ' + JSON.stringify(data, null, 2), 'success');
            } catch (error) {
                showResult('testResults', 'Health Check Failed: ' + error.message, 'error');
            }
        }
        
        async function testMembers() {
            showResult('testResults', 'Testing members API...', 'info');
            try {
                const response = await fetch('/api/members');
                const data = await response.json();
                showResult('testResults', 'Members API: Found ' + data.length + ' members', 'success');
            } catch (error) {
                showResult('testResults', 'Members API Failed: ' + error.message, 'error');
            }
        }
        
        async function testTemples() {
            showResult('testResults', 'Testing temples API...', 'info');
            try {
                const response = await fetch('/api/temples');
                const data = await response.json();
                showResult('testResults', 'Temples API: Found ' + data.length + ' temples', 'success');
            } catch (error) {
                showResult('testResults', 'Temples API Failed: ' + error.message, 'error');
            }
        }
        
        async function testDatabase() {
            showResult('dbResults', 'Testing database connection...', 'info');
            try {
                const response = await fetch('/api/health');
                const data = await response.json();
                if (data.database && data.database.connected) {
                    showResult('dbResults', 'Database: Connected ✅<br>Version: ' + data.database.version, 'success');
                } else {
                    showResult('dbResults', 'Database: Not Connected ❌', 'error');
                }
            } catch (error) {
                showResult('dbResults', 'Database Test Failed: ' + error.message, 'error');
            }
        }
        
        function showResult(elementId, message, type) {
            const element = document.getElementById(elementId);
            element.innerHTML = '<div class="status ' + type + '">' + message + '</div>';
        }
        
        // Auto-test health on page load
        setTimeout(testHealth, 1000);
    </script>
</body>
</html>`;
  
  fs.writeFileSync(path.join(publicDir, 'index.html'), indexHtml);
  log('info', 'Created test index.html file');
}

// Serve static files from public directory
app.use(express.static(publicDir, {
  maxAge: '1y',
  etag: true,
  lastModified: true,
  setHeaders: (res, path) => {
    log('info', 'Serving static file', { file: path });
  }
}));

// Database health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as timestamp, version() as db_version');
    client.release();
    
    res.json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      service: 'Temple Management System',
      database: {
        connected: true,
        timestamp: result.rows[0].timestamp,
        version: result.rows[0].db_version.split(' ')[0]
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      service: 'Temple Management System',
      database: {
        connected: false,
        error: error.message
      }
    });
  }
});

// API Routes

// Get all members
app.get('/api/members', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query(`
      SELECT m.*, t.templeName 
      FROM members m 
      LEFT JOIN temples t ON m.templeId = t.id 
      ORDER BY m.fullName
    `);
    client.release();
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching members:', error);
    res.status(500).json({ error: 'Failed to fetch members' });
  }
});

// Get all temples
app.get('/api/temples', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM temples ORDER BY templeName');
    client.release();
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching temples:', error);
    res.status(500).json({ error: 'Failed to fetch temples' });
  }
});

// Get all relationships
app.get('/api/relationships', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query(`
      SELECT r.*, 
             m1.fullName as memberName,
             m2.fullName as relatedMemberName
      FROM relationships r
      JOIN members m1 ON r.memberId = m1.id
      JOIN members m2 ON r.relatedMemberId = m2.id
      ORDER BY r.createdAt DESC
    `);
    client.release();
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching relationships:', error);
    res.status(500).json({ error: 'Failed to fetch relationships' });
  }
});

// Get member relationships
app.get('/api/members/:id/relationships', async (req, res) => {
  try {
    const memberId = parseInt(req.params.id);
    const client = await pool.connect();
    const result = await client.query(`
      SELECT r.*, m.* as relatedMember
      FROM relationships r
      JOIN members m ON r.relatedMemberId = m.id
      WHERE r.memberId = $1
      ORDER BY r.relationshipType, m.fullName
    `, [memberId]);
    client.release();
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching member relationships:', error);
    res.status(500).json({ error: 'Failed to fetch member relationships' });
  }
});

// Create new member
app.post('/api/members', async (req, res) => {
  try {
    const client = await pool.connect();
    const {
      fullName, phone, email, gender, birthCity, birthState, birthCountry,
      currentCity, currentState, currentCountry, fatherName, motherName,
      spouseName, maritalStatus, templeId
    } = req.body;

    const result = await client.query(`
      INSERT INTO members (
        fullName, phone, email, gender, birthCity, birthState, birthCountry,
        currentCity, currentState, currentCountry, fatherName, motherName,
        spouseName, maritalStatus, templeId, createdAt
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW())
      RETURNING *
    `, [
      fullName, phone, email, gender, birthCity, birthState, birthCountry,
      currentCity, currentState, currentCountry, fatherName, motherName,
      spouseName, maritalStatus, templeId
    ]);
    
    client.release();
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating member:', error);
    res.status(500).json({ error: 'Failed to create member' });
  }
});

// Create new temple
app.post('/api/temples', async (req, res) => {
  try {
    const client = await pool.connect();
    const {
      templeName, deity, village, nearestCity, state, country,
      linkedTemples, establishedYear, contactPerson, contactPhone,
      contactEmail, description, imageUrl, websiteUrl, mapsUrl, wikiLink
    } = req.body;

    const result = await client.query(`
      INSERT INTO temples (
        templeName, deity, village, nearestCity, state, country,
        linkedTemples, establishedYear, contactPerson, contactPhone,
        contactEmail, description, imageUrl, websiteUrl, mapsUrl, wikiLink, createdAt
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW())
      RETURNING *
    `, [
      templeName, deity, village, nearestCity, state, country,
      JSON.stringify(linkedTemples), establishedYear, contactPerson, contactPhone,
      contactEmail, description, imageUrl, websiteUrl, mapsUrl, wikiLink
    ]);
    
    client.release();
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating temple:', error);
    res.status(500).json({ error: 'Failed to create temple' });
  }
});

// Create new relationship
app.post('/api/relationships', async (req, res) => {
  try {
    const client = await pool.connect();
    const { memberId, relatedMemberId, relationshipType } = req.body;

    const result = await client.query(`
      INSERT INTO relationships (memberId, relatedMemberId, relationshipType, createdAt)
      VALUES ($1, $2, $3, NOW())
      RETURNING *
    `, [memberId, relatedMemberId, relationshipType]);
    
    client.release();
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating relationship:', error);
    res.status(500).json({ error: 'Failed to create relationship' });
  }
});

// Search members
app.get('/api/members/search', async (req, res) => {
  try {
    const { q, city, state } = req.query;
    let query = 'SELECT * FROM members WHERE 1=1';
    const params = [];
    let paramCount = 0;

    if (q) {
      paramCount++;
      query += ` AND (fullName ILIKE $${paramCount} OR email ILIKE $${paramCount} OR phone ILIKE $${paramCount})`;
      params.push(`%${q}%`);
    }

    if (city) {
      paramCount++;
      query += ` AND currentCity ILIKE $${paramCount}`;
      params.push(`%${city}%`);
    }

    if (state) {
      paramCount++;
      query += ` AND currentState ILIKE $${paramCount}`;
      params.push(`%${state}%`);
    }

    query += ' ORDER BY fullName LIMIT 100';

    const client = await pool.connect();
    const result = await client.query(query, params);
    client.release();
    res.json(result.rows);
  } catch (error) {
    console.error('Error searching members:', error);
    res.status(500).json({ error: 'Failed to search members' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  log('error', 'Server error occurred', { 
    error: err.message, 
    stack: err.stack, 
    url: req.url, 
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    timestamp: new Date().toISOString()
  });
});

// Catch-all route for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  log('info', `TMS Server started successfully`, {
    port: PORT,
    healthUrl: `http://localhost:${PORT}/api/health`,
    publicDir: publicDir,
    publicExists: fs.existsSync(publicDir),
    logsDir: './logs',
    logsExists: fs.existsSync('./logs')
  });
  
  log('info', 'Server endpoints available', {
    main: `http://localhost:${PORT}/`,
    health: `http://localhost:${PORT}/api/health`,
    members: `http://localhost:${PORT}/api/members`,
    temples: `http://localhost:${PORT}/api/temples`
  });
  
  log('info', 'Database configuration', {
    host: dbConfig.host,
    port: dbConfig.port,
    database: dbConfig.database,
    user: dbConfig.user,
    ssl: dbConfig.ssl
  });
  
  // Log environment variables for debugging
  log('info', 'Environment check', {
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    PGHOST: process.env.PGHOST,
    PGPORT: process.env.PGPORT,
    PGDATABASE: process.env.PGDATABASE,
    PGUSER: process.env.PGUSER,
    DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'NOT SET'
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  pool.end(() => {
    console.log('Database pool closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  pool.end(() => {
    console.log('Database pool closed');
    process.exit(0);
  });
});