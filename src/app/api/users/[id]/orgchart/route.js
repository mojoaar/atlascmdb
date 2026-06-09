import getDb from '../../../../../lib/db';
import { requireAdmin } from '../../../../../lib/rbac';
import { handleApiError, notFound, success, guardResponse } from '../../../../../lib/api-helpers';

export async function GET(request, { params }) {
  try {
    const auth = await requireAdmin()(request);
    if (!auth.authorized) return guardResponse(auth);

    const { id: centerId } = await params;
    const db = getDb();

    // Verify center user exists
    const centerUser = await db('users').where({ id: centerId }).first();
    if (!centerUser) return notFound('User');

    const nodesMap = new Map();
    const edges = [];

    // Helper to add user to nodes map
    const addUserNode = (user, level, isCenter = false) => {
      if (!nodesMap.has(user.id)) {
        nodesMap.set(user.id, {
          id: user.id,
          name: user.displayName || user.email,
          email: user.email,
          level,
          isCenter,
        });
      }
    };

    // Add center user (level 0)
    addUserNode(centerUser, 0, true);

    // 1. Walk UP the manager chain (up to 3 levels)
    let currentManagerId = centerUser.managerId;
    let currentUserId = centerUser.id;
    let upLevel = -1;

    while (currentManagerId && upLevel >= -3) {
      const manager = await db('users').where({ id: currentManagerId }).first();
      if (!manager) break;

      addUserNode(manager, upLevel);
      edges.push({
        source: manager.id,
        target: currentUserId,
        type: 'reports_to',
      });

      currentUserId = manager.id;
      currentManagerId = manager.managerId;
      upLevel--;
    }

    // 2. Walk DOWN the direct reports chain (up to 3 levels)
    // Level 1: Direct reports of the center user
    const level1Reports = await db('users')
      .where({ managerId: centerId })
      .whereNot({ id: centerId }); // Prevent self-referencing cycles

    for (const report of level1Reports) {
      addUserNode(report, 1);
      edges.push({
        source: centerId,
        target: report.id,
        type: 'reports_to',
      });
    }

    // Level 2: Reports of level 1 reports
    if (level1Reports.length > 0) {
      const level1Ids = level1Reports.map(r => r.id);
      const level2Reports = await db('users')
        .whereIn('managerId', level1Ids)
        .whereNotIn('id', [centerId, ...level1Ids]);

      for (const report of level2Reports) {
        addUserNode(report, 2);
        edges.push({
          source: report.managerId,
          target: report.id,
          type: 'reports_to',
        });
      }

      // Level 3: Reports of level 2 reports
      if (level2Reports.length > 0) {
        const level2Ids = level2Reports.map(r => r.id);
        const level3Reports = await db('users')
          .whereIn('managerId', level2Ids)
          .whereNotIn('id', [centerId, ...level1Ids, ...level2Ids]);

        for (const report of level3Reports) {
          addUserNode(report, 3);
          edges.push({
            source: report.managerId,
            target: report.id,
            type: 'reports_to',
          });
        }
      }
    }

    return success({
      nodes: Array.from(nodesMap.values()),
      edges,
    });
  } catch (error) {
    return handleApiError(error, 'Failed to fetch organisation chart');
  }
}
