import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const members = pgTable("members", {
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
  profilePicture: text("profile_picture"),
  photos: text("photos").array().default([]),
  createdAt: timestamp("created_at").defaultNow(),
});

export const relationships = pgTable("relationships", {
  id: serial("id").primaryKey(),
  memberId: integer("member_id").notNull().references(() => members.id),
  relatedMemberId: integer("related_member_id").notNull().references(() => members.id),
  relationshipType: text("relationship_type").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMemberSchema = createInsertSchema(members).omit({
  id: true,
  createdAt: true,
}).extend({
  maritalStatus: z.enum(["Single", "Married", "Divorced", "Widowed"]),
  templeId: z.number().optional().nullable(),
  email: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  profilePicture: z.string().optional(),
  photos: z.array(z.string()).default([]),
});

export const insertRelationshipSchema = createInsertSchema(relationships).omit({
  id: true,
});

export type InsertMember = z.infer<typeof insertMemberSchema>;
export type Member = typeof members.$inferSelect;
export type InsertRelationship = z.infer<typeof insertRelationshipSchema>;
export type Relationship = typeof relationships.$inferSelect;

// Keep existing users table for compatibility
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Temple schema
export const temples = pgTable("temples", {
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
  templeImage: text("temple_image"), // Base64 encoded image or image URL
  templePhotos: text("temple_photos").array().default([]), // Array of up to 10 photos
  googleMapLink: text("google_map_link"),
  websiteLink: text("website_link"),
  wikiLink: text("wiki_link"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTempleSchema = createInsertSchema(temples).omit({
  id: true,
  createdAt: true,
}).extend({
  establishedYear: z.number().optional(),
  contactEmail: z.string().email("Please enter a valid email address").optional().or(z.literal("")),
  linkedTemples: z.array(z.string()).default([]),
  templeImage: z.string().optional(),
  googleMapLink: z.string().url("Please enter a valid Google Maps URL").optional().or(z.literal("")),
  websiteLink: z.string().url("Please enter a valid website URL").optional().or(z.literal("")),
  wikiLink: z.string().url("Please enter a valid Wikipedia URL").optional().or(z.literal("")),
  templePhotos: z.array(z.string()).max(10, "Maximum 10 photos allowed").default([]),
});

export type InsertTemple = z.infer<typeof insertTempleSchema>;
export type Temple = typeof temples.$inferSelect;
