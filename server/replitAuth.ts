import type { Express, RequestHandler } from "express";

// Extend Express Request type to include user role information and cookies
declare global {
  namespace Express {
    interface Request {
      userRole?: string;
      userTempleId?: number | null;
      cookies?: Record<string, string>;
    }
    interface Response {
      cookie(name: string, value: string, options?: any): Response;
      clearCookie(name: string): Response;
    }
  }
}
import { storage } from "./storage";

// Simple in-memory authentication for development
// In production, you would integrate with Replit Auth or other OAuth providers

// Mock user session for development
interface MockUser {
  id: string;
  email: string;
  role: string;
  templeId?: number;
}

// In-memory session storage for development
const activeSessions: Map<string, MockUser> = new Map();

// Temporary storage for demo users
const mockUsers: Record<string, MockUser> = {
  "system_admin": {
    id: "sys_admin_1",
    email: "admin@temple.com",
    role: "system_admin"
  },
  "temple_admin": {
    id: "temple_admin_1", 
    email: "temple_admin@temple.com",
    role: "temple_admin",
    templeId: 5
  },
  "temple_guest": {
    id: "guest_1",
    email: "guest@temple.com", 
    role: "temple_guest",
    templeId: 5
  }
};

// Generate simple session ID
function generateSessionId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export async function setupAuth(app: Express) {
  // Simple login endpoint for demo
  app.post("/api/auth/login", (req, res) => {
    const { role } = req.body;
    
    if (!role || !mockUsers[role]) {
      return res.status(400).json({ message: "Invalid role" });
    }
    
    const user = mockUsers[role];
    const sessionId = generateSessionId();
    
    // Store session in memory
    activeSessions.set(sessionId, user);
    
    // Set session cookie
    res.cookie('sessionId', sessionId, {
      httpOnly: true,
      secure: false, // Set to true in production with HTTPS
      maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
      sameSite: 'lax'
    });
    
    res.json({ success: true, user });
  });
  
  // Logout endpoint
  app.post("/api/auth/logout", (req, res) => {
    const sessionId = req.cookies?.sessionId;
    if (sessionId) {
      activeSessions.delete(sessionId);
    }
    res.clearCookie('sessionId');
    res.json({ success: true });
  });
  
  // Get current user
  app.get("/api/auth/user", (req, res) => {
    const sessionId = req.cookies?.sessionId;
    if (!sessionId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const user = activeSessions.get(sessionId);
    if (!user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    res.json(user);
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const sessionId = req.cookies?.sessionId;
  
  if (!sessionId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  const user = activeSessions.get(sessionId);
  if (!user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  // Attach user to request for further middleware
  (req as any).currentUser = user;
  next();
};

// Role-based authorization middleware
export const requireRole = (requiredRoles: string[]): RequestHandler => {
  return async (req, res, next) => {
    try {
      const user = (req as any).currentUser;
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      if (!requiredRoles.includes(user.role)) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      // Attach user role info to request for further use
      req.userRole = user.role;
      req.userTempleId = user.templeId;
      
      next();
    } catch (error) {
      console.error("Role authorization error:", error);
      res.status(500).json({ message: "Authorization error" });
    }
  };
};

// Check if user can delete members (only system admins can delete)
export const canDeleteMembers: RequestHandler = async (req, res, next) => {
  try {
    const user = (req as any).currentUser;
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (user.role !== "system_admin") {
      return res.status(403).json({ message: "Only system administrators can delete members" });
    }

    next();
  } catch (error) {
    console.error("Delete permission check error:", error);
    res.status(500).json({ message: "Permission check error" });
  }
};

// Check if user can modify members (system admins and temple admins can modify)
export const canModifyMembers: RequestHandler = async (req, res, next) => {
  try {
    const user = (req as any).currentUser;
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!["system_admin", "temple_admin"].includes(user.role)) {
      return res.status(403).json({ message: "Insufficient permissions to modify members" });
    }

    next();
  } catch (error) {
    console.error("Modify permission check error:", error);
    res.status(500).json({ message: "Permission check error" });
  }
};