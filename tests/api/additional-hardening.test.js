import { describe, it, expect, beforeAll, vi } from 'vitest';
import crypto from 'crypto';
import { seedTestData } from '../setup';
import getDb from '@/lib/db';
import { generateAccessToken } from '@/lib/auth';

// Route imports
import { GET as getDemoStatus } from '@/app/api/admin/demo-status/route';
import { POST as resetDemo } from '@/app/api/admin/reset-demo/route';
import { POST as createLocation } from '@/app/api/locations/route';
import { PATCH as updateLocation } from '@/app/api/locations/[id]/route';

// SCIM Route imports
import { GET as listScimUsers, POST as createScimUser } from '@/app/api/scim/v2/Users/route';
import { GET as getScimUser, PUT as putScimUser, PATCH as patchScimUser, DELETE as deleteScimUser } from '@/app/api/scim/v2/Users/[id]/route';

let userId, viewerId, adminToken, viewerToken;
const SCIM_TOKEN = 'test-scim-token-999';

beforeAll(async () => {
  const data = await seedTestData();
  userId = data.userId;
  viewerId = data.viewerId;
  adminToken = generateAccessToken({ id: userId, email: 'admin@test.local', displayName: 'Test Admin' });
  viewerToken = generateAccessToken({ id: viewerId, email: 'viewer@test.local', displayName: 'Test Viewer' });

  const db = getDb();
  await db('app_config').whereIn('key', ['scim_enabled', 'scim_bearer_token']).del();
  // Enable SCIM in DB
  const hashedScim = crypto.createHash('sha256').update(SCIM_TOKEN).digest('hex');
  await db('app_config').insert([
    { key: 'scim_enabled', value: 'true' },
    { key: 'scim_bearer_token', value: hashedScim }
  ]);
});

async function makeRequest(token, body = null, url = 'http://localhost') {
  return {
    url,
    headers: {
      get: vi.fn((name) => {
        const lower = name.toLowerCase();
        if (lower === 'authorization') return token ? `Bearer ${token}` : null;
        return null;
      }),
    },
    cookies: {
      get: vi.fn(() => token ? { value: token } : undefined),
    },
    json: async () => body,
  };
}

async function makeScimRequest(token, body = null, url = 'http://localhost') {
  return {
    url,
    headers: {
      get: vi.fn((name) => {
        const lower = name.toLowerCase();
        if (lower === 'authorization') return token ? `Bearer ${token}` : null;
        return null;
      }),
    },
    json: async () => body,
  };
}

describe('Additional Hardening Integration Tests', () => {
  describe('Locations Parent Location Coercion', () => {
    it('coerces empty string parentLocationId to null during POST', async () => {
      const body = {
        name: 'Coerced Location',
        type: 'office',
        parentLocationId: '',
        status: 'active'
      };
      const req = await makeRequest(adminToken, body);
      const res = await createLocation(req);
      expect(res.status).toBe(201);
      
      const resBody = await res.json();

      const db = getDb();
      const dbLoc = await db('locations').where({ id: resBody.id }).first();
      expect(dbLoc.parentLocationId).toBeNull();
    });

    it('coerces empty string parentLocationId to null during PATCH', async () => {
      const db = getDb();
      // Insert a test location with a parent location ID first
      const parentId = crypto.randomUUID();
      const childId = crypto.randomUUID();
      await db('locations').insert([
        { id: parentId, name: 'Parent Loc', type: 'office', status: 'active' },
        { id: childId, name: 'Child Loc', type: 'office', parentLocationId: parentId, status: 'active' }
      ]);

      const body = {
        parentLocationId: ''
      };
      const req = await makeRequest(adminToken, body);
      const res = await updateLocation(req, { params: Promise.resolve({ id: childId }) });
      expect(res.status).toBe(200);

      const resBody = await res.json();
      expect(resBody.parentLocationId).toBeNull();

      const dbChild = await db('locations').where({ id: childId }).first();
      expect(dbChild.parentLocationId).toBeNull();
    });
  });

  describe('SCIM v2 Users Writes', () => {
    let scimUserId;

    it('provisions a new SCIM user (POST)', async () => {
      const body = {
        userName: 'scim-user@test.local',
        displayName: 'SCIM User One',
        active: true,
        emails: [{ value: 'scim-user@test.local', primary: true }]
      };
      const req = await makeScimRequest(SCIM_TOKEN, body);
      const res = await createScimUser(req);
      expect(res.status).toBe(201);

      const resBody = await res.json();
      expect(resBody.userName).toBe('scim-user@test.local');
      expect(resBody.id).toBeDefined();
      scimUserId = resBody.id;

      // Verify user in database
      const db = getDb();
      const user = await db('users').where({ id: scimUserId }).first();
      expect(user).toBeDefined();
      expect(user.displayName).toBe('SCIM User One');
      expect(user.status).toBe('active');
    });

    it('updates user attributes via PUT', async () => {
      const body = {
        userName: 'scim-user-updated@test.local',
        displayName: 'SCIM User Updated',
        active: false
      };
      const req = await makeScimRequest(SCIM_TOKEN, body);
      const res = await putScimUser(req, { params: Promise.resolve({ id: scimUserId }) });
      expect(res.status).toBe(200);

      const resBody = await res.json();
      expect(resBody.userName).toBe('scim-user-updated@test.local');
      expect(resBody.displayName).toBe('SCIM User Updated');
      expect(resBody.active).toBe(false);

      const db = getDb();
      const user = await db('users').where({ id: scimUserId }).first();
      expect(user.email).toBe('scim-user-updated@test.local');
      expect(user.status).toBe('inactive');
    });

    it('updates user status via PATCH', async () => {
      const body = {
        Operations: [
          { op: 'replace', path: 'active', value: true },
          { op: 'replace', path: 'displayName', value: 'SCIM Patched' }
        ]
      };
      const req = await makeScimRequest(SCIM_TOKEN, body);
      const res = await patchScimUser(req, { params: Promise.resolve({ id: scimUserId }) });
      expect(res.status).toBe(200);

      const resBody = await res.json();
      expect(resBody.active).toBe(true);
      expect(resBody.displayName).toBe('SCIM Patched');

      const db = getDb();
      const user = await db('users').where({ id: scimUserId }).first();
      expect(user.status).toBe('active');
      expect(user.displayName).toBe('SCIM Patched');
    });

    it('deactivates user via DELETE', async () => {
      const req = await makeScimRequest(SCIM_TOKEN);
      const res = await deleteScimUser(req, { params: Promise.resolve({ id: scimUserId }) });
      expect(res.status).toBe(204);

      const db = getDb();
      const user = await db('users').where({ id: scimUserId }).first();
      expect(user.status).toBe('inactive');
    });
  });

  describe('Demo Status and Reset Demo Admin Routes', () => {
    it('returns demo status as seeded or not', async () => {
      const req = await makeRequest(adminToken);
      const res = await getDemoStatus(req);
      expect(res.status).toBe(200);
      const resBody = await res.json();
      expect(resBody.isDemoSeeded).toBeDefined();
    });

    it('rejects demo status for standard viewers', async () => {
      const req = await makeRequest(viewerToken);
      const res = await getDemoStatus(req);
      expect(res.status).toBe(403);
    });

    it('rejects reset demo requests for standard viewers', async () => {
      const req = await makeRequest(viewerToken);
      const res = await resetDemo(req);
      expect(res.status).toBe(403);
    });

    it('resets demo database successfully when Alice exists', async () => {
      const db = getDb();
      // Insert Alice Admin user to satisfy reset requirements
      const aliceId = crypto.randomUUID();
      await db('users').insert({
        id: aliceId,
        email: 'alice@atlas.local',
        displayName: 'Alice Admin',
        passwordHash: '',
        status: 'active'
      });

      const req = await makeRequest(adminToken);
      const res = await resetDemo(req);
      expect(res.status).toBe(200);

      const resBody = await res.json();
      expect(resBody.success).toBe(true);
      expect(resBody.message).toContain('Alice Admin');

      // Verify only Alice Admin user remains in database
      const remainingUsers = await db('users');
      expect(remainingUsers.length).toBe(1);
      expect(remainingUsers[0].email).toBe('alice@atlas.local');
    });
  });
});
