import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { eq, or } from 'drizzle-orm';
import ws from "ws";
import * as schema from "@shared/schema";
import { users, type User, type InsertUser, members, type Member, type InsertMember, relationships, type Relationship, type InsertRelationship, temples, type Temple, type InsertTemple } from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Optimized connection pool configuration for better performance
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 20, // Maximum pool size
  min: 2,  // Minimum pool size
  idleTimeoutMillis: 30000, // 30 seconds
  connectionTimeoutMillis: 2000, // 2 seconds
});
export const db = drizzle({ client: pool, schema });

import type { IStorage } from "./storage";

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getMember(id: number): Promise<Member | undefined> {
    const [member] = await db.select().from(members).where(eq(members.id, id));
    return member || undefined;
  }

  async getMemberByEmail(email: string): Promise<Member | undefined> {
    const [member] = await db.select().from(members).where(eq(members.email, email));
    return member || undefined;
  }

  async createMember(insertMember: InsertMember): Promise<Member> {
    const [member] = await db
      .insert(members)
      .values(insertMember)
      .returning();
    return member;
  }

  async updateMember(id: number, insertMember: InsertMember): Promise<Member> {
    const [member] = await db
      .update(members)
      .set(insertMember)
      .where(eq(members.id, id))
      .returning();
    return member;
  }

  async deleteMember(id: number): Promise<void> {
    // First delete all relationships involving this member
    await db.delete(relationships).where(
      or(
        eq(relationships.memberId, id),
        eq(relationships.relatedMemberId, id)
      )
    );
    
    // Then delete the member
    await db.delete(members).where(eq(members.id, id));
  }

  async getAllMembers(): Promise<Member[]> {
    return await db.select().from(members);
  }

  async searchMembers(searchTerm: string, city?: string, state?: string): Promise<Member[]> {
    const allMembers = await db.select().from(members);
    return allMembers.filter(member => {
      const matchesSearch = !searchTerm || 
        member.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.phone.includes(searchTerm);
      
      const matchesCity = !city || member.currentCity.toLowerCase().includes(city.toLowerCase());
      const matchesState = !state || member.currentState === state;
      
      return matchesSearch && matchesCity && matchesState;
    });
  }

  async createRelationship(insertRelationship: InsertRelationship): Promise<Relationship> {
    const [relationship] = await db
      .insert(relationships)
      .values(insertRelationship)
      .returning();
    return relationship;
  }

  async getMemberRelationships(memberId: number): Promise<Array<Relationship & { relatedMember: Member }>> {
    // Optimized single query with JOIN instead of N+1 queries
    const result = await db
      .select({
        id: relationships.id,
        memberId: relationships.memberId,
        relatedMemberId: relationships.relatedMemberId,
        relationshipType: relationships.relationshipType,
        relatedMember: members
      })
      .from(relationships)
      .innerJoin(members, eq(relationships.relatedMemberId, members.id))
      .where(eq(relationships.memberId, memberId));
    
    return result;
  }

  async getAllRelationships(): Promise<Array<Relationship & { relatedMember: Member }>> {
    // Optimized single query with JOIN instead of N+1 queries
    const result = await db
      .select({
        id: relationships.id,
        memberId: relationships.memberId,
        relatedMemberId: relationships.relatedMemberId,
        relationshipType: relationships.relationshipType,
        relatedMember: members
      })
      .from(relationships)
      .innerJoin(members, eq(relationships.relatedMemberId, members.id));
    
    return result;
  }

  async deleteRelationship(id: number): Promise<void> {
    await db.delete(relationships).where(eq(relationships.id, id));
  }

  async getTemple(id: number): Promise<Temple | undefined> {
    const [temple] = await db.select().from(temples).where(eq(temples.id, id));
    return temple || undefined;
  }

  async createTemple(insertTemple: InsertTemple): Promise<Temple> {
    const [temple] = await db
      .insert(temples)
      .values(insertTemple)
      .returning();
    return temple;
  }

  async updateTemple(id: number, insertTemple: InsertTemple): Promise<Temple> {
    const [temple] = await db
      .update(temples)
      .set(insertTemple)
      .where(eq(temples.id, id))
      .returning();
    return temple;
  }

  async deleteTemple(id: number): Promise<void> {
    const result = await db
      .delete(temples)
      .where(eq(temples.id, id))
      .returning();
    
    if (result.length === 0) {
      throw new Error("Temple not found");
    }
  }

  async getAllTemples(): Promise<Temple[]> {
    return await db.select().from(temples);
  }

  async searchTemples(searchTerm: string, state?: string, country?: string): Promise<Temple[]> {
    const allTemples = await db.select().from(temples);
    return allTemples.filter(temple => {
      const matchesSearch = !searchTerm || 
        temple.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        temple.deity.toLowerCase().includes(searchTerm.toLowerCase()) ||
        temple.city.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesState = !state || temple.state === state;
      const matchesCountry = !country || temple.country === country;
      
      return matchesSearch && matchesState && matchesCountry;
    });
  }
}
