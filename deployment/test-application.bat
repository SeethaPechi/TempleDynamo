@echo off
REM TMS Application Test Script
REM Quick test to verify TMS deployment is working

echo ============================================
echo TMS Application Test
echo ============================================

cd "C:\inetpub\wwwroot\tms"

echo Testing database connection...
node -e "
const { Pool } = require('pg');
console.log('Testing PostgreSQL connection...');

const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: process.env.PGPORT || 5432,
  database: process.env.PGDATABASE || 'temple_management',
  user: process.env.PGUSER || 'temple_app',
  password: process.env.PGPASSWORD || 'YOUR_SECURE_PASSWORD',
  ssl: false
});

pool.connect((err, client, release) => {
  if (err) {
    console.log('❌ Database connection failed:', err.message);
    console.log('Connection details:', {
      host: process.env.PGHOST || 'localhost',
      port: process.env.PGPORT || 5432,
      database: process.env.PGDATABASE || 'temple_management',
      user: process.env.PGUSER || 'temple_app'
    });
    process.exit(1);
  } else {
    console.log('✅ Database connection successful');
    
    // Test a simple query
    client.query('SELECT COUNT(*) as member_count FROM members', (err, result) => {
      if (err) {
        console.log('❌ Query test failed:', err.message);
      } else {
        console.log('✅ Query test successful - Members in database:', result.rows[0].member_count);
      }
      release();
      pool.end();
    });
  }
});
"

echo.
echo Testing application startup...
timeout 5 >nul
start /min node server.js

echo Waiting for server to start...
timeout 3 >nul

echo Testing health endpoint...
curl -s http://localhost:8080/api/health

echo.
echo Test completed. Check the output above for any errors.
echo.
echo If tests pass:
echo - Open browser: http://localhost:8080
echo - Health check: http://localhost:8080/api/health
echo.
pause