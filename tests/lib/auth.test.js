import { describe, it, expect, beforeAll } from 'vitest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { hashPassword, verifyPassword, generateAccessToken, generateMfaToken, verifyAccessToken, generateRefreshToken, rotateRefreshToken, generateMfaSecret, verifyMfaToken, getEffectiveRole, setTokens, clearTokens } from '@/lib/auth';
import { seedTestData } from '../setup';

let testUserId;

beforeAll(async () => {
  const data = await seedTestData();
  testUserId = data.userId;
});

describe('hashPassword / verifyPassword', () => {
  it('hashes and verifies a password', async () => {
    const hash = await hashPassword('mypassword');
    expect(hash).toMatch(/^\$2[ab]\$/);
    const valid = await verifyPassword('mypassword', hash);
    expect(valid).toBe(true);
  });

  it('rejects wrong password', async () => {
    const hash = await hashPassword('mypassword');
    const valid = await verifyPassword('wrongpassword', hash);
    expect(valid).toBe(false);
  });
});

describe('JWT access tokens', () => {
  it('generates and verifies an access token', () => {
    const user = { id: 'user-1', email: 'a@b.com', displayName: 'Alice' };
    const token = generateAccessToken(user);
    const decoded = verifyAccessToken(token);
    expect(decoded.sub).toBe('user-1');
    expect(decoded.email).toBe('a@b.com');
    expect(decoded.displayName).toBe('Alice');
    expect(decoded.mfaPending).toBeUndefined();
  });

  it('generates and verifies an MFA pending token', () => {
    const user = { id: 'user-2', email: 'b@c.com' };
    const token = generateMfaToken(user);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'atlas-dev-secret');
    expect(decoded.mfaPending).toBe(true);
    expect(decoded.sub).toBe('user-2');
  });

  it('rejects invalid token', () => {
    expect(() => verifyAccessToken('bad-token')).toThrow();
  });

  it('expires after configured time', () => {
    const user = { id: 'user-3', email: 'c@d.com' };
    const token = jwt.sign({ sub: user.id, email: user.email }, process.env.JWT_SECRET || 'atlas-dev-secret', { expiresIn: '0s' });
    expect(() => verifyAccessToken(token)).toThrow();
  });
});

describe('refresh token lifecycle', () => {
  it('generates a refresh token with session', async () => {
    const user = { id: testUserId };
    const result = await generateRefreshToken(user);
    expect(result.token).toBeTruthy();
    expect(result.sessionId).toBeTruthy();
  });

  it('rotates a valid refresh token', async () => {
    const user = { id: testUserId };
    const { token, sessionId } = await generateRefreshToken(user);
    const result = await rotateRefreshToken(token, sessionId);
    expect(result).not.toBeNull();
    expect(result.token).toBeTruthy();
    expect(result.sessionId).toBeTruthy();
  });

  it('rejects rotation with wrong token', async () => {
    const user = { id: testUserId };
    const { sessionId } = await generateRefreshToken(user);
    const result = await rotateRefreshToken('wrong-token', sessionId);
    expect(result).toBeNull();
  });
});

describe('MFA (TOTP)', () => {
  it('generates a secret with issuer', () => {
    const secret = generateMfaSecret('user@test.com');
    expect(secret.base32).toBeTruthy();
    expect(secret.otpauth_url).toContain('Atlas');
    expect(secret.otpauth_url).toContain('user%40test.com');
  });

  it('verifies a valid TOTP code', () => {
    const secret = generateMfaSecret('user@test.com');
    const OTPAuth = require('otpauth');
    const totp = new OTPAuth.TOTP({
      secret: OTPAuth.Secret.fromBase32(secret.base32),
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
    });
    const token = totp.generate();
    const valid = verifyMfaToken(secret.base32, token);
    expect(valid).toBe(true);
  });

  it('rejects an invalid TOTP code', () => {
    const secret = generateMfaSecret('user@test.com');
    const valid = verifyMfaToken(secret.base32, '000000');
    expect(valid).toBe(false);
  });
});

describe('getEffectiveRole', () => {
  it('returns admin when admin present', () => {
    expect(getEffectiveRole(['admin', 'editor', 'viewer'])).toBe('admin');
  });

  it('returns editor when no admin', () => {
    expect(getEffectiveRole(['editor', 'viewer'])).toBe('editor');
  });

  it('returns viewer when only viewer', () => {
    expect(getEffectiveRole(['viewer'])).toBe('viewer');
  });

  it('returns null for empty roles', () => {
    expect(getEffectiveRole([])).toBeNull();
  });
});

describe('setTokens / clearTokens', () => {
  it('sets cookies on response', () => {
    const response = { cookies: { set: vi.fn() } };
    setTokens(response, 'access-token', 'refresh-token');
    expect(response.cookies.set).toHaveBeenCalledTimes(2);
    expect(response.cookies.set).toHaveBeenCalledWith('atlas_access', 'access-token', expect.any(Object));
    expect(response.cookies.set).toHaveBeenCalledWith('atlas_refresh', 'refresh-token', expect.any(Object));
  });

  it('sets the session cookie when a sessionId is provided', () => {
    const response = { cookies: { set: vi.fn() } };
    setTokens(response, 'access-token', 'refresh-token', 'session-id');
    expect(response.cookies.set).toHaveBeenCalledTimes(3);
    expect(response.cookies.set).toHaveBeenCalledWith('atlas_session', 'session-id', expect.any(Object));
  });

  it('clears cookies on response', () => {
    const response = { cookies: { set: vi.fn() } };
    clearTokens(response);
    expect(response.cookies.set).toHaveBeenCalledTimes(3);
    expect(response.cookies.set).toHaveBeenCalledWith('atlas_access', '', expect.any(Object));
    expect(response.cookies.set).toHaveBeenCalledWith('atlas_refresh', '', expect.any(Object));
    expect(response.cookies.set).toHaveBeenCalledWith('atlas_session', '', expect.any(Object));
  });
});
