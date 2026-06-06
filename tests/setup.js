import { beforeAll, afterAll } from 'vitest';
import fs from 'fs';
import path from 'path';

const TEST_DB_PATH = path.join(process.cwd(), 'data', 'test.db');

function deleteDbFiles(dbPath) {
  const files = [dbPath, `${dbPath}-wal`, `${dbPath}-shm`];
  for (const file of files) {
    if (fs.existsSync(file)) {
      try {
        fs.unlinkSync(file);
      } catch (e) {}
    }
  }
}

beforeAll(async () => {
  try {
    const { resetDb } = await import('@/lib/db');
    resetDb();
  } catch (e) {}

  deleteDbFiles(TEST_DB_PATH);

  const getDb = (await import('@/lib/db')).default;
  const db = getDb();
  await db.migrate.latest();
});

afterAll(async () => {
  const getDb = (await import('@/lib/db')).default;
  const db = getDb();
  await db.destroy();

  try {
    const { resetDb } = await import('@/lib/db');
    resetDb();
  } catch (e) {}

  deleteDbFiles(TEST_DB_PATH);
});

export async function seedTestData() {
  const getDb = (await import('@/lib/db')).default;
  const db = getDb();
  const bcrypt = require('bcryptjs');
  const { v4: uuidv4 } = require('uuid');

  const adminRoleId = uuidv4();
  const editorRoleId = uuidv4();
  const viewerRoleId = uuidv4();

  await db('roles').insert([
    { id: adminRoleId, name: 'admin', description: 'Full access' },
    { id: editorRoleId, name: 'editor', description: 'Edit access' },
    { id: viewerRoleId, name: 'viewer', description: 'Read-only' },
  ]);

  const passwordHash = await bcrypt.hash('password123', 4);
  const userId = uuidv4();
  const viewerId = uuidv4();
  const editorId = uuidv4();

  await db('users').insert([
    { id: userId, email: 'admin@test.local', displayName: 'Test Admin', passwordHash, status: 'active' },
    { id: viewerId, email: 'viewer@test.local', displayName: 'Test Viewer', passwordHash, status: 'active' },
    { id: editorId, email: 'editor@test.local', displayName: 'Test Editor', passwordHash, status: 'active' },
  ]);

  await db('user_roles').insert([
    { userId, roleId: adminRoleId },
    { userId: viewerId, roleId: viewerRoleId },
    { userId: editorId, roleId: editorRoleId },
  ]);

  const teamId = uuidv4();
  await db('teams').insert({ id: teamId, name: 'Test Team', type: 'functional', roleId: editorRoleId, status: 'active' });
  await db('team_members').insert({ teamId, userId: viewerId, memberRole: 'member' });

  const serviceId = uuidv4();
  await db('service_base').insert({ id: serviceId, name: 'Test Service', lifecycleStatus: 'active', environment: 'development' });

  return { userId, viewerId, editorId, adminRoleId, editorRoleId, viewerRoleId, teamId, serviceId, passwordHash };
}
