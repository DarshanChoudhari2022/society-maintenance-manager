import "server-only";
import { getSession } from "./auth";

// Role hierarchy: chairman > secretary > treasurer > member
const ROLE_PERMISSIONS: Record<string, string[]> = {
  chairman: [
    "dashboard", "members", "maintenance", "bills", "expenses", "reports",
    "notices", "complaints", "reminders", "visitors", "parking", "facilities",
    "emergency", "documents", "meetings", "polls", "settings", "activity_log",
    "notifications", "manage_users"
  ],
  secretary: [
    "dashboard", "members", "maintenance", "bills", "notices", "complaints",
    "reminders", "visitors", "parking", "facilities", "emergency",
    "documents", "meetings", "polls", "activity_log", "notifications"
  ],
  treasurer: [
    "dashboard", "maintenance", "bills", "expenses", "reports",
    "notices", "complaints", "visitors", "parking", "facilities",
    "emergency", "documents", "polls", "notifications"
  ],
  member: [
    "dashboard", "notices", "complaints", "visitors", "parking",
    "facilities", "emergency", "polls", "documents", "notifications"
  ],
};

const ADMIN_ROLES = ["chairman", "secretary", "treasurer"];

export function hasPermission(role: string, module: string): boolean {
  const perms = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS["member"];
  return perms.includes(module);
}

export function isAdmin(role: string): boolean {
  return ADMIN_ROLES.includes(role);
}

export function isCommittee(role: string): boolean {
  return ["chairman", "secretary"].includes(role);
}

// Server-side check that returns 403 if unauthorized
export async function requirePermission(module: string) {
  const session = await getSession();
  if (!session?.societyId) {
    return { error: "Unauthorized", status: 401, session: null };
  }

  if (!hasPermission(session.role, module)) {
    return { error: "Forbidden: insufficient permissions", status: 403, session: null };
  }

  return { error: null, status: 200, session };
}

// Quick check for admin-only routes
export async function requireAdmin() {
  const session = await getSession();
  if (!session?.societyId) {
    return { error: "Unauthorized", status: 401, session: null };
  }
  if (!isAdmin(session.role)) {
    return { error: "Admin access required", status: 403, session: null };
  }
  return { error: null, status: 200, session };
}
