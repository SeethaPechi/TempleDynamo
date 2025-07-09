const express = require('express');
const { Pool } = require('pg');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

// SECURITY: Use environment variables for production credentials
const DATABASE_URL = process.env.DATABASE_URL || "postgresql://YOUR_DB_USER:YOUR_SECURE_PASSWORD@localhost:5432/temple_management";

const pool = new Pool({
  connectionString: DATABASE_URL,
  max: 20,
  min: 2,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  ssl: false
});

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files
app.use(express.static('.'));

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT count(*) FROM members');
    res.json({ 
      status: "healthy", 
      database: "connected", 
      memberCount: result.rows[0].count,
      timestamp: new Date().toISOString() 
    });
  } catch (error) {
    console.error("Health check failed:", error);
    res.status(500).json({ 
      status: "unhealthy", 
      database: "disconnected", 
      error: error.message 
    });
  }
});

// Members API
app.get('/api/members', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM members ORDER BY id ASC');
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching members:", error);
    res.status(500).json({ message: "Failed to fetch members" });
  }
});

// Temples API
app.get('/api/temples', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM temples ORDER BY id ASC');
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching temples:", error);
    res.status(500).json({ message: "Failed to fetch temples" });
  }
});

// Relationships API
app.get('/api/relationships', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT r.*, m.* as related_member 
      FROM relationships r 
      JOIN members m ON r.related_member_id = m.id 
      ORDER BY r.id ASC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching relationships:", error);
    res.status(500).json({ message: "Failed to fetch relationships" });
  }
});

// Create member endpoint
app.post('/api/members', async (req, res) => {
  try {
    const { 
      fullName, email, phone, dateOfBirth, gender, maritalStatus, spouseName,
      fatherName, motherName, currentAddress, currentCity, currentState, currentCountry,
      birthPlace, birthCity, birthState, birthCountry, templeId 
    } = req.body;

    const result = await pool.query(`
      INSERT INTO members (
        full_name, email, phone, date_of_birth, gender, marital_status, spouse_name,
        father_name, mother_name, current_address, current_city, current_state, current_country,
        birth_place, birth_city, birth_state, birth_country, temple_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING *
    `, [
      fullName, email, phone, dateOfBirth, gender, maritalStatus, spouseName,
      fatherName, motherName, currentAddress, currentCity, currentState, currentCountry,
      birthPlace, birthCity, birthState, birthCountry, templeId
    ]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating member:", error);
    res.status(500).json({ message: "Failed to create member" });
  }
});

// Create temple endpoint
app.post('/api/temples', async (req, res) => {
  try {
    const {
      templeName, deity, village, nearestCity, state, country,
      establishedYear, contactPhone, contactEmail, description, templeImage
    } = req.body;

    const result = await pool.query(`
      INSERT INTO temples (
        temple_name, deity, village, nearest_city, state, country,
        established_year, contact_phone, contact_email, description, temple_image
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `, [
      templeName, deity, village, nearestCity, state, country,
      establishedYear, contactPhone, contactEmail, description, templeImage
    ]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating temple:", error);
    res.status(500).json({ message: "Failed to create temple" });
  }
});

// Root route serves the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Fallback to index.html for client-side routing
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api/')) {
    res.sendFile(path.join(__dirname, 'index.html'));
  } else {
    res.status(404).json({ message: 'API endpoint not found' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down gracefully...');
  await pool.end();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\nShutting down gracefully...');
  await pool.end();
  process.exit(0);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Nam Kovil server running on http://localhost:${PORT}`);
  console.log(`Database: postgresql://temple_app:****@localhost:5432/temple_management`);
  console.log('Press Ctrl+C to stop');
});

module.exports = app;