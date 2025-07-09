const express = require('express');
const { Pool } = require('pg');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// SECURITY: Use environment variables for production credentials
const DATABASE_URL = process.env.DATABASE_URL || "postgresql://YOUR_DB_USER:YOUR_SECURE_PASSWORD@localhost:5432/temple_management";

console.log(`Connecting to PostgreSQL database: ${DATABASE_URL.replace(/:[^:@]*@/, ':****@')}`);

const pool = new Pool({
  connectionString: DATABASE_URL,
  max: 20,
  min: 2,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  ssl: false
});

// Test database connection on startup
pool.connect((err, client, release) => {
  if (err) {
    console.error('Error acquiring client:', err.stack);
  } else {
    console.log('Database connected successfully');
    release();
  }
});

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Serve static files from current directory
app.use(express.static('.'));

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as time, count(*) as member_count FROM members');
    client.release();
    
    res.json({ 
      status: "healthy", 
      database: "connected", 
      memberCount: result.rows[0].member_count,
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
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM members ORDER BY id ASC');
    client.release();
    
    console.log(`Retrieved ${result.rows.length} members`);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching members:", error);
    res.status(500).json({ message: "Failed to fetch members" });
  }
});

// Temples API
app.get('/api/temples', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM temples ORDER BY id ASC');
    client.release();
    
    console.log(`Retrieved ${result.rows.length} temples`);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching temples:", error);
    res.status(500).json({ message: "Failed to fetch temples" });
  }
});

// Relationships API
app.get('/api/relationships', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query(`
      SELECT r.*, 
             m.full_name as related_member_name,
             m.email as related_member_email,
             m.phone as related_member_phone
      FROM relationships r 
      JOIN members m ON r.related_member_id = m.id 
      ORDER BY r.id ASC
    `);
    client.release();
    
    console.log(`Retrieved ${result.rows.length} relationships`);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching relationships:", error);
    res.status(500).json({ message: "Failed to fetch relationships" });
  }
});

// Create member endpoint
app.post('/api/members', async (req, res) => {
  try {
    const client = await pool.connect();
    const { 
      fullName, email, phone, dateOfBirth, gender, maritalStatus, spouseName,
      fatherName, motherName, currentAddress, currentCity, currentState, currentCountry,
      birthPlace, birthCity, birthState, birthCountry, templeId 
    } = req.body;

    const result = await client.query(`
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
    
    client.release();
    console.log(`Created new member: ${fullName}`);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating member:", error);
    res.status(500).json({ message: "Failed to create member" });
  }
});

// Create temple endpoint
app.post('/api/temples', async (req, res) => {
  try {
    const client = await pool.connect();
    const {
      templeName, deity, village, nearestCity, state, country,
      establishedYear, contactPhone, contactEmail, description, templeImage
    } = req.body;

    const result = await client.query(`
      INSERT INTO temples (
        temple_name, deity, village, nearest_city, state, country,
        established_year, contact_phone, contact_email, description, temple_image
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `, [
      templeName, deity, village, nearestCity, state, country,
      establishedYear, contactPhone, contactEmail, description, templeImage
    ]);

    client.release();
    console.log(`Created new temple: ${templeName}`);
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
  console.log(`Database: ${DATABASE_URL.replace(/:[^:@]*@/, ':****@')}`);
  console.log('Press Ctrl+C to stop');
});

module.exports = app;