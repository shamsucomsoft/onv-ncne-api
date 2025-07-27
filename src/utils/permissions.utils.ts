import { RoleTypeEnum } from 'src/drizzle/schema';

export const permissions = {
  [RoleTypeEnum.ADMIN]: {
    users: ['users:create', 'users:read', 'users:update', 'users:delete'],
    roles: ['roles:create', 'roles:read', 'roles:update', 'roles:delete'],
    dashboard: ['dashboard:read'],
    collections: [
      'collections:read',
      'collections:create',
      'collections:update',
      'collections:delete',
    ],
    reports: [
      'reports:read',
      'reports:create',
      'reports:update',
      'reports:delete',
    ],
    logs: ['logs:read', 'logs:create', 'logs:update', 'logs:delete'],
    settings: ['settings:read', 'settings:update'],
    profile: ['profile:read', 'profile:update'],
  },
  [RoleTypeEnum.COLLECTOR]: {
    collections: [
      'collections:read',
      'collections:create',
      'collections:update',
    ],
    logs: ['logs:read', 'logs:create', 'logs:update'],
    profile: ['profile:read', 'profile:update'],
  },
};

export function getAllRolePermissions(roleType: RoleTypeEnum) {
  return Object.values(permissions[roleType]).flat();
}

export function getRolePermissions(roleType: RoleTypeEnum, permission: string) {
  return permissions[roleType][permission];
}