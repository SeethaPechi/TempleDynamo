import { users, members, relationships, temples, type User, type InsertUser, type Member, type InsertMember, type Relationship, type InsertRelationship, type Temple, type InsertTemple, type Role, type RelationshipType, type InsertRelationshipType } from "@shared/schema";

export interface IStorage {
  // User methods (updated for authentication)
  getUser(id: number): Promise<User | undefined>;
  getUserById(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  validateUserCredentials(email: string, password: string): Promise<User | null>;
  getAllUsers(): Promise<User[]>;
  updateUserRole(id: number, role: string): Promise<User | undefined>;
  updateUserPassword(id: number, hash: string): Promise<void>;

  // Password reset token methods
  createPasswordResetToken(userId: number, tokenHash: string, expiresAt: Date): Promise<void>;
  getPasswordResetToken(tokenHash: string): Promise<{ userId: number; expiresAt: Date } | undefined>;
  deletePasswordResetToken(tokenHash: string): Promise<void>;
  deletePasswordResetTokensByUser(userId: number): Promise<void>;

  // Role methods
  getAllRoles(): Promise<Role[]>;

  // Relationship type methods
  getAllRelationshipTypes(): Promise<RelationshipType[]>;
  createRelationshipType(data: InsertRelationshipType): Promise<RelationshipType>;
  updateRelationshipType(id: number, data: Partial<InsertRelationshipType>): Promise<RelationshipType | undefined>;
  deleteRelationshipType(id: number): Promise<void>;

  // Admin compound queries
  getAllMembersWithTemple(): Promise<Array<Member & { templeName: string | null }>>;
  getAllTemplesWithAdmin(): Promise<Array<Temple & { adminUser: { id: number; firstName: string; lastName: string; email: string } | null }>>;
  updateTempleAdmin(templeId: number, adminUserId: number | null): Promise<Temple | undefined>;
  getAllRelationshipsForMap(): Promise<Array<{ id: number; memberId: number; memberName: string; relatedMemberId: number; relatedMemberName: string; relationshipType: string }>>;
  
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

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private members: Map<number, Member>;
  private relationships: Map<number, Relationship>;
  private temples: Map<number, Temple>;
  private currentUserId: number;
  private currentMemberId: number;
  private currentRelationshipId: number;
  private currentTempleId: number;

  constructor() {
    this.users = new Map();
    this.members = new Map();
    this.relationships = new Map();
    this.temples = new Map();
    this.currentUserId = 1;
    this.currentMemberId = 1;
    this.currentRelationshipId = 1;
    this.currentTempleId = 1;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserById(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { 
      ...insertUser, 
      id, 
      isActive: "true",
      createdAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  async validateUserCredentials(email: string, password: string): Promise<User | null> {
    const user = await this.getUserByEmail(email);
    if (user && user.password === password) {
      return user;
    }
    return null;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async updateUserRole(id: number, role: string): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    const updated = { ...user, role };
    this.users.set(id, updated);
    return updated;
  }

  async updateUserPassword(id: number, hash: string): Promise<void> {
    const user = this.users.get(id);
    if (user) this.users.set(id, { ...user, password: hash });
  }

  // Password reset tokens — in-memory store (not needed for production)
  private resetTokens: Map<string, { userId: number; expiresAt: Date }> = new Map();

  async createPasswordResetToken(userId: number, tokenHash: string, expiresAt: Date): Promise<void> {
    this.resetTokens.set(tokenHash, { userId, expiresAt });
  }

  async getPasswordResetToken(tokenHash: string): Promise<{ userId: number; expiresAt: Date } | undefined> {
    return this.resetTokens.get(tokenHash);
  }

  async deletePasswordResetToken(tokenHash: string): Promise<void> {
    this.resetTokens.delete(tokenHash);
  }

  async deletePasswordResetTokensByUser(userId: number): Promise<void> {
    for (const [hash, entry] of this.resetTokens.entries()) {
      if (entry.userId === userId) this.resetTokens.delete(hash);
    }
  }

  async getAllRoles(): Promise<import("@shared/schema").Role[]> {
    return [
      { id: 1, name: "system_admin", label: "System Admin", description: "Full access", createdAt: new Date() },
      { id: 2, name: "temple_admin", label: "Temple Admin", description: "Manage temples and view temple members", createdAt: new Date() },
      { id: 3, name: "user", label: "Regular User", description: "Default role", createdAt: new Date() },
    ];
  }

  async getAllRelationshipTypes(): Promise<RelationshipType[]> { return []; }
  async createRelationshipType(data: InsertRelationshipType): Promise<RelationshipType> {
    return { id: 1, ...data, labelTa: data.labelTa ?? null, category: data.category ?? null, createdAt: new Date() };
  }
  async updateRelationshipType(id: number, data: Partial<InsertRelationshipType>): Promise<RelationshipType | undefined> { return undefined; }
  async deleteRelationshipType(id: number): Promise<void> {}
  async getAllMembersWithTemple(): Promise<Array<Member & { templeName: string | null }>> { return []; }
  async getAllTemplesWithAdmin(): Promise<Array<Temple & { adminUser: { id: number; firstName: string; lastName: string; email: string } | null }>> { return []; }
  async updateTempleAdmin(templeId: number, adminUserId: number | null): Promise<Temple | undefined> { return undefined; }
  async getAllRelationshipsForMap(): Promise<Array<{ id: number; memberId: number; memberName: string; relatedMemberId: number; relatedMemberName: string; relationshipType: string }>> { return []; }

  // Member methods
  async getMember(id: number): Promise<Member | undefined> {
    return this.members.get(id);
  }

  async getMemberByEmail(email: string): Promise<Member | undefined> {
    return Array.from(this.members.values()).find(
      (member) => member.email === email,
    );
  }

  async createMember(insertMember: InsertMember): Promise<Member> {
    const id = this.currentMemberId++;
    const member: Member = { 
      ...insertMember, 
      id, 
      createdAt: new Date()
    };
    this.members.set(id, member);
    return member;
  }

  async getAllMembers(): Promise<Member[]> {
    return Array.from(this.members.values());
  }

  async searchMembers(searchTerm: string, city?: string, state?: string): Promise<Member[]> {
    const allMembers = Array.from(this.members.values());
    return allMembers.filter(member => {
      const matchesSearch = !searchTerm || 
        member.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (member.email && member.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (member.phone && member.phone.includes(searchTerm));
      
      const matchesCity = !city || member.currentCity.toLowerCase() === city.toLowerCase();
      const matchesState = !state || member.currentState.toLowerCase() === state.toLowerCase();
      
      return matchesSearch && matchesCity && matchesState;
    });
  }

  async getUniqueCities(): Promise<string[]> {
    const allMembers = Array.from(this.members.values());
    const cities = new Set<string>();
    allMembers.forEach(member => {
      if (member.currentCity) {
        cities.add(member.currentCity);
      }
    });
    return Array.from(cities).sort();
  }

  async getUniqueStates(): Promise<string[]> {
    const allMembers = Array.from(this.members.values());
    const states = new Set<string>();
    allMembers.forEach(member => {
      if (member.currentState) {
        states.add(member.currentState);
      }
    });
    return Array.from(states).sort();
  }

  // Relationship methods
  async createRelationship(insertRelationship: InsertRelationship): Promise<Relationship> {
    const id = this.currentRelationshipId++;
    const relationship: Relationship = { 
      ...insertRelationship, 
      id, 
      createdAt: new Date()
    };
    this.relationships.set(id, relationship);
    return relationship;
  }

  async getMemberRelationships(memberId: number): Promise<Array<Relationship & { relatedMember: Member }>> {
    const memberRelationships = Array.from(this.relationships.values())
      .filter(rel => rel.memberId === memberId);
    
    const result = [];
    for (const rel of memberRelationships) {
      const relatedMember = this.members.get(rel.relatedMemberId);
      if (relatedMember) {
        result.push({ ...rel, relatedMember });
      }
    }
    return result;
  }

  async updateMember(id: number, insertMember: InsertMember): Promise<Member> {
    const member = this.members.get(id);
    if (!member) {
      throw new Error("Member not found");
    }
    const updatedMember: Member = { ...member, ...insertMember };
    this.members.set(id, updatedMember);
    return updatedMember;
  }

  async deleteMember(id: number): Promise<void> {
    // Delete all relationships involving this member
    for (const [relationshipId, relationship] of this.relationships.entries()) {
      if (relationship.memberId === id || relationship.relatedMemberId === id) {
        this.relationships.delete(relationshipId);
      }
    }
    // Delete the member
    this.members.delete(id);
  }

  async getAllRelationships(): Promise<Array<Relationship & { relatedMember: Member }>> {
    const results: Array<Relationship & { relatedMember: Member }> = [];
    
    for (const [id, relationship] of this.relationships) {
      const relatedMember = this.members.get(relationship.relatedMemberId);
      if (relatedMember) {
        results.push({
          ...relationship,
          relatedMember
        });
      }
    }
    
    return results;
  }

  async updateRelationship(id: number, data: { relationshipType: string }): Promise<Relationship> {
    const existingRelationship = this.relationships.get(id);
    if (!existingRelationship) {
      throw new Error("Relationship not found");
    }
    const updatedRelationship: Relationship = {
      ...existingRelationship,
      relationshipType: data.relationshipType,
    };
    this.relationships.set(id, updatedRelationship);
    return updatedRelationship;
  }

  async deleteRelationship(id: number): Promise<void> {
    this.relationships.delete(id);
  }

  // Temple methods
  async getTemple(id: number): Promise<Temple | undefined> {
    return this.temples.get(id);
  }

  async createTemple(insertTemple: InsertTemple): Promise<Temple> {
    const id = this.currentTempleId++;
    const temple: Temple = { 
      ...insertTemple, 
      id,
      createdAt: new Date()
    };
    this.temples.set(id, temple);
    return temple;
  }

  async updateTemple(id: number, insertTemple: InsertTemple): Promise<Temple> {
    const existingTemple = this.temples.get(id);
    if (!existingTemple) {
      throw new Error("Temple not found");
    }
    const updatedTemple: Temple = { 
      ...existingTemple, 
      ...insertTemple 
    };
    this.temples.set(id, updatedTemple);
    return updatedTemple;
  }

  async getAllTemples(): Promise<Temple[]> {
    return Array.from(this.temples.values());
  }

  async deleteTemple(id: number): Promise<void> {
    if (!this.temples.has(id)) {
      throw new Error("Temple not found");
    }
    this.temples.delete(id);
  }

  async searchTemples(searchTerm: string, state?: string, country?: string): Promise<Temple[]> {
    const temples = Array.from(this.temples.values());
    return temples.filter(temple => {
      const matchesSearch = !searchTerm || 
        temple.templeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        temple.village.toLowerCase().includes(searchTerm.toLowerCase()) ||
        temple.nearestCity.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (temple.deity && temple.deity.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesState = !state || temple.state.toLowerCase() === state.toLowerCase();
      const matchesCountry = !country || temple.country.toLowerCase() === country.toLowerCase();
      
      return matchesSearch && matchesState && matchesCountry;
    });
  }
}

import { DatabaseStorage } from "./db";

export const storage = new DatabaseStorage();
