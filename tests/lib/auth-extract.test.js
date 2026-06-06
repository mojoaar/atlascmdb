import { describe, it, expect, beforeAll, vi } from 'vitest';
import { seedTestData } from '../setup';

describe('extractUserFromRequest', () => {
  let userId, viewerId, adminRoleId, editorRoleId, viewerRoleId, teamId;

  beforeAll(async () => {
    const data = await seedTestData();
    userId = data.userId;
    viewerId = data.viewerId;
    adminRoleId = data.adminRoleId;
    editorRoleId = data.editorRoleId;
    viewerRoleId = data.viewerRoleId;
    teamId = data.teamId;
  });

  it('extracts user from Bearer token', async () => {
    const { extractUserFromRequest, generateAccessToken } = await import('@/lib/auth');
    const token = generateAccessToken({ id: userId, email: 'admin@test.local', displayName: 'Test Admin' });
    const request = {
      headers: {
        get: vi.fn((name) => name === 'authorization' ? `Bearer ${token}` : null),
      },
      cookies: {
        get: vi.fn(() => undefined),
      },
    };
    const user = await extractUserFromRequest(request);
    expect(user).not.toBeNull();
    expect(user.id).toBe(userId);
    expect(user.email).toBe('admin@test.local');
    expect(user.roles).toContain('admin');
  });

  it('extracts user from cookie', async () => {
    const { extractUserFromRequest, generateAccessToken } = await import('@/lib/auth');
    const token = generateAccessToken({ id: userId, email: 'admin@test.local', displayName: 'Test Admin' });
    const request = {
      headers: {
        get: vi.fn(() => null),
      },
      cookies: {
        get: vi.fn((name) => name === 'atlas_access' ? { value: token } : undefined),
      },
    };
    const user = await extractUserFromRequest(request);
    expect(user).not.toBeNull();
    expect(user.id).toBe(userId);
  });

  it('returns null for missing auth', async () => {
    const { extractUserFromRequest } = await import('@/lib/auth');
    const request = {
      headers: { get: vi.fn(() => null) },
      cookies: { get: vi.fn(() => undefined) },
    };
    const user = await extractUserFromRequest(request);
    expect(user).toBeNull();
  });

  it('returns null for MFA pending token', async () => {
    const { extractUserFromRequest, generateMfaToken } = await import('@/lib/auth');
    const token = generateMfaToken({ id: userId, email: 'admin@test.local' });
    const request = {
      headers: { get: vi.fn(() => `Bearer ${token}`) },
      cookies: { get: vi.fn(() => undefined) },
    };
    const user = await extractUserFromRequest(request);
    expect(user).toBeNull();
  });

  it('returns roles from direct assignments, ignoring team roles', async () => {
    const { extractUserFromRequest, generateAccessToken } = await import('@/lib/auth');
    const token = generateAccessToken({ id: viewerId, email: 'viewer@test.local', displayName: 'Test Viewer' });
    const request = {
      headers: { get: vi.fn(() => `Bearer ${token}`) },
      cookies: { get: vi.fn(() => undefined) },
    };
    const user = await extractUserFromRequest(request);
    expect(user).not.toBeNull();
    expect(user.roles).toContain('viewer');
  });

  it('returns null for inactive user', async () => {
    const { extractUserFromRequest } = await import('@/lib/auth');
    const getDb = (await import('@/lib/db')).default;
    const db = getDb();
    const { v4: uuidv4 } = require('uuid');
    const bcrypt = require('bcryptjs');
    const inactiveId = uuidv4();
    const pwHash = await bcrypt.hash('pw', 4);
    await db('users').insert({ id: inactiveId, email: 'inactive@t.local', displayName: 'Inactive', passwordHash: pwHash, status: 'disabled' });
    const token = (await import('@/lib/auth')).generateAccessToken({ id: inactiveId, email: 'inactive@t.local', displayName: 'Inactive' });
    const request = {
      headers: { get: vi.fn(() => `Bearer ${token}`) },
      cookies: { get: vi.fn(() => undefined) },
    };
    const user = await extractUserFromRequest(request);
    expect(user).toBeNull();
  });

  it('extracts impersonated user correctly', async () => {
    const { extractUserFromRequest, generateImpersonationToken } = await import('@/lib/auth');
    const getDb = (await import('@/lib/db')).default;
    const db = getDb();
    const actorUser = await db('users').where({ id: userId }).first();
    const targetUser = await db('users').where({ id: viewerId }).first();

    const token = generateImpersonationToken(actorUser, targetUser);
    const request = {
      headers: { get: vi.fn(() => `Bearer ${token}`) },
      cookies: { get: vi.fn(() => undefined) },
    };
    const user = await extractUserFromRequest(request);
    expect(user).not.toBeNull();
    expect(user.id).toBe(userId);
    expect(user.targetUserId).toBe(viewerId);
    expect(user.impersonatedBy).not.toBeNull();
    expect(user.impersonatedBy.id).toBe(userId);
  });
});
