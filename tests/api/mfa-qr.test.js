import { describe, it, expect, beforeAll, vi } from 'vitest';
import { seedTestData } from '../setup';
import { POST as setupMfa } from '@/app/api/auth/mfa/setup/route';
import { generateAccessToken } from '@/lib/auth';

let userId, adminToken;

beforeAll(async () => {
  const data = await seedTestData();
  userId = data.userId;
  adminToken = generateAccessToken({ id: userId, email: 'admin@test.local', displayName: 'Test Admin' });
});

async function makeRequest(token, body = null) {
  return {
    headers: {
      get: vi.fn((name) => {
        if (name.toLowerCase() === 'authorization') return `Bearer ${token}`;
        return null;
      }),
    },
    cookies: {
      get: vi.fn(() => token ? { value: token } : undefined),
    },
    json: async () => body,
  };
}

describe('MFA Setup QR Code Integration', () => {
  it('returns qrCode starting with data:image/png;base64 for mfa setup POST', async () => {
    const req = await makeRequest(adminToken);
    const res = await setupMfa(req);
    expect(res.status).toBe(200);
    const resBody = await res.json();
    expect(resBody.qrCode).toBeDefined();
    expect(resBody.qrCode).toMatch(/^data:image\/png;base64,/);
    expect(resBody.secret).toBeDefined();
    expect(resBody.otpauthUrl).toBeDefined();
  });
});
