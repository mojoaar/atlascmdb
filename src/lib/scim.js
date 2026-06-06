import crypto from 'crypto';
import getDb from './db';

export async function verifyScimToken(request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }
  const token = authHeader.slice(7);
  if (!token) {
    return false;
  }
  const db = getDb();
  const config = await db('app_config').where({ key: 'scim_bearer_token' }).first();
  if (!config || !config.value || config.value.length !== 64) {
    return false;
  }

  const storedBuffer = Buffer.from(config.value, 'hex');
  const inputBuffer = crypto.createHash('sha256').update(token).digest();

  return crypto.timingSafeEqual(storedBuffer, inputBuffer);
}

export async function isScimEnabled() {
  const db = getDb();
  const config = await db('app_config').where({ key: 'scim_enabled' }).first();
  return config?.value === 'true';
}
