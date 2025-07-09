// Simple database connection test for TMS
const { Pool } = require('pg');

console.log('TMS Database Connection Test');
console.log('=============================');

const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: process.env.PGPORT || 5432,
  database: process.env.PGDATABASE || 'temple_management',
  user: process.env.PGUSER || 'temple_app',
  password: process.env.PGPASSWORD || 'YOUR_SECURE_PASSWORD',
  ssl: false
});

console.log('Connection config:', {
  host: process.env.PGHOST || 'localhost',
  port: process.env.PGPORT || 5432,
  database: process.env.PGDATABASE || 'temple_management',
  user: process.env.PGUSER || 'temple_app'
});

pool.connect((err, client, release) => {
  if (err) {
    console.log('❌ Database connection FAILED:', err.message);
    console.log('Error code:', err.code);
    process.exit(1);
  } else {
    console.log('✅ Database connection SUCCESSFUL');
    
    // Test a simple query
    client.query('SELECT COUNT(*) as member_count FROM members', (queryErr, result) => {
      if (queryErr) {
        console.log('❌ Query test FAILED:', queryErr.message);
      } else {
        console.log('✅ Query test SUCCESSFUL');
        console.log('Members in database:', result.rows[0].member_count);
      }
      
      release();
      pool.end();
      process.exit(0);
    });
  }
});