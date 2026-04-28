const ROLE_HIERARCHY = {
  owner: 3,
  member: 2,
  viewer: 1,
};

const hasRole = (userRole, requiredRole) => {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
};

module.exports = { ROLE_HIERARCHY, hasRole };
