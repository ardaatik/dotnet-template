// Mirror your server-side Claims.cs structure
export const ClaimTypes = {
  TODOS: 'todos',
  USERS: 'users',
  PERMISSION: 'permission',
} as const;

export const ClaimValues = {
  // CRUD operations
  READ: 'read',
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',

  // Permissions
  USERS_MANAGE: 'users.manage',
  ROLES_MANAGE: 'roles.manage',

  // Own resource access
  READ_OWN: 'read_own',
  UPDATE_OWN: 'update_own',
} as const;

export const Roles = {
  ADMIN: 'Admin',
  USER: 'User',
  // Add other roles as needed
} as const;

// Convenience object for common permission checks
export const Permissions = {
  MANAGE_ROLES: ClaimValues.ROLES_MANAGE,
  MANAGE_USERS: ClaimValues.USERS_MANAGE,
  CREATE_TODOS: ClaimValues.CREATE,
  READ_TODOS: ClaimValues.READ,
  UPDATE_TODOS: ClaimValues.UPDATE,
  DELETE_TODOS: ClaimValues.DELETE,
} as const;
