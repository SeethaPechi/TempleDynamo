export function isUnauthorizedError(error: Error): boolean {
  return /^401: .*Unauthorized/.test(error.message);
}

export function getRoleDisplayName(role: string): string {
  switch (role) {
    case "system_admin":
      return "System Administrator";
    case "temple_admin":
      return "Temple Administrator";
    case "temple_guest":
      return "Temple Guest";
    default:
      return "Unknown Role";
  }
}

export function canDeleteMembers(role?: string): boolean {
  return role === "system_admin";
}

export function canModifyMembers(role?: string): boolean {
  return role === "system_admin" || role === "temple_admin";
}

export function canManageTemples(role?: string): boolean {
  return role === "system_admin" || role === "temple_admin";
}