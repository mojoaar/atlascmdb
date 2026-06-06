import { describe, it, expect, beforeAll, vi } from 'vitest';
import { seedTestData } from '../setup';
import { v4 as uuidv4 } from 'uuid';

describe('Notification Preferences and Dismissal', () => {
  let userId, viewerId, teamId;

  beforeAll(async () => {
    const data = await seedTestData();
    userId = data.userId;
    viewerId = data.viewerId;
    teamId = data.teamId;
  });

  async function makeRequest(token) {
    return {
      headers: {
        get: vi.fn((name) => name === 'authorization' ? `Bearer ${token}` : null),
      },
      cookies: {
        get: vi.fn(() => token ? { value: token } : undefined),
      },
    };
  }

  it('sends notifications when no preferences are defined', async () => {
    const getDb = (await import('@/lib/db')).default;
    const db = getDb();
    const { logAudit } = await import('@/lib/audit');

    // Create a new CI owned by the team
    const ciId = uuidv4();
    await db('ci_base').insert({
      id: ciId,
      name: 'CI Without Preferences',
      ownerTeamId: teamId,
      lifecycleStatus: 'active',
    });

    // Clear any previous notifications
    await db('notifications').del();

    // Trigger logAudit (user is creator, viewer is a team member so they should get a notification)
    await logAudit({
      actorUserId: userId,
      entityType: 'ci',
      entityId: ciId,
      action: 'created',
      afterData: { name: 'CI Without Preferences' },
    });

    // Check notifications for viewerId
    const notifs = await db('notifications').where({ userId: viewerId });
    expect(notifs.length).toBe(1);
    expect(notifs[0].title).toContain('CI Without Preferences was created');
  });

  it('does not send notification if user has opted out of created events', async () => {
    const getDb = (await import('@/lib/db')).default;
    const db = getDb();
    const { logAudit } = await import('@/lib/audit');

    // Insert a theme to satisfy foreign key constraint
    const themeId = uuidv4();
    await db('themes').insert({
      id: themeId,
      name: 'Test Theme',
    });

    // Opt out of created notifications
    await db('user_theme_preferences').insert({
      id: uuidv4(),
      userId: viewerId,
      themeId,
      notifOnCreate: false,
      notifOnUpdate: true,
      notifOnDelete: true,
    });

    const ciId = uuidv4();
    await db('ci_base').insert({
      id: ciId,
      name: 'CI Opted Out',
      ownerTeamId: teamId,
      lifecycleStatus: 'active',
    });

    // Clear notifications
    await db('notifications').del();

    // Trigger logAudit for created CI
    await logAudit({
      actorUserId: userId,
      entityType: 'ci',
      entityId: ciId,
      action: 'created',
      afterData: { name: 'CI Opted Out' },
    });

    // Check notifications for viewerId (should be 0 because of preference opt-out)
    const notifsCreated = await db('notifications').where({ userId: viewerId });
    expect(notifsCreated.length).toBe(0);

    // Trigger logAudit for updated CI (should still notify because notifOnUpdate is true)
    await logAudit({
      actorUserId: userId,
      entityType: 'ci',
      entityId: ciId,
      action: 'updated',
      afterData: { name: 'CI Opted Out v2' },
    });

    const notifsUpdated = await db('notifications').where({ userId: viewerId });
    expect(notifsUpdated.length).toBe(1);
    expect(notifsUpdated[0].title).toContain('CI Opted Out was updated');

    // Clean up preferences row
    await db('user_theme_preferences').where({ userId: viewerId }).del();
  });

  it('deletes notification via DELETE api handler', async () => {
    const getDb = (await import('@/lib/db')).default;
    const db = getDb();
    const { DELETE } = await import('@/app/api/notifications/[id]/route');
    const { generateAccessToken } = await import('@/lib/auth');

    const notifId = uuidv4();
    await db('notifications').insert({
      id: notifId,
      userId: viewerId,
      type: 'info',
      title: 'Deletable Notification',
      body: 'Body',
      read: false,
    });

    // Generate viewer token
    const token = generateAccessToken({ id: viewerId, email: 'viewer@test.local', displayName: 'Test Viewer' });
    const request = await makeRequest(token);

    // Run DELETE handler
    const response = await DELETE(request, { params: Promise.resolve({ id: notifId }) });
    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json.deleted).toBe(true);

    // Check DB
    const count = await db('notifications').where({ id: notifId }).first();
    expect(count).toBeUndefined();
  });
});
