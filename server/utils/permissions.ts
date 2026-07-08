export const ROLE_HIERARCHY = {
  owner: 3,
  member: 2,
  viewer: 1,
} as const;

export type Role = keyof typeof ROLE_HIERARCHY;

// Roles that can be assigned to workspace members
export type MemberRole = Exclude<Role, "owner">;

// Check if user has enough permission
export const hasRole = (userRole: Role, requiredRole: Role): boolean => {
  const userRank = ROLE_HIERARCHY[userRole];
  const requiredRank = ROLE_HIERARCHY[requiredRole];

  return userRank >= requiredRank;
};

// Type guard for all roles
export function isRole(value: string): value is Role {
  return value in ROLE_HIERARCHY;
}

// Type guard for roles that can be assigned
export function isMemberRole(value: string): value is MemberRole {
  return value === "member" || value === "viewer";
}
