var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// server/db.ts
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import { eq, or, asc } from "drizzle-orm";
import ws from "ws";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  insertMemberSchema: () => insertMemberSchema,
  insertRelationshipSchema: () => insertRelationshipSchema,
  insertTempleSchema: () => insertTempleSchema,
  insertUserSchema: () => insertUserSchema,
  members: () => members,
  relationships: () => relationships,
  temples: () => temples,
  users: () => users
});
import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var members = pgTable("members", {
  id: serial("id").primaryKey(),
  fullName: text("full_name").notNull(),
  phone: text("phone"),
  email: text("email"),
  gender: text("gender", { enum: ["Male", "Female"] }),
  birthCity: text("birth_city").notNull(),
  birthState: text("birth_state").notNull(),
  birthCountry: text("birth_country").notNull(),
  currentCity: text("current_city").notNull(),
  currentState: text("current_state").notNull(),
  currentCountry: text("current_country").notNull(),
  fatherName: text("father_name").notNull(),
  motherName: text("mother_name").notNull(),
  spouseName: text("spouse_name"),
  maritalStatus: text("marital_status").notNull().default("Single"),
  templeId: integer("temple_id").references(() => temples.id),
  createdAt: timestamp("created_at").defaultNow()
});
var relationships = pgTable("relationships", {
  id: serial("id").primaryKey(),
  memberId: integer("member_id").notNull().references(() => members.id),
  relatedMemberId: integer("related_member_id").notNull().references(() => members.id),
  relationshipType: text("relationship_type").notNull(),
  createdAt: timestamp("created_at").defaultNow()
});
var insertMemberSchema = createInsertSchema(members).omit({
  id: true,
  createdAt: true
}).extend({
  maritalStatus: z.enum(["Single", "Married", "Divorced", "Widowed"]),
  templeId: z.number().optional().nullable(),
  email: z.string().optional().nullable(),
  phone: z.string().optional().nullable()
});
var insertRelationshipSchema = createInsertSchema(relationships).omit({
  id: true
});
var users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull()
});
var insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true
});
var temples = pgTable("temples", {
  id: serial("id").primaryKey(),
  templeName: text("temple_name").notNull(),
  deity: text("deity"),
  village: text("village").notNull(),
  nearestCity: text("nearest_city").notNull(),
  state: text("state").notNull(),
  country: text("country").notNull(),
  linkedTemples: text("linked_temples").array().default([]),
  establishedYear: integer("established_year"),
  contactPhone: text("contact_phone"),
  contactEmail: text("contact_email"),
  description: text("description"),
  templeImage: text("temple_image"),
  // Base64 encoded image or image URL
  googleMapLink: text("google_map_link"),
  websiteLink: text("website_link"),
  wikiLink: text("wiki_link"),
  createdAt: timestamp("created_at").defaultNow()
});
var insertTempleSchema = createInsertSchema(temples).omit({
  id: true,
  createdAt: true
}).extend({
  establishedYear: z.number().optional(),
  contactEmail: z.string().email("Please enter a valid email address").optional().or(z.literal("")),
  linkedTemples: z.array(z.string()).default([]),
  templeImage: z.string().optional(),
  googleMapLink: z.string().url("Please enter a valid Google Maps URL").optional().or(z.literal("")),
  websiteLink: z.string().url("Please enter a valid website URL").optional().or(z.literal("")),
  wikiLink: z.string().url("Please enter a valid Wikipedia URL").optional().or(z.literal(""))
});

// server/db.ts
neonConfig.webSocketConstructor = ws;
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}
var pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  // Reduced pool size
  min: 1,
  // Reduced minimum
  idleTimeoutMillis: 6e4,
  // Increased timeout
  connectionTimeoutMillis: 5e3
  // Increased timeout
});
var db = drizzle({ client: pool, schema: schema_exports });
pool.on("error", (err) => {
  console.error("Database pool error:", err);
});
process.on("SIGINT", async () => {
  await pool.end();
  process.exit(0);
});
process.on("SIGTERM", async () => {
  await pool.end();
  process.exit(0);
});
var DatabaseStorage = class {
  async getUser(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || void 0;
  }
  async getUserByUsername(username) {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || void 0;
  }
  async createUser(insertUser) {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  async getMember(id) {
    const [member] = await db.select().from(members).where(eq(members.id, id));
    return member || void 0;
  }
  async getMemberByEmail(email) {
    const [member] = await db.select().from(members).where(eq(members.email, email));
    return member || void 0;
  }
  async createMember(insertMember) {
    const [member] = await db.insert(members).values(insertMember).returning();
    return member;
  }
  async updateMember(id, insertMember) {
    const [member] = await db.update(members).set(insertMember).where(eq(members.id, id)).returning();
    return member;
  }
  async deleteMember(id) {
    await db.delete(relationships).where(
      or(
        eq(relationships.memberId, id),
        eq(relationships.relatedMemberId, id)
      )
    );
    await db.delete(members).where(eq(members.id, id));
  }
  async getAllMembers() {
    return await db.select().from(members).orderBy(asc(members.id));
  }
  async searchMembers(searchTerm, city, state) {
    const allMembers = await db.select().from(members);
    return allMembers.filter((member) => {
      const matchesSearch = !searchTerm || member.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || member.email && member.email.toLowerCase().includes(searchTerm.toLowerCase()) || member.phone && member.phone.includes(searchTerm);
      const matchesCity = !city || member.currentCity.toLowerCase().includes(city.toLowerCase());
      const matchesState = !state || member.currentState === state;
      return matchesSearch && matchesCity && matchesState;
    });
  }
  async createRelationship(insertRelationship) {
    const [relationship] = await db.insert(relationships).values(insertRelationship).returning();
    return relationship;
  }
  async getMemberRelationships(memberId) {
    const result = await db.select({
      id: relationships.id,
      memberId: relationships.memberId,
      relatedMemberId: relationships.relatedMemberId,
      relationshipType: relationships.relationshipType,
      createdAt: relationships.createdAt,
      relatedMember: members
    }).from(relationships).innerJoin(members, eq(relationships.relatedMemberId, members.id)).where(eq(relationships.memberId, memberId));
    return result;
  }
  async getAllRelationships() {
    const result = await db.select({
      id: relationships.id,
      memberId: relationships.memberId,
      relatedMemberId: relationships.relatedMemberId,
      relationshipType: relationships.relationshipType,
      createdAt: relationships.createdAt,
      relatedMember: members
    }).from(relationships).innerJoin(members, eq(relationships.relatedMemberId, members.id));
    return result;
  }
  async deleteRelationship(id) {
    await db.delete(relationships).where(eq(relationships.id, id));
  }
  async getTemple(id) {
    const [temple] = await db.select().from(temples).where(eq(temples.id, id));
    return temple || void 0;
  }
  async createTemple(insertTemple) {
    const [temple] = await db.insert(temples).values(insertTemple).returning();
    return temple;
  }
  async updateTemple(id, insertTemple) {
    const [temple] = await db.update(temples).set(insertTemple).where(eq(temples.id, id)).returning();
    return temple;
  }
  async deleteTemple(id) {
    const result = await db.delete(temples).where(eq(temples.id, id)).returning();
    if (result.length === 0) {
      throw new Error("Temple not found");
    }
  }
  async getAllTemples() {
    return await db.select().from(temples);
  }
  async searchTemples(searchTerm, state, country) {
    const allTemples = await db.select().from(temples);
    return allTemples.filter((temple) => {
      const matchesSearch = !searchTerm || temple.templeName.toLowerCase().includes(searchTerm.toLowerCase()) || temple.deity && temple.deity.toLowerCase().includes(searchTerm.toLowerCase()) || temple.village.toLowerCase().includes(searchTerm.toLowerCase()) || temple.nearestCity.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesState = !state || temple.state === state;
      const matchesCountry = !country || temple.country === country;
      return matchesSearch && matchesState && matchesCountry;
    });
  }
};

// server/storage.ts
var storage = new DatabaseStorage();

// server/whatsapp.ts
var WhatsAppService = class {
  templates = [];
  constructor() {
    this.initializeTemplates();
  }
  initializeTemplates() {
    this.templates = [
      {
        id: "event_reminder",
        name: "Event Reminder",
        template: "\u{1F549}\uFE0F *Sri Lakshmi Temple*\n\nDear {name},\n\nReminder: {eventName} on {date} at {time}.\n\nLocation: Sri Lakshmi Temple\nAddress: {address}\n\nPlease join us for this auspicious occasion.\n\nOM Shanti \u{1F64F}"
      },
      {
        id: "festival_greeting",
        name: "Festival Greeting",
        template: "\u{1F549}\uFE0F *Sri Lakshmi Temple*\n\n{festivalName} Greetings!\n\nMay this auspicious festival bring peace, prosperity, and happiness to you and your family.\n\nSpecial puja timings:\n{pujaTimings}\n\nOM Shanti \u{1F64F}"
      },
      {
        id: "donation_thank",
        name: "Donation Thank You",
        template: "\u{1F549}\uFE0F *Sri Lakshmi Temple*\n\nDear {name},\n\nThank you for your generous donation of ${amount}. Your contribution helps us serve the community better.\n\nMay the divine bless you abundantly.\n\nOM Shanti \u{1F64F}"
      },
      {
        id: "weekly_schedule",
        name: "Weekly Schedule",
        template: "\u{1F549}\uFE0F *Sri Lakshmi Temple - Weekly Schedule*\n\n*This Week's Events:*\n{weeklyEvents}\n\n*Daily Puja Timings:*\nMorning: 6:00 AM - 12:00 PM\nEvening: 5:00 PM - 9:00 PM\n\nOM Shanti \u{1F64F}"
      }
    ];
  }
  generateWhatsAppURL(phoneNumber, message) {
    const formattedNumber = this.formatPhoneNumber(phoneNumber);
    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/${formattedNumber}?text=${encodedMessage}`;
  }
  generateBulkWhatsAppURLs(phoneNumbers, message) {
    return phoneNumbers.map((phoneNumber) => ({
      phoneNumber,
      url: this.generateWhatsAppURL(phoneNumber, message)
    }));
  }
  formatPhoneNumber(phoneNumber) {
    const cleaned = phoneNumber.replace(/\D/g, "");
    if (cleaned.length === 10) {
      return `1${cleaned}`;
    }
    return cleaned;
  }
  getTemplates() {
    return this.templates;
  }
  processTemplate(templateId, variables) {
    const template = this.templates.find((t) => t.id === templateId);
    if (!template) {
      throw new Error("Template not found");
    }
    let processedMessage = template.template;
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{${key}}`;
      processedMessage = processedMessage.replace(new RegExp(placeholder, "g"), value);
    });
    return processedMessage;
  }
};
var whatsappService = new WhatsAppService();

// server/routes.ts
import { z as z2 } from "zod";
async function registerRoutes(app2) {
  app2.post("/api/members", async (req, res) => {
    try {
      const memberData = insertMemberSchema.parse(req.body);
      const member = await storage.createMember(memberData);
      res.json(member);
    } catch (error) {
      console.error("Error creating member:", error);
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create member" });
    }
  });
  app2.get("/api/members", async (req, res) => {
    try {
      const { search, city, state } = req.query;
      if (search || city || state) {
        const members2 = await storage.searchMembers(
          search || "",
          city,
          state
        );
        res.json(members2);
      } else {
        const members2 = await storage.getAllMembers();
        res.json(members2);
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch members" });
    }
  });
  app2.get("/api/members/search", async (req, res) => {
    try {
      const { term, city, state } = req.query;
      if (!term || typeof term !== "string" || term.length < 2) {
        return res.json([]);
      }
      const members2 = await storage.searchMembers(
        term,
        city,
        state
      );
      res.json(members2);
    } catch (error) {
      console.error("Error searching members:", error);
      res.status(500).json({ message: "Failed to search members" });
    }
  });
  app2.get("/api/members/:id", async (req, res) => {
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
  app2.put("/api/members/:id", async (req, res) => {
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
  app2.patch("/api/members/:id", async (req, res) => {
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
  app2.delete("/api/members/:id", async (req, res) => {
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
  app2.post("/api/relationships", async (req, res) => {
    try {
      const relationshipData = insertRelationshipSchema.parse(req.body);
      const member1 = await storage.getMember(relationshipData.memberId);
      const member2 = await storage.getMember(relationshipData.relatedMemberId);
      if (!member1 || !member2) {
        return res.status(400).json({ message: "One or both members not found" });
      }
      const relationship = await storage.createRelationship(relationshipData);
      res.json(relationship);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create relationship" });
    }
  });
  app2.get("/api/relationships/:memberId", async (req, res) => {
    try {
      const memberId = parseInt(req.params.memberId);
      if (isNaN(memberId)) {
        return res.status(400).json({ message: "Invalid member ID" });
      }
      const relationships2 = await storage.getMemberRelationships(memberId);
      console.log(`Fetching relationships for member ${memberId}:`, relationships2);
      res.json(relationships2);
    } catch (error) {
      console.error("Error fetching member relationships:", error);
      res.status(500).json({ message: "Failed to fetch relationships" });
    }
  });
  app2.get("/api/relationships", async (req, res) => {
    try {
      const relationships2 = await storage.getAllRelationships();
      console.log("Fetching all relationships:", relationships2);
      res.json(relationships2);
    } catch (error) {
      console.error("Error fetching all relationships:", error);
      res.status(500).json({ message: "Failed to fetch relationships" });
    }
  });
  app2.delete("/api/relationships/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteRelationship(id);
      res.json({ message: "Relationship deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete relationship" });
    }
  });
  app2.get("/api/members/search", async (req, res) => {
    try {
      const { term, city, state } = req.query;
      if (!term && !city && !state) {
        return res.json([]);
      }
      const members2 = await storage.searchMembers(
        term || "",
        city || "",
        state || ""
      );
      res.json(members2);
    } catch (error) {
      console.error("Search error:", error);
      res.status(500).json({ message: "Failed to search members" });
    }
  });
  app2.get("/api/members/search/:term", async (req, res) => {
    try {
      const searchTerm = req.params.term;
      const members2 = await storage.searchMembers(searchTerm);
      res.json(members2);
    } catch (error) {
      res.status(500).json({ message: "Failed to search members" });
    }
  });
  app2.post("/api/whatsapp/generate-url", (req, res) => {
    try {
      const { phoneNumber, message } = req.body;
      if (!phoneNumber || !message) {
        return res.status(400).json({ message: "Phone number and message are required" });
      }
      const url = whatsappService.generateWhatsAppURL(phoneNumber, message);
      res.json({ success: true, url });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to generate WhatsApp URL"
      });
    }
  });
  app2.post("/api/whatsapp/broadcast-urls", (req, res) => {
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
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to generate broadcast URLs"
      });
    }
  });
  app2.post("/api/whatsapp/process-template", (req, res) => {
    try {
      const { templateId, variables } = req.body;
      if (!templateId || !variables) {
        return res.status(400).json({ message: "Template ID and variables are required" });
      }
      const processedMessage = whatsappService.processTemplate(templateId, variables);
      res.json({ success: true, message: processedMessage });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to process template"
      });
    }
  });
  app2.get("/api/whatsapp/templates", (req, res) => {
    try {
      const templates = whatsappService.getTemplates();
      res.json(templates);
    } catch (error) {
      res.status(500).json({ message: "Failed to get templates" });
    }
  });
  app2.get("/api/temples", async (req, res) => {
    try {
      const temples2 = await storage.getAllTemples();
      res.json(temples2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch temples" });
    }
  });
  app2.post("/api/temples", async (req, res) => {
    try {
      const templeData = insertTempleSchema.parse(req.body);
      const temple = await storage.createTemple(templeData);
      res.json(temple);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create temple" });
    }
  });
  app2.put("/api/temples/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid temple ID" });
      }
      const templeData = insertTempleSchema.parse(req.body);
      const temple = await storage.updateTemple(id, templeData);
      res.json(temple);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      if (error.message === "Temple not found") {
        return res.status(404).json({ message: "Temple not found" });
      }
      res.status(500).json({ message: "Failed to update temple" });
    }
  });
  app2.delete("/api/temples/:id", async (req, res) => {
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
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json({ limit: "50mb" }));
app.use(express2.urlencoded({ extended: false, limit: "50mb" }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = 5e3;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
