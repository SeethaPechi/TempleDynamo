import { users, members, relationships, temples, type User, type InsertUser, type Member, type InsertMember, type Relationship, type InsertRelationship, type Temple, type InsertTemple } from "@shared/schema";

export interface IStorage {
  // User methods (existing)
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Member methods
  getMember(id: number): Promise<Member | undefined>;
  getMemberByEmail(email: string): Promise<Member | undefined>;
  createMember(member: InsertMember): Promise<Member>;
  updateMember(id: number, member: InsertMember): Promise<Member>;
  deleteMember(id: number): Promise<void>;
  getAllMembers(): Promise<Member[]>;
  searchMembers(searchTerm: string, city?: string, state?: string): Promise<Member[]>;
  
  // Relationship methods
  createRelationship(relationship: InsertRelationship): Promise<Relationship>;
  getMemberRelationships(memberId: number): Promise<Array<Relationship & { relatedMember: Member }>>;
  getAllRelationships(): Promise<Array<Relationship & { relatedMember: Member }>>;
  deleteRelationship(id: number): Promise<void>;
  
  // Temple methods
  getTemple(id: number): Promise<Temple | undefined>;
  createTemple(temple: InsertTemple): Promise<Temple>;
  updateTemple(id: number, temple: InsertTemple): Promise<Temple>;
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

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

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
    const member: Member = { ...insertMember, id };
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
        member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.phone.includes(searchTerm);
      
      const matchesCity = !city || member.currentCity.toLowerCase() === city.toLowerCase();
      const matchesState = !state || member.currentState.toLowerCase() === state.toLowerCase();
      
      return matchesSearch && matchesCity && matchesState;
    });
  }

  // Relationship methods
  async createRelationship(insertRelationship: InsertRelationship): Promise<Relationship> {
    const id = this.currentRelationshipId++;
    const relationship: Relationship = { ...insertRelationship, id };
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
