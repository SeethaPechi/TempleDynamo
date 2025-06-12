import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertMemberSchema, insertRelationshipSchema } from "@shared/schema";
import { whatsappService } from "./whatsapp";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Member routes
  app.post("/api/members", async (req, res) => {
    try {
      const memberData = insertMemberSchema.parse(req.body);
      
      // Check if email already exists
      const existingMember = await storage.getMemberByEmail(memberData.email);
      if (existingMember) {
        return res.status(400).json({ message: "Email already registered" });
      }
      
      const member = await storage.createMember(memberData);
      res.json(member);
    } catch (error) {
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

  app.get("/api/members/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const member = await storage.getMember(id);
      
      if (!member) {
        return res.status(404).json({ message: "Member not found" });
      }
      
      res.json(member);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch member" });
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

  app.get("/api/members/:id/relationships", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const relationships = await storage.getMemberRelationships(id);
      res.json(relationships);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch relationships" });
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

  const httpServer = createServer(app);
  return httpServer;
}
