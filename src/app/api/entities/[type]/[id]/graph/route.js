import { NextResponse } from 'next/server';
import getDb from '../../../../../../lib/db';
import { requireAuth } from '../../../../../../lib/rbac';
import { handleApiError, guardResponse } from '../../../../../../lib/api-helpers';

const VALID_TYPES = ['service', 'application', 'ci'];
const MAX_DEPTH = 6;

const TABLE_MAP = {
  service: 'service_base',
  application: 'application_base',
  ci: 'ci_base',
};

export async function GET(request, { params }) {
  try {
    const auth = await requireAuth()(request);
    if (!auth.authorized) return guardResponse(auth);

    const { type, id } = await params;
    const { searchParams } = new URL(request.url);
    const depth = Math.min(Math.max(parseInt(searchParams.get('depth') || '3'), 1), MAX_DEPTH);

    if (!VALID_TYPES.includes(type)) {
      return NextResponse.json({ error: 'Invalid entity type' }, { status: 400 });
    }

    const db = getDb();
    const table = TABLE_MAP[type];

    const center = await db(table).where({ id }).first();
    if (!center) {
      return NextResponse.json({ error: 'Entity not found' }, { status: 404 });
    }

    const entityName = (allIds) => {
      return db('service_base').select('id', db.raw("'service' as entity_type"), 'name')
        .unionAll(db('application_base').select('id', db.raw("'application' as entity_type"), 'name'))
        .unionAll(db('ci_base').select('id', db.raw("'ci' as entity_type"), 'name'))
        .unionAll(db('teams').select('id', db.raw("'team' as entity_type"), 'name'))
        .unionAll(db('locations').select('id', db.raw("'location' as entity_type"), 'name'))
        .whereIn('id', allIds);
    };

    const queue = [{ type, id, level: 0 }];
    const seenIds = new Set([id]);
    const edges = [];
    const nodeLevels = [{ id, type, level: 0 }];

    while (queue.length > 0) {
      const current = queue.shift();
      if (current.level >= depth) continue;

      const rels = await db('relationships')
        .where(function () {
          this.where({ sourceType: current.type, sourceId: current.id })
            .orWhere({ targetType: current.type, targetId: current.id });
        })
        .whereIn('sourceType', VALID_TYPES)
        .whereIn('targetType', VALID_TYPES);

      for (const rel of rels) {
        const isSource = rel.sourceId === current.id && rel.sourceType === current.type;
        const peerType = isSource ? rel.targetType : rel.sourceType;
        const peerId = isSource ? rel.targetId : rel.sourceId;

        edges.push({
          source: rel.sourceId,
          target: rel.targetId,
          type: rel.relationshipType || 'related_to',
          direction: rel.direction || 'outbound',
          sourceType: rel.sourceType,
          targetType: rel.targetType,
          level: current.level + 1,
        });

        if (!seenIds.has(peerId)) {
          seenIds.add(peerId);
          nodeLevels.push({ id: peerId, type: peerType, level: current.level + 1 });
          queue.push({ type: peerType, id: peerId, level: current.level + 1 });
        }
      }
    }

    const allIds = [...new Set([
      id,
      ...edges.map(e => e.source),
      ...edges.map(e => e.target),
    ])];

    const names = await entityName(allIds);
    const nameMap = {};
    for (const n of names) {
      nameMap[n.id] = { name: n.name, type: n.entity_type };
    }

    const levelMap = {};
    for (const nl of nodeLevels) {
      levelMap[nl.id] = nl.level;
    }

    const nodes = [];
    for (const nodeId of allIds) {
      const info = nameMap[nodeId] || { name: 'Unknown', type: 'service' };
      nodes.push({
        id: nodeId,
        type: info.type,
        name: info.name,
        level: levelMap[nodeId] ?? 0,
        isCenter: nodeId === id,
      });
    }

    return NextResponse.json({
      center: { id, type: center.type || type, name: center.name },
      nodes,
      edges,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
