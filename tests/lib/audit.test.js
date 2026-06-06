import { describe, it, expect, beforeAll } from 'vitest';
import { seedTestData } from '../setup';

describe('logAudit', () => {
  let userId;

  beforeAll(async () => {
    const data = await seedTestData();
    userId = data.userId;
  });

  it('inserts an audit event row', async () => {
    const { logAudit } = await import('@/lib/audit');
    const getDb = (await import('@/lib/db')).default;
    const db = getDb();

    await logAudit({
      actorUserId: userId,
      entityType: 'service',
      entityId: 'svc-1',
      action: 'created',
      afterData: { name: 'Test Svc' },
    });

    const events = await db('audit_events').where({ entityType: 'service' });
    expect(events.length).toBe(1);
    expect(events[0].action).toBe('created');
    expect(events[0].actorUserId).toBe(userId);
    expect(typeof events[0].afterData === 'string' ? JSON.parse(events[0].afterData) : events[0].afterData).toEqual({ name: 'Test Svc' });
  });

  it('handles before/after data snapshots', async () => {
    const { logAudit } = await import('@/lib/audit');
    const getDb = (await import('@/lib/db')).default;
    const db = getDb();

    await logAudit({
      actorUserId: userId,
      entityType: 'application',
      entityId: 'app-1',
      action: 'updated',
      beforeData: { name: 'Old Name' },
      afterData: { name: 'New Name' },
    });

    const events = await db('audit_events').where({ entityType: 'application' });
    expect(events.length).toBe(1);
    const before = typeof events[0].beforeData === 'string' ? JSON.parse(events[0].beforeData) : events[0].beforeData;
    const after = typeof events[0].afterData === 'string' ? JSON.parse(events[0].afterData) : events[0].afterData;
    expect(before).toEqual({ name: 'Old Name' });
    expect(after).toEqual({ name: 'New Name' });
  });
});
