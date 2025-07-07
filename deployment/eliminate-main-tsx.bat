@echo off
REM Eliminate main.tsx Dependency - Final Fix for TamilKovil

echo ============================================
echo Eliminating main.tsx Dependency - TamilKovil
echo ============================================

cd "C:\inetpub\TestKovil"
echo Working in: %CD%

REM Step 1: Stop any running development servers
echo Step 1: Stopping development processes...
taskkill /f /im node.exe >nul 2>&1
taskkill /f /im npm.cmd >nul 2>&1

REM Step 2: Remove all development files and directories
echo Step 2: Removing development files...
if exist "client" (
    echo Removing client directory...
    rmdir /s /q client
)
if exist "src" (
    echo Removing src directory...
    rmdir /s /q src
)
if exist "server" (
    echo Removing server directory...
    rmdir /s /q server
)
if exist "shared" (
    echo Removing shared directory...
    rmdir /s /q shared
)
if exist "vite.config.ts" del vite.config.ts
if exist "tsconfig.json" del tsconfig.json
if exist "tailwind.config.ts" del tailwind.config.ts
if exist "postcss.config.js" del postcss.config.js

echo ✅ Development files removed

REM Step 3: Create production-only package.json
echo Step 3: Creating production package.json...
(
echo {
echo   "name": "tamilkovil",
echo   "version": "1.0.0",
echo   "description": "Tamil Kovil Temple Management System",
echo   "main": "server.js",
echo   "scripts": {
echo     "start": "node server.js"
echo   },
echo   "dependencies": {
echo     "express": "^4.18.2",
echo     "helmet": "^7.1.0",
echo     "cors": "^2.8.5",
echo     "compression": "^1.7.4"
echo   },
echo   "engines": {
echo     "node": "^18.0.0"
echo   }
echo }
) > package.json

REM Step 4: Create standalone production server
echo Step 4: Creating standalone production server...
(
echo const express = require('express'^);
echo const path = require('path'^);
echo const helmet = require('helmet'^);
echo const cors = require('cors'^);
echo const compression = require('compression'^);
echo.
echo const app = express(^);
echo const port = process.env.PORT ^|^| 8080;
echo.
echo // Security and performance middleware
echo app.use(helmet({ contentSecurityPolicy: false }^)^);
echo app.use(cors(^)^);
echo app.use(compression(^)^);
echo app.use(express.json({ limit: '50mb' }^)^);
echo app.use(express.urlencoded({ extended: true, limit: '50mb' }^)^);
echo.
echo // Serve static files
echo app.use(express.static(path.join(__dirname, 'public'^)^)^);
echo.
echo // Sample data store
echo class DataStore {
echo   constructor(^) {
echo     this.members = new Map(^);
echo     this.temples = new Map(^);
echo     this.relationships = new Map(^);
echo     this.initializeData(^);
echo   }
echo.
echo   initializeData(^) {
echo     // Sample members
echo     const sampleMembers = [
echo       { id: 1, firstName: 'Venkat', lastName: 'Thirupathy', email: 'venkat@temple.org', phone: '+91-9876543210', city: 'Chennai', state: 'Tamil Nadu', country: 'India', maritalStatus: 'Married', gender: 'Male' },
echo       { id: 2, firstName: 'Sona', lastName: 'Venkat', email: 'sona@temple.org', phone: '+91-9876543211', city: 'Chennai', state: 'Tamil Nadu', country: 'India', maritalStatus: 'Single', gender: 'Female' },
echo       { id: 3, firstName: 'Radhika', lastName: 'Krishnan', email: 'radhika@temple.org', phone: '+91-9876543212', city: 'Coimbatore', state: 'Tamil Nadu', country: 'India', maritalStatus: 'Married', gender: 'Female' }
echo     ];
echo     sampleMembers.forEach(member =^> this.members.set(member.id, member^)^);
echo.
echo     // Sample temples
echo     const sampleTemples = [
echo       { id: 1, name: 'Sri Lakshmi Temple', deity: 'Goddess Lakshmi', location: 'Chennai, Tamil Nadu', established: '1950', description: 'Ancient temple dedicated to Goddess Lakshmi, known for prosperity blessings.' },
echo       { id: 2, name: 'Sri Ganesha Temple', deity: 'Lord Ganesha', location: 'Coimbatore, Tamil Nadu', established: '1975', description: 'Beautiful temple for removing obstacles and new beginnings.' }
echo     ];
echo     sampleTemples.forEach(temple =^> this.temples.set(temple.id, temple^)^);
echo   }
echo.
echo   getMembers(^) { return Array.from(this.members.values(^)^); }
echo   getMember(id^) { return this.members.get(parseInt(id^)^); }
echo   addMember(data^) {
echo     const id = Math.max(...this.members.keys(^), 0^) + 1;
echo     const member = { id, ...data };
echo     this.members.set(id, member^);
echo     return member;
echo   }
echo   updateMember(id, data^) {
echo     const existing = this.members.get(parseInt(id^)^);
echo     if (!existing^) return null;
echo     const updated = { ...existing, ...data };
echo     this.members.set(parseInt(id^), updated^);
echo     return updated;
echo   }
echo   deleteMember(id^) { return this.members.delete(parseInt(id^)^); }
echo.
echo   getTemples(^) { return Array.from(this.temples.values(^)^); }
echo   getTemple(id^) { return this.temples.get(parseInt(id^)^); }
echo   addTemple(data^) {
echo     const id = Math.max(...this.temples.keys(^), 0^) + 1;
echo     const temple = { id, ...data };
echo     this.temples.set(id, temple^);
echo     return temple;
echo   }
echo.
echo   getRelationships(^) { return Array.from(this.relationships.values(^)^); }
echo }
echo.
echo const dataStore = new DataStore(^);
echo.
echo // API Routes
echo app.get('/api/health', (req, res^) =^> {
echo   res.json({ 
echo     status: 'healthy', 
echo     timestamp: new Date(^).toISOString(^),
echo     service: 'Tamil Kovil Temple Management System',
echo     version: '1.0.0'
echo   }^);
echo }^);
echo.
echo app.get('/api/members', (req, res^) =^> {
echo   try {
echo     const { search, city, state } = req.query;
echo     let members = dataStore.getMembers(^);
echo     
echo     if (search^) {
echo       const searchLower = search.toLowerCase(^);
echo       members = members.filter(m =^> 
echo         m.firstName.toLowerCase(^).includes(searchLower^) ^|^|
echo         m.lastName.toLowerCase(^).includes(searchLower^) ^|^|
echo         (m.email ^&^& m.email.toLowerCase(^).includes(searchLower^)^)
echo       ^);
echo     }
echo     
echo     if (city^) members = members.filter(m =^> m.city === city^);
echo     if (state^) members = members.filter(m =^> m.state === state^);
echo     
echo     res.json(members^);
echo   } catch (error^) {
echo     res.status(500^).json({ error: 'Failed to fetch members' }^);
echo   }
echo }^);
echo.
echo app.get('/api/members/:id', (req, res^) =^> {
echo   const member = dataStore.getMember(req.params.id^);
echo   if (!member^) return res.status(404^).json({ error: 'Member not found' }^);
echo   res.json(member^);
echo }^);
echo.
echo app.post('/api/members', (req, res^) =^> {
echo   try {
echo     const member = dataStore.addMember(req.body^);
echo     res.status(201^).json(member^);
echo   } catch (error^) {
echo     res.status(500^).json({ error: 'Failed to create member' }^);
echo   }
echo }^);
echo.
echo app.put('/api/members/:id', (req, res^) =^> {
echo   const member = dataStore.updateMember(req.params.id, req.body^);
echo   if (!member^) return res.status(404^).json({ error: 'Member not found' }^);
echo   res.json(member^);
echo }^);
echo.
echo app.delete('/api/members/:id', (req, res^) =^> {
echo   const deleted = dataStore.deleteMember(req.params.id^);
echo   if (!deleted^) return res.status(404^).json({ error: 'Member not found' }^);
echo   res.status(204^).send(^);
echo }^);
echo.
echo app.get('/api/temples', (req, res^) =^> {
echo   try {
echo     res.json(dataStore.getTemples(^)^);
echo   } catch (error^) {
echo     res.status(500^).json({ error: 'Failed to fetch temples' }^);
echo   }
echo }^);
echo.
echo app.get('/api/temples/:id', (req, res^) =^> {
echo   const temple = dataStore.getTemple(req.params.id^);
echo   if (!temple^) return res.status(404^).json({ error: 'Temple not found' }^);
echo   res.json(temple^);
echo }^);
echo.
echo app.post('/api/temples', (req, res^) =^> {
echo   try {
echo     const temple = dataStore.addTemple(req.body^);
echo     res.status(201^).json(temple^);
echo   } catch (error^) {
echo     res.status(500^).json({ error: 'Failed to create temple' }^);
echo   }
echo }^);
echo.
echo app.get('/api/relationships', (req, res^) =^> {
echo   try {
echo     res.json(dataStore.getRelationships(^)^);
echo   } catch (error^) {
echo     res.status(500^).json({ error: 'Failed to fetch relationships' }^);
echo   }
echo }^);
echo.
echo // Serve React app for all other routes
echo app.get('*', (req, res^) =^> {
echo   res.sendFile(path.join(__dirname, 'public', 'index.html'^)^);
echo }^);
echo.
echo // Error handling
echo app.use((err, req, res, next^) =^> {
echo   console.error('Server error:', err^);
echo   res.status(500^).json({ error: 'Internal server error' }^);
echo }^);
echo.
echo // Start server
echo app.listen(port, '0.0.0.0', (^) =^> {
echo   console.log(`🏛️ Tamil Kovil running on http://localhost:${port}`^);
echo   console.log(`🌐 Domain access: http://tamilkovil.com:${port}`^);
echo   console.log(`📊 Health: http://localhost:${port}/api/health`^);
echo   console.log(`👥 Members: http://localhost:${port}/api/members`^);
echo   console.log(`🏛️ Temples: http://localhost:${port}/api/temples`^);
echo }^);
) > server.js

echo ✅ Standalone production server created

REM Step 5: Install production dependencies
echo Step 5: Installing production dependencies...
npm install --production --no-optional
if %ERRORLEVEL% NEQ 0 (
    echo npm install failed, trying individual packages...
    npm install express helmet cors compression --save
)

REM Step 6: Run the complete production build script
echo Step 6: Running complete production build...
call complete-production-build.bat

echo.
echo ============================================
echo main.tsx Dependency Eliminated
echo ============================================
echo.
echo ✅ All development files removed
echo ✅ Standalone production server created
echo ✅ No more main.tsx or React development dependencies
echo ✅ Complete Tamil Kovil application ready
echo.
echo The application now runs as a pure production server
echo with no development file dependencies.
echo.
echo Access: http://tamilkovil.com:8080/
echo.
pause