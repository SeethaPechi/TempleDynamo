import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq, or, asc, sql, isNull } from 'drizzle-orm';
import * as schema from "@shared/schema";
import { users, roles, relationshipTypes, type User, type InsertUser, type Role, type RelationshipType, type InsertRelationshipType, members, type Member, type InsertMember, relationships, type Relationship, type InsertRelationship, temples, type Temple, type InsertTemple } from "@shared/schema";

// SECURITY: Use environment variables for production credentials
const DATABASE_URL = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL || "postgresql://YOUR_DB_USER:YOUR_SECURE_PASSWORD@localhost:5432/temple_management";

if (!DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

console.log('Connecting to PostgreSQL database:', DATABASE_URL.replace(/:[^:]*@/, ':****@'));

// Standard PostgreSQL connection pool configuration
export const pool = new Pool({ 
  connectionString: DATABASE_URL,
  max: 20, // Standard pool size for local PostgreSQL
  min: 2,  // Minimum connections
  idleTimeoutMillis: 30000, // 30 seconds idle timeout
  connectionTimeoutMillis: 10000, // 10 seconds connection timeout
  ssl: false // Disable SSL for local connection
});

// Initialize database with error handling
export const db = drizzle(pool, { schema });

// Test database connection on startup
pool.on('error', (err) => {
  console.error('Database pool error:', err);
});

// Graceful cleanup on process exit
process.on('SIGINT', async () => {
  await pool.end();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await pool.end();
  process.exit(0);
});

import type { IStorage } from "./storage";

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserById(id: number): Promise<User | undefined> {
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
      .values({ ...insertUser, role: "user" })
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(asc(users.id));
  }

  async updateUserPassword(id: number, hash: string): Promise<void> {
    await db.update(users).set({ password: hash }).where(eq(users.id, id));
  }

  // ── Password reset tokens ──────────────────────────────────────────────────

  async createPasswordResetToken(userId: number, tokenHash: string, expiresAt: Date): Promise<void> {
    await pool.query(
      `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, $3)
       ON CONFLICT (token_hash) DO NOTHING`,
      [userId, tokenHash, expiresAt],
    );
  }

  async getPasswordResetToken(tokenHash: string): Promise<{ userId: number; expiresAt: Date } | undefined> {
    const result = await pool.query<{ user_id: number; expires_at: Date }>(
      `SELECT user_id, expires_at
       FROM   password_reset_tokens
       WHERE  token_hash = $1
       LIMIT  1`,
      [tokenHash],
    );
    if (!result.rows.length) return undefined;
    return { userId: result.rows[0].user_id, expiresAt: result.rows[0].expires_at };
  }

  async deletePasswordResetToken(tokenHash: string): Promise<void> {
    await pool.query(
      `DELETE FROM password_reset_tokens WHERE token_hash = $1`,
      [tokenHash],
    );
  }

  async deletePasswordResetTokensByUser(userId: number): Promise<void> {
    await pool.query(
      `DELETE FROM password_reset_tokens WHERE user_id = $1`,
      [userId],
    );
  }

  async updateUserRole(id: number, role: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ role })
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async getAllRoles(): Promise<Role[]> {
    return await db.select().from(roles).orderBy(asc(roles.id));
  }

  // ── Relationship Types ────────────────────────────────────────────────────

  async getAllRelationshipTypes(): Promise<RelationshipType[]> {
    return await db.select().from(relationshipTypes).orderBy(asc(relationshipTypes.id));
  }

  async createRelationshipType(data: InsertRelationshipType): Promise<RelationshipType> {
    const [rt] = await db.insert(relationshipTypes).values(data).returning();
    return rt;
  }

  async updateRelationshipType(id: number, data: Partial<InsertRelationshipType>): Promise<RelationshipType | undefined> {
    const [rt] = await db.update(relationshipTypes).set(data).where(eq(relationshipTypes.id, id)).returning();
    return rt || undefined;
  }

  async deleteRelationshipType(id: number): Promise<void> {
    await db.delete(relationshipTypes).where(eq(relationshipTypes.id, id));
  }

  // ── Admin compound queries ─────────────────────────────────────────────────

  async getAllMembersWithTemple(): Promise<Array<Member & { templeName: string | null }>> {
    const result = await db
      .select({
        id: members.id,
        fullName: members.fullName,
        fullNameTa: members.fullNameTa,
        phone: members.phone,
        email: members.email,
        gender: members.gender,
        birthCity: members.birthCity,
        birthCityTa: members.birthCityTa,
        birthState: members.birthState,
        birthCountry: members.birthCountry,
        currentCity: members.currentCity,
        currentCityTa: members.currentCityTa,
        currentState: members.currentState,
        currentCountry: members.currentCountry,
        fatherName: members.fatherName,
        fatherNameTa: members.fatherNameTa,
        motherName: members.motherName,
        motherNameTa: members.motherNameTa,
        spouseName: members.spouseName,
        spouseNameTa: members.spouseNameTa,
        spouseName2: members.spouseName2,
        spouseName2Ta: members.spouseName2Ta,
        maritalStatus: members.maritalStatus,
        templeId: members.templeId,
        profilePicture: members.profilePicture,
        photos: members.photos,
        createdAt: members.createdAt,
        templeName: temples.templeName,
      })
      .from(members)
      .leftJoin(temples, eq(members.templeId, temples.id))
      .orderBy(asc(members.fullName));

    return result.map(r => ({ ...r, templeName: r.templeName ?? null }));
  }

  async getAllTemplesWithAdmin(): Promise<Array<Temple & { adminUser: { id: number; firstName: string; lastName: string; email: string } | null }>> {
    const allTemples = await db.select().from(temples).orderBy(asc(temples.templeName));
    const allUsers = await db.select({ id: users.id, firstName: users.firstName, lastName: users.lastName, email: users.email }).from(users);

    return allTemples.map(t => ({
      ...t,
      adminUser: t.templeAdminId
        ? allUsers.find(u => u.id === t.templeAdminId) ?? null
        : null,
    }));
  }

  async updateTempleAdmin(templeId: number, adminUserId: number | null): Promise<Temple | undefined> {
    const [temple] = await db
      .update(temples)
      .set({ templeAdminId: adminUserId })
      .where(eq(temples.id, templeId))
      .returning();
    return temple || undefined;
  }

  async getAllRelationshipsForMap(): Promise<Array<{ id: number; memberId: number; memberName: string; relatedMemberId: number; relatedMemberName: string; relationshipType: string }>> {
    const result = await pool.query<{ id: number; member_id: number; member_name: string; related_member_id: number; related_member_name: string; relationship_type: string }>(`
      SELECT r.id,
             r.member_id,
             m1.full_name  AS member_name,
             r.related_member_id,
             m2.full_name  AS related_member_name,
             r.relationship_type
      FROM   relationships r
      JOIN   members m1 ON m1.id = r.member_id
      JOIN   members m2 ON m2.id = r.related_member_id
      ORDER  BY m1.full_name
    `);
    return result.rows.map(r => ({
      id: r.id,
      memberId: r.member_id,
      memberName: r.member_name,
      relatedMemberId: r.related_member_id,
      relatedMemberName: r.related_member_name,
      relationshipType: r.relationship_type,
    }));
  }

  async getMember(id: number): Promise<Member | undefined> {
    const [member] = await db.select().from(members).where(eq(members.id, id));
    console.log(`getMember(${id}) - Found:`, {
      id: member?.id,
      name: member?.fullName,
      hasProfilePicture: !!member?.profilePicture,
      profilePictureLength: member?.profilePicture?.length || 0,
      photosCount: member?.photos?.length || 0
    });
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
    console.log(`updateMember(${id}) - Data:`, {
      hasProfilePicture: !!insertMember.profilePicture,
      profilePictureLength: insertMember.profilePicture?.length || 0,
      photosCount: insertMember.photos?.length || 0,
      photos: insertMember.photos?.map((p, i) => `Photo ${i}: ${p.substring(0, 30)}...`)
    });
    
    const [member] = await db
      .update(members)
      .set(insertMember)
      .where(eq(members.id, id))
      .returning();
      
    console.log(`updateMember(${id}) - Updated:`, {
      hasProfilePicture: !!member.profilePicture,
      profilePictureLength: member.profilePicture?.length || 0,
      photosCount: member.photos?.length || 0
    });
    
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
    return await db.select().from(members).orderBy(asc(members.id));
  }

  async searchMembers(searchTerm: string, city?: string, state?: string): Promise<Member[]> {
    const allMembers = await db.select().from(members);
    return allMembers.filter(member => {
      const matchesSearch = !searchTerm || 
        member.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (member.email && member.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (member.phone && member.phone.includes(searchTerm));
      
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
        createdAt: relationships.createdAt,
        relatedMember: members
      })
      .from(relationships)
      .innerJoin(members, eq(relationships.relatedMemberId, members.id))
      .where(eq(relationships.memberId, memberId));
    
    return result as Array<Relationship & { relatedMember: Member }>;
  }

  async getAllRelationships(): Promise<Array<Relationship & { relatedMember: Member }>> {
    // Optimized single query with JOIN instead of N+1 queries
    const result = await db
      .select({
        id: relationships.id,
        memberId: relationships.memberId,
        relatedMemberId: relationships.relatedMemberId,
        relationshipType: relationships.relationshipType,
        createdAt: relationships.createdAt,
        relatedMember: members
      })
      .from(relationships)
      .innerJoin(members, eq(relationships.relatedMemberId, members.id));
    
    return result as Array<Relationship & { relatedMember: Member }>;
  }

  async updateRelationship(id: number, data: { relationshipType: string }): Promise<Relationship> {
    const [relationship] = await db
      .update(relationships)
      .set({ relationshipType: data.relationshipType })
      .where(eq(relationships.id, id))
      .returning();
    
    if (!relationship) {
      throw new Error("Relationship not found");
    }
    
    return relationship;
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
        temple.templeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (temple.deity && temple.deity.toLowerCase().includes(searchTerm.toLowerCase())) ||
        temple.village.toLowerCase().includes(searchTerm.toLowerCase()) ||
        temple.nearestCity.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesState = !state || temple.state === state;
      const matchesCountry = !country || temple.country === country;
      
      return matchesSearch && matchesState && matchesCountry;
    });
  }

  async getUniqueCities(): Promise<string[]> {
    const result = await db
      .selectDistinct({ currentCity: members.currentCity })
      .from(members)
      .where(sql`${members.currentCity} IS NOT NULL AND ${members.currentCity} != ''`);
    
    return result
      .map(row => row.currentCity)
      .filter(city => city)
      .sort();
  }

  async getUniqueStates(): Promise<string[]> {
    const result = await db
      .selectDistinct({ currentState: members.currentState })
      .from(members)
      .where(sql`${members.currentState} IS NOT NULL AND ${members.currentState} != ''`);
    
    return result
      .map(row => row.currentState)
      .filter(state => state)
      .sort();
  }
}
