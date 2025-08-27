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
  profilePicture: z.string().optional().nullable(),
  photos: z.array(z.string()).default([]),
});

export const insertRelationshipSchema = createInsertSchema(relationships).omit({
  id: true,
});

export type InsertMember = z.infer<typeof insertMemberSchema>;
export type Member = typeof members.$inferSelect;
export type InsertRelationship = z.infer<typeof insertRelationshipSchema>;
export type Relationship = typeof relationships.$inferSelect;

// User authentication schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone").notNull(),
  countryCode: text("country_code").notNull().default("+1"),
  password: text("password").notNull(),
  passwordHint: text("password_hint"),
  isActive: text("is_active").default("true"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  isActive: true,
}).extend({
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().regex(/^(\d{10}|\d{3}-\d{3}-\d{4}|\(\d{3}\)\s\d{3}\s\d{4})$/, "Phone must be in format: XXXXXXXXXX, XXX-XXX-XXXX, or (XXX) XXX XXXX"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
  countryCode: z.string().default("+1"),
  passwordHint: z.string().optional(),
});

export const loginUserSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginUser = z.infer<typeof loginUserSchema>;
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
