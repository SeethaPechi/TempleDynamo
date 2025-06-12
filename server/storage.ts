import { users, members, relationships, type User, type InsertUser, type Member, type InsertMember, type Relationship, type InsertRelationship } from "@shared/schema";

export interface IStorage {
  // User methods (existing)
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Member methods
  getMember(id: number): Promise<Member | undefined>;
  getMemberByEmail(email: string): Promise<Member | undefined>;
  createMember(member: InsertMember): Promise<Member>;
  getAllMembers(): Promise<Member[]>;
  searchMembers(searchTerm: string, city?: string, state?: string): Promise<Member[]>;
  
  // Relationship methods
  createRelationship(relationship: InsertRelationship): Promise<Relationship>;
  getMemberRelationships(memberId: number): Promise<Array<Relationship & { relatedMember: Member }>>;
  deleteRelationship(id: number): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private members: Map<number, Member>;
  private relationships: Map<number, Relationship>;
  private currentUserId: number;
  private currentMemberId: number;
  private currentRelationshipId: number;

  constructor() {
    this.users = new Map();
    this.members = new Map();
    this.relationships = new Map();
    this.currentUserId = 1;
    this.currentMemberId = 1;
    this.currentRelationshipId = 1;
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

  async deleteRelationship(id: number): Promise<void> {
    this.relationships.delete(id);
  }
}

export const storage = new MemStorage();
