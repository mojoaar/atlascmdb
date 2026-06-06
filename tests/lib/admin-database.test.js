import { describe, it, expect, beforeAll, vi } from 'vitest';
import { seedTestData } from '../setup';

let adminId, viewerId, adminToken, viewerToken;

beforeAll(async () => {
  const data = await seedTestData();
  adminId = data.userId;
  viewerId = data.viewerId;

  const { generateAccessToken } = await import('@/lib/auth');
  adminToken = generateAccessToken({ id: adminId, email: 'admin@test.local', displayName: 'Test Admin' });
  viewerToken = generateAccessToken({ id: viewerId, email: 'viewer@test.local', displayName: 'Test Viewer' });
});

async function makeRequest(token, url = 'http://localhost:3000/api/admin/database/tables') {
  return {
    url,
    headers: {
      get: vi.fn((name) => name === 'authorization' ? `Bearer ${token}` : null),
    },
    cookies: {
      get: vi.fn(() => token ? { value: token } : undefined),
    },
  };
}

describe('Database Table Explorer APIs', () => {
  describe('GET /api/admin/database/tables', () => {
    it('rejects unauthenticated user with 401', async () => {
      const { GET } = await import('@/app/api/admin/database/tables/route');
      const req = await makeRequest(null);
      const res = await GET(req);
      expect(res.status).toBe(401);
    });

    it('rejects standard viewer user with 403', async () => {
      const { GET } = await import('@/app/api/admin/database/tables/route');
      const req = await makeRequest(viewerToken);
      const res = await GET(req);
      expect(res.status).toBe(403);
    });

    it('allows admin and returns list of physical tables', async () => {
      const { GET } = await import('@/app/api/admin/database/tables/route');
      const req = await makeRequest(adminToken);
      const res = await GET(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.tables).toBeDefined();
      expect(Array.isArray(json.tables)).toBe(true);
      expect(json.tables.length).toBeGreaterThan(0);
      expect(json.tables).toContain('users');
      expect(json.tables).toContain('roles');
    });
  });

  describe('GET /api/admin/database/tables/[tableName]', () => {
    it('rejects standard viewer with 403', async () => {
      const { GET } = await import('@/app/api/admin/database/tables/[tableName]/route');
      const req = await makeRequest(viewerToken, 'http://localhost:3000/api/admin/database/tables/users');
      const res = await GET(req, { params: Promise.resolve({ tableName: 'users' }) });
      expect(res.status).toBe(403);
    });

    it('returns table schema and rows for a valid table (users)', async () => {
      const { GET } = await import('@/app/api/admin/database/tables/[tableName]/route');
      const req = await makeRequest(adminToken, 'http://localhost:3000/api/admin/database/tables/users');
      const res = await GET(req, { params: Promise.resolve({ tableName: 'users' }) });
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.tableName).toBe('users');
      expect(json.schema).toBeDefined();
      expect(json.schema.email).toBeDefined(); // users has email column
      expect(Array.isArray(json.data)).toBe(true);
      expect(json.total).toBeGreaterThan(0);
    });

    it('returns 404 for an invalid or SQL-injection-attempt table name', async () => {
      const { GET } = await import('@/app/api/admin/database/tables/[tableName]/route');
      const req = await makeRequest(adminToken, 'http://localhost:3000/api/admin/database/tables/invalid_table_name');
      const res = await GET(req, { params: Promise.resolve({ tableName: 'invalid_table_name' }) });
      expect(res.status).toBe(404);
    });
  });
});
