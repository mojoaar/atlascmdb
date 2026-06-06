import { describe, it, expect, beforeAll, vi } from 'vitest';
import { seedTestData } from '../setup';

let userId, viewerId;

beforeAll(async () => {
  const data = await seedTestData();
  userId = data.userId;
  viewerId = data.viewerId;
});

async function makeRequest(token) {
  return {
    headers: {
      get: vi.fn((name) => name === 'authorization' ? `Bearer ${token}` : null),
    },
    cookies: {
      get: vi.fn(() => token ? { value: token } : undefined),
    },
  };
}

describe('requireAuth', () => {
  it('authorizes valid admin user', async () => {
    const { requireAuth } = await import('@/lib/rbac');
    const { generateAccessToken } = await import('@/lib/auth');
    const token = generateAccessToken({ id: userId, email: 'admin@test.local', displayName: 'Test Admin' });
    const request = await makeRequest(token);
    const auth = await requireAuth()(request);
    expect(auth.authorized).toBe(true);
    expect(auth.user.id).toBe(userId);
    expect(auth.effectiveRole).toBe('admin');
  });

  it('rejects unauthenticated request', async () => {
    const { requireAuth } = await import('@/lib/rbac');
    const request = { headers: { get: vi.fn(() => null) }, cookies: { get: vi.fn(() => undefined) } };
    const auth = await requireAuth()(request);
    expect(auth.authorized).toBe(false);
    expect(auth.status).toBe(401);
  });
});

describe('requireAdmin', () => {
  it('allows admin user', async () => {
    const { requireAdmin } = await import('@/lib/rbac');
    const { generateAccessToken } = await import('@/lib/auth');
    const token = generateAccessToken({ id: userId, email: 'admin@test.local', displayName: 'Test Admin' });
    const request = await makeRequest(token);
    const auth = await requireAdmin()(request);
    expect(auth.authorized).toBe(true);
    expect(auth.effectiveRole).toBe('admin');
  });

  it('rejects viewer user', async () => {
    const { requireAdmin } = await import('@/lib/rbac');
    const { generateAccessToken } = await import('@/lib/auth');
    const token = generateAccessToken({ id: viewerId, email: 'viewer@test.local', displayName: 'Test Viewer' });
    const request = await makeRequest(token);
    const auth = await requireAdmin()(request);
    expect(auth.authorized).toBe(false);
    expect(auth.status).toBe(403);
  });
});

describe('requireEditor', () => {
  it('allows admin user (admin > editor)', async () => {
    const { requireEditor } = await import('@/lib/rbac');
    const { generateAccessToken } = await import('@/lib/auth');
    const token = generateAccessToken({ id: userId, email: 'admin@test.local', displayName: 'Test Admin' });
    const request = await makeRequest(token);
    const auth = await requireEditor()(request);
    expect(auth.authorized).toBe(true);
  });

  it('rejects viewer user', async () => {
    const { requireEditor } = await import('@/lib/rbac');
    const { generateAccessToken } = await import('@/lib/auth');
    const token = generateAccessToken({ id: viewerId, email: 'viewer@test.local', displayName: 'Test Viewer' });
    const request = await makeRequest(token);
    const auth = await requireEditor()(request);
    expect(auth.authorized).toBe(false);
  });
});

describe('requireRole', () => {
  it('allows matching role', async () => {
    const { requireRole } = await import('@/lib/rbac');
    const { generateAccessToken } = await import('@/lib/auth');
    const token = generateAccessToken({ id: userId, email: 'admin@test.local', displayName: 'Test Admin' });
    const request = await makeRequest(token);
    const auth = await requireRole('admin')(request);
    expect(auth.authorized).toBe(true);
  });

  it('rejects non-matching role', async () => {
    const { requireRole } = await import('@/lib/rbac');
    const { generateAccessToken } = await import('@/lib/auth');
    const token = generateAccessToken({ id: viewerId, email: 'viewer@test.local', displayName: 'Test Viewer' });
    const request = await makeRequest(token);
    const auth = await requireRole('admin')(request);
    expect(auth.authorized).toBe(false);
  });

  it('allows any of multiple matching roles', async () => {
    const { requireRole } = await import('@/lib/rbac');
    const { generateAccessToken } = await import('@/lib/auth');
    const token = generateAccessToken({ id: viewerId, email: 'viewer@test.local', displayName: 'Test Viewer' });
    const request = await makeRequest(token);
    const auth = await requireRole('admin', 'editor', 'viewer')(request);
    expect(auth.authorized).toBe(true);
  });
});
