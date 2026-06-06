import { extractUserFromRequest, getEffectiveRole } from './auth';

const ROLE_HIERARCHY = { admin: 3, editor: 2, viewer: 1 };

export function requireRole(...allowedRoles) {
  return async function (request) {
    const user = await extractUserFromRequest(request);
    if (!user) {
      return { authorized: false, status: 401, body: { error: 'Authentication required' } };
    }

    const effectiveRole = getEffectiveRole(user.roles);

    if (!effectiveRole || !allowedRoles.includes(effectiveRole)) {
      return { authorized: false, status: 403, body: { error: 'Insufficient permissions' } };
    }

    return { authorized: true, user, effectiveRole };
  };
}

export function requireAuth() {
  return requireRole('viewer', 'editor', 'admin');
}

export function requireAdmin() {
  return requireRole('admin');
}

export function requireEditor() {
  return requireRole('editor', 'admin');
}

export function hasRole(role, required) {
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY[required];
}
