export type RoleName = 'CISO' | 'ADMIN' | 'ANALYST' | 'VIEWER';

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: RoleName;
  permissions: string[];
}

export interface AuthSession {
  user: SessionUser;
  expires: string;
}

export type Resource =
  | 'policy'
  | 'risk'
  | 'framework'
  | 'objective'
  | 'finding'
  | 'exception'
  | 'user'
  | 'audit';

export type Action = 'create' | 'read' | 'update' | 'delete';

export type Permission = `${Resource}:${Action}`;

export const ROLE_HIERARCHY: Record<RoleName, number> = {
  CISO: 100,
  ADMIN: 80,
  ANALYST: 60,
  VIEWER: 20,
};

export const DEFAULT_ROLE_PERMISSIONS: Record<RoleName, Permission[]> = {
  CISO: [
    'policy:create', 'policy:read', 'policy:update', 'policy:delete',
    'risk:create', 'risk:read', 'risk:update', 'risk:delete',
    'framework:create', 'framework:read', 'framework:update', 'framework:delete',
    'objective:create', 'objective:read', 'objective:update', 'objective:delete',
    'finding:create', 'finding:read', 'finding:update', 'finding:delete',
    'exception:create', 'exception:read', 'exception:update', 'exception:delete',
    'user:create', 'user:read', 'user:update', 'user:delete',
    'audit:create', 'audit:read', 'audit:update', 'audit:delete',
  ],
  ADMIN: [
    'policy:create', 'policy:read', 'policy:update', 'policy:delete',
    'risk:create', 'risk:read', 'risk:update', 'risk:delete',
    'framework:create', 'framework:read', 'framework:update', 'framework:delete',
    'objective:create', 'objective:read', 'objective:update', 'objective:delete',
    'finding:create', 'finding:read', 'finding:update', 'finding:delete',
    'exception:create', 'exception:read', 'exception:update', 'exception:delete',
    'user:create', 'user:read', 'user:update', 'user:delete',
    'audit:create', 'audit:read', 'audit:update', 'audit:delete',
  ],
  ANALYST: [
    'policy:create', 'policy:read', 'policy:update',
    'risk:create', 'risk:read', 'risk:update',
    'framework:read',
    'objective:create', 'objective:read', 'objective:update',
    'finding:create', 'finding:read', 'finding:update',
    'exception:create', 'exception:read', 'exception:update',
    'user:read',
    'audit:read',
  ],
  VIEWER: [
    'policy:read',
    'risk:read',
    'framework:read',
    'objective:read',
    'finding:read',
    'exception:read',
    'user:read',
    'audit:read',
  ],
};
