import { describe, it, expect, beforeAll, vi } from 'vitest';
import { seedTestData } from '../setup';
import { POST as createService, GET as listServices } from '@/app/api/services/route';
import { GET as getServiceDetail, PATCH as updateServiceDetail, DELETE as deleteServiceDetail } from '@/app/api/services/[id]/route';
import { POST as createCI, GET as listCIs } from '@/app/api/cis/route';
import { GET as getCIDetail, PATCH as updateCIDetail, DELETE as deleteCIDetail } from '@/app/api/cis/[id]/route';
import { generateAccessToken } from '@/lib/auth';
import getDb from '@/lib/db';

let userId, viewerId, teamId;
let adminToken, viewerToken;

beforeAll(async () => {
  const data = await seedTestData();
  userId = data.userId;
  viewerId = data.viewerId;
  teamId = data.teamId;

  adminToken = generateAccessToken({ id: userId, email: 'admin@test.local', displayName: 'Test Admin' });
  viewerToken = generateAccessToken({ id: viewerId, email: 'viewer@test.local', displayName: 'Test Viewer' });
});

async function makeRequest(token, body = null, url = 'http://localhost') {
  return {
    url,
    headers: {
      get: vi.fn((name) => {
        const lowerName = name.toLowerCase();
        if (lowerName === 'authorization') return `Bearer ${token}`;
        return null;
      }),
    },
    cookies: {
      get: vi.fn(() => token ? { value: token } : undefined),
    },
    json: async () => body,
  };
}

describe('Services API Route Integration', () => {
  let createdServiceId;

  it('rejects service creation for viewer (RBAC)', async () => {
    const body = {
      name: 'Viewer Blocked Service',
      type: 'business',
      lifecycleStatus: 'active',
      environment: 'production',
      typeFields: {
        businessCriticality: 'high',
        businessOwner: 'Alice',
        serviceTier: 'tier-1',
      },
    };
    const req = await makeRequest(viewerToken, body);
    const res = await createService(req);
    expect(res.status).toBe(403);
    const resBody = await res.json();
    expect(resBody.error).toContain('Insufficient permissions');
  });

  it('allows service creation for admin', async () => {
    const body = {
      name: 'Admin Allowed Service',
      type: 'business',
      lifecycleStatus: 'active',
      environment: 'production',
      typeFields: {
        businessCriticality: 'high',
        businessOwner: 'Alice',
        serviceTier: 'tier-1',
      },
    };
    const req = await makeRequest(adminToken, body);
    const res = await createService(req);
    expect(res.status).toBe(201);
    const resBody = await res.json();
    expect(resBody.name).toBe('Admin Allowed Service');
    expect(resBody.id).toBeDefined();
    createdServiceId = resBody.id;
  });

  it('lists services', async () => {
    const req = await makeRequest(adminToken, null, 'http://localhost/api/services?limit=10');
    const res = await listServices(req);
    expect(res.status).toBe(200);
    const resBody = await res.json();
    expect(resBody.data).toBeDefined();
    expect(resBody.data.length).toBeGreaterThan(0);
  });

  it('fetches service details', async () => {
    const req = await makeRequest(adminToken);
    const res = await getServiceDetail(req, { params: Promise.resolve({ id: createdServiceId }) });
    expect(res.status).toBe(200);
    const resBody = await res.json();
    expect(resBody.id).toBe(createdServiceId);
    expect(resBody.name).toBe('Admin Allowed Service');
  });

  it('supports foreign-key null transitions on update', async () => {
    // 1. First assign a valid team
    const reqAssign = await makeRequest(adminToken, { ownerTeamId: teamId });
    const resAssign = await updateServiceDetail(reqAssign, { params: Promise.resolve({ id: createdServiceId }) });
    expect(resAssign.status).toBe(200);
    const resAssignBody = await resAssign.json();
    expect(resAssignBody.ownerTeamId).toBe(teamId);

    // 2. Clear ownerTeamId using empty string (foreign-key null transition)
    const reqClear = await makeRequest(adminToken, { ownerTeamId: '' });
    const resClear = await updateServiceDetail(reqClear, { params: Promise.resolve({ id: createdServiceId }) });
    expect(resClear.status).toBe(200);
    const resClearBody = await resClear.json();
    expect(resClearBody.ownerTeamId).toBeNull();
  });

  it('deletes service successfully', async () => {
    const req = await makeRequest(adminToken);
    const res = await deleteServiceDetail(req, { params: Promise.resolve({ id: createdServiceId }) });
    expect(res.status).toBe(200);

    // Verify it is deleted
    const checkReq = await makeRequest(adminToken);
    const checkRes = await getServiceDetail(checkReq, { params: Promise.resolve({ id: createdServiceId }) });
    expect(checkRes.status).toBe(404);
  });
});

describe('CIs API Route Integration', () => {
  let createdCIId;

  it('rejects CI creation for viewer (RBAC)', async () => {
    const body = {
      name: 'Viewer Blocked CI',
      ciType: 'server',
      lifecycleStatus: 'active',
      environment: 'production',
    };
    const req = await makeRequest(viewerToken, body);
    const res = await createCI(req);
    expect(res.status).toBe(403);
  });

  it('allows CI creation for admin', async () => {
    const body = {
      name: 'Admin Allowed CI',
      ciType: 'server',
      lifecycleStatus: 'active',
      environment: 'production',
    };
    const req = await makeRequest(adminToken, body);
    const res = await createCI(req);
    expect(res.status).toBe(201);
    const resBody = await res.json();
    expect(resBody.name).toBe('Admin Allowed CI');
    expect(resBody.id).toBeDefined();
    createdCIId = resBody.id;
  });

  it('lists CIs', async () => {
    const req = await makeRequest(adminToken, null, 'http://localhost/api/cis?limit=10');
    const res = await listCIs(req);
    expect(res.status).toBe(200);
    const resBody = await res.json();
    expect(resBody.data).toBeDefined();
    expect(resBody.data.length).toBeGreaterThan(0);
  });

  it('fetches CI details', async () => {
    const req = await makeRequest(adminToken);
    const res = await getCIDetail(req, { params: Promise.resolve({ id: createdCIId }) });
    expect(res.status).toBe(200);
    const resBody = await res.json();
    expect(resBody.id).toBe(createdCIId);
    expect(resBody.name).toBe('Admin Allowed CI');
  });

  it('supports foreign-key null transitions on update', async () => {
    // 1. Assign valid team
    const reqAssign = await makeRequest(adminToken, { ownerTeamId: teamId });
    const resAssign = await updateCIDetail(reqAssign, { params: Promise.resolve({ id: createdCIId }) });
    expect(resAssign.status).toBe(200);
    const resAssignBody = await resAssign.json();
    expect(resAssignBody.ownerTeamId).toBe(teamId);

    // 2. Clear ownerTeamId using empty string
    const reqClear = await makeRequest(adminToken, { ownerTeamId: '' });
    const resClear = await updateCIDetail(reqClear, { params: Promise.resolve({ id: createdCIId }) });
    expect(resClear.status).toBe(200);
    const resClearBody = await resClear.json();
    expect(resClearBody.ownerTeamId).toBeNull();
  });

  it('deletes CI successfully', async () => {
    const req = await makeRequest(adminToken);
    const res = await deleteCIDetail(req, { params: Promise.resolve({ id: createdCIId }) });
    expect(res.status).toBe(200);

    // Verify it is deleted
    const checkReq = await makeRequest(adminToken);
    const checkRes = await getCIDetail(checkReq, { params: Promise.resolve({ id: createdCIId }) });
    expect(checkRes.status).toBe(404);
  });
});
