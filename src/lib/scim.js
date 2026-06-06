import getDb from './db';

export async function verifyScimToken(request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }
  const token = authHeader.slice(7);
  const db = getDb();
  const config = await db('app_config').where({ key: 'scim_bearer_token' }).first();
  return config && config.value === token && config.value.length > 0;
}

export async function isScimEnabled() {
  const db = getDb();
  const config = await db('app_config').where({ key: 'scim_enabled' }).first();
  return config?.value === 'true';
}
