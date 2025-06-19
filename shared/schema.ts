import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const members = pgTable("members", {
  id: serial("id").primaryKey(),
  fullName: text("full_name").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  birthCity: text("birth_city").notNull(),
  birthState: text("birth_state").notNull(),
  birthCountry: text("birth_country").notNull(),
  currentCity: text("current_city").notNull(),
  currentState: text("current_state").notNull(),
  currentCountry: text("current_country").notNull(),
  fatherName: text("father_name").notNull(),
  motherName: text("mother_name").notNull(),
});

export const relationships = pgTable("relationships", {
  id: serial("id").primaryKey(),
  memberId: integer("member_id").notNull().references(() => members.id),
  relatedMemberId: integer("related_member_id").notNull().references(() => members.id),
  relationshipType: text("relationship_type").notNull(),
});

export const insertMemberSchema = createInsertSchema(members).omit({
  id: true,
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
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTempleSchema = createInsertSchema(temples).omit({
  id: true,
  createdAt: true,
});

export type InsertTemple = z.infer<typeof insertTempleSchema>;
export type Temple = typeof temples.$inferSelect;
