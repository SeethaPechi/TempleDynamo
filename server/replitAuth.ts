import type { Express, RequestHandler } from "express";

// Extend Express Request type to include user role information
declare global {
  namespace Express {
    interface Request {
      userRole?: string;
      userTempleId?: number | null;
    }
  }
}
import { storage } from "./storage";

// Simple session-based authentication for development
// In production, you would integrate with Replit Auth or other OAuth providers

// Mock user session for development
interface MockUser {
  id: string;
  email: string;
  role: string;
  templeId?: number;
}

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

export async function setupAuth(app: Express) {
  // Simple login endpoint for demo
  app.post("/api/auth/login", (req, res) => {
    const { role } = req.body;
    
    if (!role || !mockUsers[role]) {
      return res.status(400).json({ message: "Invalid role" });
    }
    
    const user = mockUsers[role];
    
    // Set user in session (simplified)
    (req as any).session = (req as any).session || {};
    (req as any).session.user = user;
    
    res.json({ success: true, user });
  });
  
  // Logout endpoint
  app.post("/api/auth/logout", (req, res) => {
    (req as any).session = null;
    res.json({ success: true });
  });
  
  // Get current user
  app.get("/api/auth/user", (req, res) => {
    const user = (req as any).session?.user;
    if (!user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    res.json(user);
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const user = (req as any).session?.user;
  
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