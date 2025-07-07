const express = require('express');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');

const app = express();
const port = process.env.PORT || 8080;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Allow inline scripts for development
  crossOriginEmbedderPolicy: false
}));

// Enable CORS for all routes
app.use(cors());

// Compression middleware
app.use(compression());

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Mock database storage for testing
class MemStorage {
  constructor() {
    this.members = new Map();
    this.temples = new Map();
    this.relationships = new Map();
    this.currentMemberId = 1;
    this.currentTempleId = 1;
    this.currentRelationshipId = 1;
    
    // Add sample data
    this.initializeSampleData();
  }

  initializeSampleData() {
    // Sample temple
    const sampleTemple = {
      id: 1,
      name: "Sri Lakshmi Temple",
      deity: "Goddess Lakshmi",
      location: "Chennai, Tamil Nadu",
      established: "1950",
      description: "A beautiful temple dedicated to Goddess Lakshmi"
    };
    this.temples.set(1, sampleTemple);

    // Sample members
    const sampleMembers = [
      {
        id: 1,
        firstName: "Venkat",
        lastName: "Thirupathy",
        email: "venkat@example.com",
        phone: "+91-9876543210",
        city: "Chennai",
        state: "Tamil Nadu",
        country: "India",
        maritalStatus: "Married",
        gender: "Male",
        templeId: 1
      },
      {
        id: 2,
        firstName: "Sona",
        lastName: "Venkat",
        email: "sona@example.com",
        phone: "+91-9876543211",
        city: "Chennai",
        state: "Tamil Nadu", 
        country: "India",
        maritalStatus: "Single",
        gender: "Female",
        templeId: 1
      }
    ];

    sampleMembers.forEach(member => {
      this.members.set(member.id, member);
      this.currentMemberId = Math.max(this.currentMemberId, member.id + 1);
    });
  }

  // Member methods
  async getAllMembers() {
    return Array.from(this.members.values());
  }

  async getMember(id) {
    return this.members.get(parseInt(id));
  }

  async createMember(memberData) {
    const id = this.currentMemberId++;
    const member = { id, ...memberData };
    this.members.set(id, member);
    return member;
  }

  async updateMember(id, memberData) {
    const existingMember = this.members.get(parseInt(id));
    if (!existingMember) return null;
    
    const updatedMember = { ...existingMember, ...memberData };
    this.members.set(parseInt(id), updatedMember);
    return updatedMember;
  }

  async deleteMember(id) {
    return this.members.delete(parseInt(id));
  }

  async searchMembers(searchTerm, city, state) {
    const members = Array.from(this.members.values());
    return members.filter(member => {
      const matchesSearch = !searchTerm || 
        member.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (member.phone && member.phone.includes(searchTerm));
      
      const matchesCity = !city || member.city === city;
      const matchesState = !state || member.state === state;
      
      return matchesSearch && matchesCity && matchesState;
    });
  }

  // Temple methods
  async getAllTemples() {
    return Array.from(this.temples.values());
  }

  async getTemple(id) {
    return this.temples.get(parseInt(id));
  }

  async createTemple(templeData) {
    const id = this.currentTempleId++;
    const temple = { id, ...templeData };
    this.temples.set(id, temple);
    return temple;
  }

  async updateTemple(id, templeData) {
    const existingTemple = this.temples.get(parseInt(id));
    if (!existingTemple) return null;
    
    const updatedTemple = { ...existingTemple, ...templeData };
    this.temples.set(parseInt(id), updatedTemple);
    return updatedTemple;
  }

  async deleteTemple(id) {
    return this.temples.delete(parseInt(id));
  }

  // Relationship methods
  async getAllRelationships() {
    return Array.from(this.relationships.values()).map(rel => ({
      ...rel,
      relatedMember: this.members.get(rel.relatedMemberId)
    })).filter(rel => rel.relatedMember);
  }

  async getMemberRelationships(memberId) {
    const relationships = Array.from(this.relationships.values())
      .filter(rel => rel.memberId === parseInt(memberId));
    
    return relationships.map(rel => ({
      ...rel,
      relatedMember: this.members.get(rel.relatedMemberId)
    })).filter(rel => rel.relatedMember);
  }

  async createRelationship(relationshipData) {
    const id = this.currentRelationshipId++;
    const relationship = { id, ...relationshipData, createdAt: new Date() };
    this.relationships.set(id, relationship);
    return relationship;
  }

  async deleteRelationship(id) {
    return this.relationships.delete(parseInt(id));
  }
}

const storage = new MemStorage();

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    service: 'TamilKovil Temple Management System'
  });
});

// Members API
app.get('/api/members', async (req, res) => {
  try {
    const { search, city, state } = req.query;
    const members = await storage.searchMembers(search, city, state);
    res.json(members);
  } catch (error) {
    console.error('Error fetching members:', error);
    res.status(500).json({ error: 'Failed to fetch members' });
  }
});

app.get('/api/members/:id', async (req, res) => {
  try {
    const member = await storage.getMember(req.params.id);
    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    }
    res.json(member);
  } catch (error) {
    console.error('Error fetching member:', error);
    res.status(500).json({ error: 'Failed to fetch member' });
  }
});

app.post('/api/members', async (req, res) => {
  try {
    const member = await storage.createMember(req.body);
    res.status(201).json(member);
  } catch (error) {
    console.error('Error creating member:', error);
    res.status(500).json({ error: 'Failed to create member' });
  }
});

app.put('/api/members/:id', async (req, res) => {
  try {
    const member = await storage.updateMember(req.params.id, req.body);
    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    }
    res.json(member);
  } catch (error) {
    console.error('Error updating member:', error);
    res.status(500).json({ error: 'Failed to update member' });
  }
});

app.delete('/api/members/:id', async (req, res) => {
  try {
    const deleted = await storage.deleteMember(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Member not found' });
    }
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting member:', error);
    res.status(500).json({ error: 'Failed to delete member' });
  }
});

// Temples API
app.get('/api/temples', async (req, res) => {
  try {
    const temples = await storage.getAllTemples();
    res.json(temples);
  } catch (error) {
    console.error('Error fetching temples:', error);
    res.status(500).json({ error: 'Failed to fetch temples' });
  }
});

app.get('/api/temples/:id', async (req, res) => {
  try {
    const temple = await storage.getTemple(req.params.id);
    if (!temple) {
      return res.status(404).json({ error: 'Temple not found' });
    }
    res.json(temple);
  } catch (error) {
    console.error('Error fetching temple:', error);
    res.status(500).json({ error: 'Failed to fetch temple' });
  }
});

app.post('/api/temples', async (req, res) => {
  try {
    const temple = await storage.createTemple(req.body);
    res.status(201).json(temple);
  } catch (error) {
    console.error('Error creating temple:', error);
    res.status(500).json({ error: 'Failed to create temple' });
  }
});

// Relationships API
app.get('/api/relationships', async (req, res) => {
  try {
    const relationships = await storage.getAllRelationships();
    res.json(relationships);
  } catch (error) {
    console.error('Error fetching relationships:', error);
    res.status(500).json({ error: 'Failed to fetch relationships' });
  }
});

app.get('/api/members/:id/relationships', async (req, res) => {
  try {
    const relationships = await storage.getMemberRelationships(req.params.id);
    res.json(relationships);
  } catch (error) {
    console.error('Error fetching member relationships:', error);
    res.status(500).json({ error: 'Failed to fetch relationships' });
  }
});

app.post('/api/relationships', async (req, res) => {
  try {
    const relationship = await storage.createRelationship(req.body);
    res.status(201).json(relationship);
  } catch (error) {
    console.error('Error creating relationship:', error);
    res.status(500).json({ error: 'Failed to create relationship' });
  }
});

// Serve React app for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(port, '0.0.0.0', () => {
  console.log(`🏛️ TamilKovil server running on http://localhost:${port}`);
  console.log(`🌐 Domain access: http://tamilkovil.com:${port}`);
  console.log(`📊 Health check: http://localhost:${port}/api/health`);
  console.log(`👥 Members API: http://localhost:${port}/api/members`);
  console.log(`🏛️ Temples API: http://localhost:${port}/api/temples`);
});