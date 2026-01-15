import { type Permission, type Resource, type Action, type RoleName, type SessionUser, ROLE_HIERARCHY, DEFAULT_ROLE_PERMISSIONS } from '../types/auth';

export function hasPermission(user: SessionUser, resource: Resource, action: Action): boolean {
  const permission: Permission = `${resource}:${action}`;
  return user.permissions.includes(permission);
}

export function hasAnyPermission(user: SessionUser, permissions: Permission[]): boolean {
  return permissions.some((p) => user.permissions.includes(p));
}

export function hasAllPermissions(user: SessionUser, permissions: Permission[]): boolean {
  return permissions.every((p) => user.permissions.includes(p));
}

export function canRead(user: SessionUser, resource: Resource): boolean {
  return hasPermission(user, resource, 'read');
}

export function canCreate(user: SessionUser, resource: Resource): boolean {
  return hasPermission(user, resource, 'create');
}

export function canUpdate(user: SessionUser, resource: Resource): boolean {
  return hasPermission(user, resource, 'update');
}

export function canDelete(user: SessionUser, resource: Resource): boolean {
  return hasPermission(user, resource, 'delete');
}

export function isRoleAtLeast(userRole: RoleName, requiredRole: RoleName): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

export function getPermissionsForRole(role: RoleName): Permission[] {
  return DEFAULT_ROLE_PERMISSIONS[role] || [];
}

export function isCISO(user: SessionUser): boolean {
  return user.role === 'CISO';
}

export function isAdmin(user: SessionUser): boolean {
  return user.role === 'ADMIN' || user.role === 'CISO';
}

export function isAnalyst(user: SessionUser): boolean {
  return isRoleAtLeast(user.role, 'ANALYST');
}

export function isViewer(user: SessionUser): boolean {
  return isRoleAtLeast(user.role, 'VIEWER');
}

export function filterByPermission<T extends { id: string }>(
  items: T[],
  user: SessionUser,
  resource: Resource,
  action: Action = 'read'
): T[] {
  if (hasPermission(user, resource, action)) {
    return items;
  }
  return [];
}

export function requirePermission(user: SessionUser, resource: Resource, action: Action): void {
  if (!hasPermission(user, resource, action)) {
    throw new Error(`Access denied: ${action} permission on ${resource} required`);
  }
}

export function requireRole(user: SessionUser, role: RoleName): void {
  if (!isRoleAtLeast(user.role, role)) {
    throw new Error(`Access denied: ${role} role or higher required`);
  }
}

export class PermissionDeniedError extends Error {
  constructor(
    public resource: Resource,
    public action: Action,
    message?: string
  ) {
    super(message || `Permission denied: cannot ${action} ${resource}`);
    this.name = 'PermissionDeniedError';
  }
}

export function assertPermission(user: SessionUser, resource: Resource, action: Action): void {
  if (!hasPermission(user, resource, action)) {
    throw new PermissionDeniedError(resource, action);
  }
}
