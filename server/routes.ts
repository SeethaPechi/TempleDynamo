import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertMemberSchema, insertRelationshipSchema, insertTempleSchema } from "@shared/schema";
import { whatsappService } from "./whatsapp";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint
  app.get("/api/health", async (req, res) => {
    try {
      // Test database connection by trying to get members
      await storage.getAllMembers();
      res.json({ status: "healthy", database: "connected", timestamp: new Date().toISOString() });
    } catch (error: any) {
      console.error("Health check failed:", error);
      res.status(500).json({ status: "unhealthy", database: "disconnected", error: error?.message || "Unknown error" });
    }
  });

  // Serve Tamil Kovil interface
  app.get("/tamil-kovil-interface.html", (req, res) => {
    import("path").then(({ default: path }) => {
      import("fs").then(({ default: fs }) => {
        const filePath = path.join(process.cwd(), "deployment", "tamil-kovil-interface.html");
        
        if (fs.existsSync(filePath)) {
          res.sendFile(filePath);
        } else {
          res.status(404).send("Tamil Kovil interface file not found");
        }
      });
    });
  });

  // Serve production React app (exact development UI)
  app.get("/production-app.html", (req, res) => {
    import("path").then(({ default: path }) => {
      import("fs").then(({ default: fs }) => {
        const filePath = path.join(process.cwd(), "deployment", "production-react-app.html");
        
        if (fs.existsSync(filePath)) {
          res.sendFile(filePath);
        } else {
          res.status(404).send("Production React app file not found");
        }
      });
    });
  });

  // Member routes
  app.post("/api/members", async (req, res) => {
    try {
      const memberData = insertMemberSchema.parse(req.body);
      
      // Allow duplicate emails and phone numbers - no uniqueness check
      
      const member = await storage.createMember(memberData);
      res.json(member);
    } catch (error) {
      console.error("Error creating member:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create member" });
    }
  });

  app.get("/api/members", async (req, res) => {
    try {
      const { search, city, state } = req.query;
      
      if (search || city || state) {
        const members = await storage.searchMembers(
          search as string || "",
          city as string,
          state as string
        );
        res.json(members);
      } else {
        const members = await storage.getAllMembers();
        res.json(members);
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch members" });
    }
  });

  app.get("/api/members/search", async (req, res) => {
    try {
      const { term, city, state } = req.query;
      
      if (!term || typeof term !== 'string' || term.length < 2) {
        return res.json([]);
      }
      
      const members = await storage.searchMembers(
        term as string,
        city as string,
        state as string
      );
      res.json(members);
    } catch (error) {
      console.error("Error searching members:", error);
      res.status(500).json({ message: "Failed to search members" });
    }
  });

  app.get("/api/members/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const member = await storage.getMember(id);
      
      if (!member) {
        return res.status(404).json({ message: "Member not found" });
      }
      
      console.log(`API returning member ${id}:`, {
        id: member.id,
        name: member.fullName,
        hasProfilePicture: !!member.profilePicture,
        profilePictureLength: member.profilePicture?.length || 0,
        photosCount: member.photos?.length || 0,
        photos: member.photos?.map((p, i) => `Photo ${i}: ${p.substring(0, 30)}...`)
      });
      
      res.json(member);
    } catch (error) {
      console.error("Error fetching member:", error);
      res.status(500).json({ message: "Failed to fetch member" });
    }
  });

  // Update member (PUT for full updates)
  app.put("/api/members/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid member ID" });
      }

      const existingMember = await storage.getMember(id);
      if (!existingMember) {
        return res.status(404).json({ message: "Member not found" });
      }

      const memberData = insertMemberSchema.parse(req.body);
      const updatedMember = await storage.updateMember(id, memberData);
      res.json(updatedMember);
    } catch (error) {
      console.error("Error updating member:", error);
      res.status(500).json({ message: "Failed to update member" });
    }
  });

  // Update member (PATCH for partial updates)
  app.patch("/api/members/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid member ID" });
      }

      const existingMember = await storage.getMember(id);
      if (!existingMember) {
        return res.status(404).json({ message: "Member not found" });
      }

      // Log request size for debugging
      const requestSize = JSON.stringify(req.body).length;
      console.log(`PATCH /api/members/${id} - Request size: ${requestSize} bytes`);
      
      // Validate photos array if present
      if (req.body.photos && Array.isArray(req.body.photos)) {
        console.log(`Photos array length: ${req.body.photos.length}`);
        req.body.photos.forEach((photo: string, index: number) => {
          if (typeof photo === 'string' && photo.length > 0) {
            console.log(`Photo ${index}: ${photo.substring(0, 50)}...`);
          }
        });
      }
      
      // Validate profile picture if present
      if (req.body.profilePicture) {
        console.log(`Profile picture: ${req.body.profilePicture.substring(0, 50)}...`);
      }

      const memberData = insertMemberSchema.parse(req.body);
      const updatedMember = await storage.updateMember(id, memberData);
      console.log(`Member updated successfully - ID: ${id}`);
      res.json(updatedMember);
    } catch (error) {
      console.error("Error updating member:", error);
      if (error instanceof z.ZodError) {
        console.error("Validation errors:", error.errors);
        return res.status(400).json({ 
          message: "Invalid data", 
          errors: error.errors,
          details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        });
      }
      res.status(500).json({ message: "Failed to update member", error: error.message });
    }
  });

  // Delete member
  app.delete("/api/members/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid member ID" });
      }

      const existingMember = await storage.getMember(id);
      if (!existingMember) {
        return res.status(404).json({ message: "Member not found" });
      }

      await storage.deleteMember(id);
      res.json({ message: "Member deleted successfully" });
    } catch (error) {
      console.error("Error deleting member:", error);
      res.status(500).json({ message: "Failed to delete member" });
    }
  });

  // Relationship routes
  app.post("/api/relationships", async (req, res) => {
    try {
      const relationshipData = insertRelationshipSchema.parse(req.body);
      
      // Verify both members exist
      const member1 = await storage.getMember(relationshipData.memberId);
      const member2 = await storage.getMember(relationshipData.relatedMemberId);
      
      if (!member1 || !member2) {
        return res.status(400).json({ message: "One or both members not found" });
      }
      
      const relationship = await storage.createRelationship(relationshipData);
      res.json(relationship);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create relationship" });
    }
  });

  app.get("/api/relationships/:memberId", async (req, res) => {
    try {
      const memberId = parseInt(req.params.memberId);
      if (isNaN(memberId)) {
        return res.status(400).json({ message: "Invalid member ID" });
      }
      
      const relationships = await storage.getMemberRelationships(memberId);
      console.log(`Fetching relationships for member ${memberId}:`, relationships);
      res.json(relationships);
    } catch (error) {
      console.error("Error fetching member relationships:", error);
      res.status(500).json({ message: "Failed to fetch relationships" });
    }
  });

  app.get("/api/relationships", async (req, res) => {
    try {
      const relationships = await storage.getAllRelationships();
      console.log('Fetching all relationships:', relationships);
      res.json(relationships);
    } catch (error) {
      console.error("Error fetching all relationships:", error);
      res.status(500).json({ message: "Failed to fetch relationships" });
    }
  });

  app.patch("/api/relationships/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid relationship ID" });
      }

      const { relationshipType } = req.body;
      if (!relationshipType) {
        return res.status(400).json({ message: "Relationship type is required" });
      }

      await storage.updateRelationship(id, { relationshipType });
      res.json({ message: "Relationship updated successfully" });
    } catch (error) {
      console.error("Error updating relationship:", error);
      res.status(500).json({ message: "Failed to update relationship" });
    }
  });

  app.delete("/api/relationships/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteRelationship(id);
      res.json({ message: "Relationship deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete relationship" });
    }
  });

  // Member search route
  app.get("/api/members/search", async (req, res) => {
    try {
      const { term, city, state } = req.query;
      if (!term && !city && !state) {
        return res.json([]);
      }
      const members = await storage.searchMembers(
        term as string || "", 
        city as string || "", 
        state as string || ""
      );
      res.json(members);
    } catch (error) {
      console.error("Search error:", error);
      res.status(500).json({ message: "Failed to search members" });
    }
  });

  // Search members for relationship linking
  app.get("/api/members/search/:term", async (req, res) => {
    try {
      const searchTerm = req.params.term;
      const members = await storage.searchMembers(searchTerm);
      res.json(members);
    } catch (error) {
      res.status(500).json({ message: "Failed to search members" });
    }
  });

  // Get unique cities from members
  app.get("/api/members/cities", async (req, res) => {
    try {
      const cities = await storage.getUniqueCities();
      res.json(cities);
    } catch (error) {
      console.error("Error fetching cities:", error);
      res.status(500).json({ message: "Failed to fetch cities" });
    }
  });

  // Get unique states from members
  app.get("/api/members/states", async (req, res) => {
    try {
      const states = await storage.getUniqueStates();
      res.json(states);
    } catch (error) {
      console.error("Error fetching states:", error);
      res.status(500).json({ message: "Failed to fetch states" });
    }
  });

  // WhatsApp routes
  app.post("/api/whatsapp/generate-url", (req, res) => {
    try {
      const { phoneNumber, message } = req.body;
      
      if (!phoneNumber || !message) {
        return res.status(400).json({ message: "Phone number and message are required" });
      }

      const url = whatsappService.generateWhatsAppURL(phoneNumber, message);
      res.json({ success: true, url });
    } catch (error: any) {
      res.status(500).json({ 
        success: false, 
        message: error.message || "Failed to generate WhatsApp URL" 
      });
    }
  });

  app.post("/api/whatsapp/broadcast-urls", (req, res) => {
    try {
      const { phoneNumbers, message } = req.body;
      
      if (!Array.isArray(phoneNumbers) || !message) {
        return res.status(400).json({ message: "Phone numbers array and message are required" });
      }

      const urls = whatsappService.generateBulkWhatsAppURLs(phoneNumbers, message);
      res.json({
        success: true,
        urls,
        message: `Generated WhatsApp URLs for ${urls.length} recipients`
      });
    } catch (error: any) {
      res.status(500).json({ 
        success: false, 
        message: error.message || "Failed to generate broadcast URLs" 
      });
    }
  });

  app.post("/api/whatsapp/process-template", (req, res) => {
    try {
      const { templateId, variables } = req.body;
      
      if (!templateId || !variables) {
        return res.status(400).json({ message: "Template ID and variables are required" });
      }

      const processedMessage = whatsappService.processTemplate(templateId, variables);
      res.json({ success: true, message: processedMessage });
    } catch (error: any) {
      res.status(500).json({ 
        success: false, 
        message: error.message || "Failed to process template" 
      });
    }
  });

  // Template messages for temple announcements
  app.get("/api/whatsapp/templates", (req, res) => {
    try {
      const templates = whatsappService.getTemplates();
      res.json(templates);
    } catch (error) {
      res.status(500).json({ message: "Failed to get templates" });
    }
  });

  // Temple routes
  app.get("/api/temples", async (req, res) => {
    try {
      const temples = await storage.getAllTemples();
      res.json(temples);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch temples" });
    }
  });

  app.post("/api/temples", async (req, res) => {
    try {
      const templeData = insertTempleSchema.parse(req.body);
      const temple = await storage.createTemple(templeData);
      res.json(temple);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create temple" });
    }
  });

  app.put("/api/temples/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid temple ID" });
      }

      const templeData = insertTempleSchema.parse(req.body);
      const temple = await storage.updateTemple(id, templeData);
      res.json(temple);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      if (error.message === "Temple not found") {
        return res.status(404).json({ message: "Temple not found" });
      }
      res.status(500).json({ message: "Failed to update temple" });
    }
  });

  app.delete("/api/temples/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid temple ID" });
      }

      await storage.deleteTemple(id);
      res.json({ message: "Temple deleted successfully" });
    } catch (error) {
      if (error.message === "Temple not found") {
        return res.status(404).json({ message: "Temple not found" });
      }
      res.status(500).json({ message: "Failed to delete temple" });
    }
  });

  // SPA routing: Handle client-side routing for production deployment
  // This ensures all non-API routes serve the React app (for navigation to work)
  app.get('*', (req, res, next) => {
    // Skip API routes
    if (req.originalUrl.startsWith('/api/') || 
        req.originalUrl.includes('.html') || 
        req.originalUrl.includes('.js') || 
        req.originalUrl.includes('.css') ||
        req.originalUrl.includes('.png') ||
        req.originalUrl.includes('.jpg') ||
        req.originalUrl.includes('.ico')) {
      return next();
    }
    
    // For production deployment, let the static file handler take over
    // In development, Vite middleware handles this
    if (process.env.NODE_ENV === 'production') {
      // This will be handled by serveStatic in vite.ts
      return next();
    }
    
    // In development, let Vite handle it
    next();
  });

  const httpServer = createServer(app);
  return httpServer;
}
