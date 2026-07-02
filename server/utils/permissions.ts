export const ROLE_HIERARCHY = {
  owner: 3,
  member: 2,
  viewer: 1,
} as const;

export type Role = keyof typeof ROLE_HIERARCHY;

export const hasRole = (userRole: Role, requiredRole: Role): boolean => {
  const userRank = ROLE_HIERARCHY[userRole];
  const requiredRank = ROLE_HIERARCHY[requiredRole];

  return userRank >= requiredRank;
};
