const express = require('express');
const { Pool } = require('pg');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8080;

// Database configuration for your local PostgreSQL
const DATABASE_URL = "postgresql://temple_app:TMS2024SecurePass!@localhost:5432/temple_management";

console.log(`Starting Nam Kovil Temple Management System`);
console.log(`Database: ${DATABASE_URL.replace(/:[^:@]*@/, ':****@')}`);

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
    console.error('Database connection failed:', err.message);
  } else {
    console.log('Database connected successfully');
    release();
  }
});

// Handle database errors
pool.on('error', (err) => {
  console.error('Database pool error:', err);
});

// Middleware
app.use(cors({
  origin: ['http://localhost:8080', 'http://tamilkovil.com:8080', 'http://tamilkovil.com'],
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Serve static files from current directory
app.use(express.static(__dirname, {
  index: 'index.html',
  maxAge: '1d'
}));

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query(`
      SELECT 
        NOW() as current_time,
        (SELECT count(*) FROM members) as member_count,
        (SELECT count(*) FROM temples) as temple_count,
        (SELECT count(*) FROM relationships) as relationship_count
    `);
    client.release();
    
    res.json({ 
      status: "healthy", 
      database: "connected", 
      timestamp: new Date().toISOString(),
      memberCount: parseInt(result.rows[0].member_count),
      templeCount: parseInt(result.rows[0].temple_count),
      relationshipCount: parseInt(result.rows[0].relationship_count)
    });
  } catch (error) {
    console.error("Health check failed:", error);
    res.status(500).json({ 
      status: "unhealthy", 
      database: "disconnected", 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Members API
app.get('/api/members', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query(`
      SELECT 
        id, full_name as "fullName", email, phone, date_of_birth as "dateOfBirth",
        gender, marital_status as "maritalStatus", spouse_name as "spouseName",
        father_name as "fatherName", mother_name as "motherName",
        current_address as "currentAddress", current_city as "currentCity", 
        current_state as "currentState", current_country as "currentCountry",
        birth_place as "birthPlace", birth_city as "birthCity", 
        birth_state as "birthState", birth_country as "birthCountry",
        temple_id as "templeId", created_at as "createdAt"
      FROM members 
      ORDER BY id ASC
    `);
    client.release();
    
    console.log(`Retrieved ${result.rows.length} members`);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching members:", error);
    res.status(500).json({ message: "Failed to fetch members", error: error.message });
  }
});

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
      RETURNING 
        id, full_name as "fullName", email, phone, date_of_birth as "dateOfBirth",
        gender, marital_status as "maritalStatus", spouse_name as "spouseName",
        father_name as "fatherName", mother_name as "motherName",
        current_address as "currentAddress", current_city as "currentCity", 
        current_state as "currentState", current_country as "currentCountry",
        birth_place as "birthPlace", birth_city as "birthCity", 
        birth_state as "birthState", birth_country as "birthCountry",
        temple_id as "templeId", created_at as "createdAt"
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
    res.status(500).json({ message: "Failed to create member", error: error.message });
  }
});

app.put('/api/members/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const client = await pool.connect();
    const { 
      fullName, email, phone, dateOfBirth, gender, maritalStatus, spouseName,
      fatherName, motherName, currentAddress, currentCity, currentState, currentCountry,
      birthPlace, birthCity, birthState, birthCountry, templeId 
    } = req.body;

    const result = await client.query(`
      UPDATE members SET
        full_name = $1, email = $2, phone = $3, date_of_birth = $4, gender = $5, 
        marital_status = $6, spouse_name = $7, father_name = $8, mother_name = $9,
        current_address = $10, current_city = $11, current_state = $12, current_country = $13,
        birth_place = $14, birth_city = $15, birth_state = $16, birth_country = $17, temple_id = $18
      WHERE id = $19
      RETURNING 
        id, full_name as "fullName", email, phone, date_of_birth as "dateOfBirth",
        gender, marital_status as "maritalStatus", spouse_name as "spouseName",
        father_name as "fatherName", mother_name as "motherName",
        current_address as "currentAddress", current_city as "currentCity", 
        current_state as "currentState", current_country as "currentCountry",
        birth_place as "birthPlace", birth_city as "birthCity", 
        birth_state as "birthState", birth_country as "birthCountry",
        temple_id as "templeId", created_at as "createdAt"
    `, [
      fullName, email, phone, dateOfBirth, gender, maritalStatus, spouseName,
      fatherName, motherName, currentAddress, currentCity, currentState, currentCountry,
      birthPlace, birthCity, birthState, birthCountry, templeId, id
    ]);

    client.release();
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Member not found" });
    }
    
    console.log(`Updated member: ${fullName}`);
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating member:", error);
    res.status(500).json({ message: "Failed to update member", error: error.message });
  }
});

app.delete('/api/members/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const client = await pool.connect();
    
    // Delete related relationships first
    await client.query('DELETE FROM relationships WHERE member_id = $1 OR related_member_id = $1', [id]);
    
    // Delete the member
    const result = await client.query('DELETE FROM members WHERE id = $1 RETURNING full_name', [id]);
    client.release();
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Member not found" });
    }
    
    console.log(`Deleted member: ${result.rows[0].full_name}`);
    res.json({ message: "Member deleted successfully" });
  } catch (error) {
    console.error("Error deleting member:", error);
    res.status(500).json({ message: "Failed to delete member", error: error.message });
  }
});

// Temples API
app.get('/api/temples', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query(`
      SELECT 
        id, temple_name as "templeName", deity, village, nearest_city as "nearestCity",
        state, country, established_year as "establishedYear", contact_phone as "contactPhone",
        contact_email as "contactEmail", description, temple_image as "templeImage",
        website_url as "websiteUrl", google_maps_url as "googleMapsUrl", 
        wikipedia_url as "wikipediaUrl", created_at as "createdAt"
      FROM temples 
      ORDER BY id ASC
    `);
    client.release();
    
    console.log(`Retrieved ${result.rows.length} temples`);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching temples:", error);
    res.status(500).json({ message: "Failed to fetch temples", error: error.message });
  }
});

app.post('/api/temples', async (req, res) => {
  try {
    const client = await pool.connect();
    const {
      templeName, deity, village, nearestCity, state, country,
      establishedYear, contactPhone, contactEmail, description, templeImage,
      websiteUrl, googleMapsUrl, wikipediaUrl
    } = req.body;

    const result = await client.query(`
      INSERT INTO temples (
        temple_name, deity, village, nearest_city, state, country,
        established_year, contact_phone, contact_email, description, temple_image,
        website_url, google_maps_url, wikipedia_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING 
        id, temple_name as "templeName", deity, village, nearest_city as "nearestCity",
        state, country, established_year as "establishedYear", contact_phone as "contactPhone",
        contact_email as "contactEmail", description, temple_image as "templeImage",
        website_url as "websiteUrl", google_maps_url as "googleMapsUrl", 
        wikipedia_url as "wikipediaUrl", created_at as "createdAt"
    `, [
      templeName, deity, village, nearestCity, state, country,
      establishedYear, contactPhone, contactEmail, description, templeImage,
      websiteUrl, googleMapsUrl, wikipediaUrl
    ]);

    client.release();
    console.log(`Created new temple: ${templeName}`);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating temple:", error);
    res.status(500).json({ message: "Failed to create temple", error: error.message });
  }
});

// Relationships API
app.get('/api/relationships', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query(`
      SELECT 
        r.id, r.member_id as "memberId", r.related_member_id as "relatedMemberId",
        r.relationship_type as "relationshipType", r.created_at as "createdAt",
        m.full_name as "relatedMemberName", m.email as "relatedMemberEmail",
        m.phone as "relatedMemberPhone", m.current_city as "relatedMemberCity",
        m.gender as "relatedMemberGender"
      FROM relationships r 
      JOIN members m ON r.related_member_id = m.id 
      ORDER BY r.id ASC
    `);
    client.release();
    
    // Transform to match frontend expectations
    const relationships = result.rows.map(row => ({
      id: row.id,
      memberId: row.memberId,
      relatedMemberId: row.relatedMemberId,
      relationshipType: row.relationshipType,
      createdAt: row.createdAt,
      relatedMember: {
        id: row.relatedMemberId,
        fullName: row.relatedMemberName,
        email: row.relatedMemberEmail,
        phone: row.relatedMemberPhone,
        currentCity: row.relatedMemberCity,
        gender: row.relatedMemberGender
      }
    }));
    
    console.log(`Retrieved ${relationships.length} relationships`);
    res.json(relationships);
  } catch (error) {
    console.error("Error fetching relationships:", error);
    res.status(500).json({ message: "Failed to fetch relationships", error: error.message });
  }
});

app.post('/api/relationships', async (req, res) => {
  try {
    const client = await pool.connect();
    const { memberId, relatedMemberId, relationshipType } = req.body;

    const result = await client.query(`
      INSERT INTO relationships (member_id, related_member_id, relationship_type)
      VALUES ($1, $2, $3)
      RETURNING 
        id, member_id as "memberId", related_member_id as "relatedMemberId",
        relationship_type as "relationshipType", created_at as "createdAt"
    `, [memberId, relatedMemberId, relationshipType]);

    client.release();
    console.log(`Created new relationship: ${relationshipType}`);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating relationship:", error);
    res.status(500).json({ message: "Failed to create relationship", error: error.message });
  }
});

app.delete('/api/relationships/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const client = await pool.connect();
    
    const result = await client.query('DELETE FROM relationships WHERE id = $1 RETURNING relationship_type', [id]);
    client.release();
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Relationship not found" });
    }
    
    console.log(`Deleted relationship: ${result.rows[0].relationship_type}`);
    res.json({ message: "Relationship deleted successfully" });
  } catch (error) {
    console.error("Error deleting relationship:", error);
    res.status(500).json({ message: "Failed to delete relationship", error: error.message });
  }
});

// Catch all handler for SPA routing
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api/')) {
    res.sendFile(path.join(__dirname, 'index.html'));
  } else {
    res.status(404).json({ message: 'API endpoint not found' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.stack);
  res.status(500).json({ message: 'Something went wrong!', error: err.message });
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

// Start server
app.listen(PORT, () => {
  console.log(`Nam Kovil Temple Management System running on port ${PORT}`);
  console.log(`Access at: http://localhost:${PORT}`);
  console.log(`API Health Check: http://localhost:${PORT}/api/health`);
  console.log('Press Ctrl+C to stop');
});

module.exports = app;