import { users, members, relationships, temples, type User, type InsertUser, type UpsertUser, type Member, type InsertMember, type Relationship, type InsertRelationship, type Temple, type InsertTemple } from "@shared/schema";
import { db } from "./db";
import { eq, ilike, or, and } from "drizzle-orm";

export interface IStorage {
  // User methods for authentication
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, userData: Partial<InsertUser>): Promise<User>;
  getAllUsers(): Promise<User[]>;
  
  // Member methods
  getMember(id: number): Promise<Member | undefined>;
  getMemberByEmail(email: string): Promise<Member | undefined>;
  createMember(member: InsertMember): Promise<Member>;
  updateMember(id: number, member: InsertMember): Promise<Member>;
  deleteMember(id: number): Promise<void>;
  getAllMembers(): Promise<Member[]>;
  searchMembers(searchTerm: string, city?: string, state?: string): Promise<Member[]>;
  getUniqueCities(): Promise<string[]>;
  getUniqueStates(): Promise<string[]>;
  
  // Relationship methods
  createRelationship(relationship: InsertRelationship): Promise<Relationship>;
  getMemberRelationships(memberId: number): Promise<Array<Relationship & { relatedMember: Member }>>;
  getAllRelationships(): Promise<Array<Relationship & { relatedMember: Member }>>;
  updateRelationship(id: number, data: { relationshipType: string }): Promise<Relationship>;
  deleteRelationship(id: number): Promise<void>;
  
  // Temple methods
  getTemple(id: number): Promise<Temple | undefined>;
  createTemple(temple: InsertTemple): Promise<Temple>;
  updateTemple(id: number, temple: InsertTemple): Promise<Temple>;
  deleteTemple(id: number): Promise<void>;
  getAllTemples(): Promise<Temple[]>;
  searchTemples(searchTerm: string, state?: string, country?: string): Promise<Temple[]>;
}

export class DatabaseStorage implements IStorage {
  // User methods for authentication
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUser(id: string, userData: Partial<InsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...userData, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  // Member methods
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
    // Delete relationships first
    await db.delete(relationships).where(
      or(
        eq(relationships.memberId, id),
        eq(relationships.relatedMemberId, id)
      )
    );
    // Delete member
    await db.delete(members).where(eq(members.id, id));
  }

  async getAllMembers(): Promise<Member[]> {
    return await db.select().from(members);
  }

  async searchMembers(searchTerm: string, city?: string, state?: string): Promise<Member[]> {
    const conditions = [];
    
    if (searchTerm) {
      conditions.push(
        or(
          ilike(members.fullName, `%${searchTerm}%`),
          ilike(members.email, `%${searchTerm}%`),
          ilike(members.phone, `%${searchTerm}%`)
        )
      );
    }
    
    if (city) {
      conditions.push(eq(members.currentCity, city));
    }
    
    if (state) {
      conditions.push(eq(members.currentState, state));
    }
    
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    
    return await db.select().from(members).where(whereClause);
  }

  async getUniqueCities(): Promise<string[]> {
    const result = await db.selectDistinct({ city: members.currentCity }).from(members);
    return result.map(r => r.city).filter(Boolean).sort();
  }

  async getUniqueStates(): Promise<string[]> {
    const result = await db.selectDistinct({ state: members.currentState }).from(members);
    return result.map(r => r.state).filter(Boolean).sort();
  }

  // Relationship methods
  async createRelationship(insertRelationship: InsertRelationship): Promise<Relationship> {
    const [relationship] = await db
      .insert(relationships)
      .values(insertRelationship)
      .returning();
    return relationship;
  }

  async getMemberRelationships(memberId: number): Promise<Array<Relationship & { relatedMember: Member }>> {
    const result = await db
      .select()
      .from(relationships)
      .innerJoin(members, eq(relationships.relatedMemberId, members.id))
      .where(eq(relationships.memberId, memberId));

    return result.map(row => ({
      ...row.relationships,
      relatedMember: row.members
    }));
  }

  async getAllRelationships(): Promise<Array<Relationship & { relatedMember: Member }>> {
    const result = await db
      .select()
      .from(relationships)
      .innerJoin(members, eq(relationships.relatedMemberId, members.id));

    return result.map(row => ({
      ...row.relationships,
      relatedMember: row.members
    }));
  }

  async updateRelationship(id: number, data: { relationshipType: string }): Promise<Relationship> {
    const [relationship] = await db
      .update(relationships)
      .set(data)
      .where(eq(relationships.id, id))
      .returning();
    return relationship;
  }

  async deleteRelationship(id: number): Promise<void> {
    await db.delete(relationships).where(eq(relationships.id, id));
  }

  // Temple methods
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
    await db.delete(temples).where(eq(temples.id, id));
  }

  async getAllTemples(): Promise<Temple[]> {
    return await db.select().from(temples);
  }

  async searchTemples(searchTerm: string, state?: string, country?: string): Promise<Temple[]> {
    const conditions = [];
    
    if (searchTerm) {
      conditions.push(
        or(
          ilike(temples.templeName, `%${searchTerm}%`),
          ilike(temples.village, `%${searchTerm}%`),
          ilike(temples.nearestCity, `%${searchTerm}%`),
          ilike(temples.deity, `%${searchTerm}%`)
        )
      );
    }
    
    if (state) {
      conditions.push(eq(temples.state, state));
    }
    
    if (country) {
      conditions.push(eq(temples.country, country));
    }
    
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    
    return await db.select().from(temples).where(whereClause);
  }
}

export const storage = new DatabaseStorage();
