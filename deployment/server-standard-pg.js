// Temple Management System - Production Server
// Standard PostgreSQL version for Windows Server deployment

const express = require('express');
const path = require('path');
const compression = require('compression');
const helmet = require('helmet');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 8080;

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
pool.connect((err, client, release) => {
  if (err) {
    console.error('Error connecting to PostgreSQL database:', err);
    console.log('Database config:', {
      host: dbConfig.host,
      port: dbConfig.port,
      database: dbConfig.database,
      user: dbConfig.user
    });
  } else {
    console.log('Successfully connected to PostgreSQL database');
    release();
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

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: '1y',
  etag: true,
  lastModified: true
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
  console.error('Server error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Catch-all route for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`TMS Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  console.log('Database config:', {
    host: dbConfig.host,
    port: dbConfig.port,
    database: dbConfig.database,
    user: dbConfig.user
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