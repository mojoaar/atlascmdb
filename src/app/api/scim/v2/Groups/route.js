import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import getDb from '../../../../../lib/db';
import { verifyScimToken, isScimEnabled } from '../../../../../lib/scim';
import { handleApiError } from '../../../../../lib/api-helpers';
import { logAudit } from '../../../../../lib/audit';

const SCHEMA_GROUP = 'urn:ietf:params:scim:schemas:core:2.0:Group';

async function toScimGroup(db, role) {
  const members = [];
  const userRoles = await db('user_roles').where({ roleId: role.id }).select('userId');
  for (const ur of userRoles) {
    const u = await db('users').where({ id: ur.userId }).select('id', 'displayName').first();
    if (u) members.push({ value: u.id, display: u.displayName });
  }

  return {
    schemas: [SCHEMA_GROUP],
    id: role.id,
    displayName: role.name,
    members,
    meta: {
      resourceType: 'Group',
      created: role.createdAt,
      lastModified: role.updatedAt,
    },
  };
}

export async function GET(request) {
  try {
    if (!await isScimEnabled()) return NextResponse.json({ error: 'SCIM not enabled' }, { status: 501 });
    if (!await verifyScimToken(request)) {
      return NextResponse.json({ detail: 'Unauthorized', status: 401, schemas: ['urn:ietf:params:scim:api:messages:2.0:Error'] }, { status: 401 });
    }

    const db = getDb();
    const { searchParams } = new URL(request.url);
    const startIndex = Math.max(1, parseInt(searchParams.get('startIndex') || '1'));
    const count = Math.min(100, parseInt(searchParams.get('count') || '100'));
    const filter = searchParams.get('filter');

    let query = db('roles');
    if (filter) {
      const eqMatch = filter.match(/displayName eq "(.+)"/);
      if (eqMatch) {
        query = query.where('name', eqMatch[1]);
      }
    }

    const [totalResult] = await query.clone().clearSelect().count('* as total');
    const roles = await query.offset(startIndex - 1).limit(count);

    const resources = [];
    for (const role of roles) {
      resources.push(await toScimGroup(db, role));
    }

    return NextResponse.json({
      schemas: ['urn:ietf:params:scim:api:messages:2.0:ListResponse'],
      totalResults: Number(totalResult.total),
      startIndex,
      itemsPerPage: count,
      Resources: resources,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request) {
  try {
    if (!await isScimEnabled()) return NextResponse.json({ error: 'SCIM not enabled' }, { status: 501 });
    if (!await verifyScimToken(request)) {
      return NextResponse.json({ detail: 'Unauthorized', status: 401, schemas: ['urn:ietf:params:scim:api:messages:2.0:Error'] }, { status: 401 });
    }

    const body = await request.json();
    const displayName = body.displayName;

    if (!displayName) {
      return NextResponse.json({ detail: 'displayName required', status: 400, schemas: ['urn:ietf:params:scim:api:messages:2.0:Error'] }, { status: 400 });
    }

    const db = getDb();
    const existing = await db('roles').where({ name: displayName }).first();
    if (existing) {
      return NextResponse.json(await toScimGroup(db, existing), { status: 200 });
    }

    const id = uuidv4();
    await db('roles').insert({ id, name: displayName });

    const role = await db('roles').where({ id }).first();

    await logAudit({
      actorUserId: null,
      entityType: 'role',
      entityId: id,
      action: 'scim_provisioned',
      afterData: { name: displayName },
    });

    return NextResponse.json(await toScimGroup(db, role), { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
