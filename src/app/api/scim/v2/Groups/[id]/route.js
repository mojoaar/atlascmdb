import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import getDb from '../../../../../../lib/db';
import { verifyScimToken, isScimEnabled } from '../../../../../../lib/scim';
import { handleApiError } from '../../../../../../lib/api-helpers';
import { logAudit } from '../../../../../../lib/audit';

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

export async function GET(request, { params }) {
  try {
    if (!await isScimEnabled()) return NextResponse.json({ error: 'SCIM not enabled' }, { status: 501 });
    if (!await verifyScimToken(request)) {
      return NextResponse.json({ detail: 'Unauthorized', status: 401, schemas: ['urn:ietf:params:scim:api:messages:2.0:Error'] }, { status: 401 });
    }

    const { id } = await params;
    const db = getDb();
    const role = await db('roles').where({ id }).first();
    if (!role) return NextResponse.json({ detail: 'Group not found', status: 404, schemas: ['urn:ietf:params:scim:api:messages:2.0:Error'] }, { status: 404 });

    return NextResponse.json(await toScimGroup(db, role));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request, { params }) {
  try {
    if (!await isScimEnabled()) return NextResponse.json({ error: 'SCIM not enabled' }, { status: 501 });
    if (!await verifyScimToken(request)) {
      return NextResponse.json({ detail: 'Unauthorized', status: 401, schemas: ['urn:ietf:params:scim:api:messages:2.0:Error'] }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const db = getDb();

    const role = await db('roles').where({ id }).first();
    if (!role) return NextResponse.json({ detail: 'Group not found', status: 404, schemas: ['urn:ietf:params:scim:api:messages:2.0:Error'] }, { status: 404 });

    const ops = body.Operations || [];
    for (const op of ops) {
      if (op.op === 'replace' && op.path === 'displayName' && op.value) {
        await db('roles').where({ id }).update({ name: op.value, updatedAt: new Date().toISOString() });
      }
      if (op.op === 'add' && op.path === 'members') {
        const users = Array.isArray(op.value) ? op.value : [op.value];
        for (const member of users) {
          const userId = member.value || member;
          const existing = await db('user_roles').where({ userId, roleId: id }).first();
          if (!existing) {
            await db('user_roles').insert({ id: uuidv4(), userId, roleId: id });
          }
        }
      }
      if (op.op === 'remove' && op.path) {
        const memberPath = op.path.match(/members\[value eq "(.+)"\]/);
        if (memberPath) {
          const userId = memberPath[1];
          await db('user_roles').where({ userId, roleId: id }).del();
        }
      }
    }

    const updated = await db('roles').where({ id }).first();

    await logAudit({
      actorUserId: null,
      entityType: 'role',
      entityId: id,
      action: 'scim_updated',
      beforeData: { name: role.name },
      afterData: { name: updated.name },
    });

    return NextResponse.json(await toScimGroup(db, updated));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request, { params }) {
  try {
    if (!await isScimEnabled()) return NextResponse.json({ error: 'SCIM not enabled' }, { status: 501 });
    if (!await verifyScimToken(request)) {
      return NextResponse.json({ detail: 'Unauthorized', status: 401, schemas: ['urn:ietf:params:scim:api:messages:2.0:Error'] }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const db = getDb();

    const existing = await db('roles').where({ id }).first();
    if (!existing) {
      await db('roles').insert({ id, name: body.displayName || 'New Group' });
      const created = await db('roles').where({ id }).first();
      return NextResponse.json(await toScimGroup(db, created), { status: 201 });
    }

    if (body.displayName) {
      await db('roles').where({ id }).update({ name: body.displayName, updatedAt: new Date().toISOString() });
    }

    if (body.members) {
      await db('user_roles').where({ roleId: id }).del();
      for (const member of body.members) {
        const userId = member.value || member;
        const user = await db('users').where({ id: userId }).first();
        if (user) {
          await db('user_roles').insert({ id: uuidv4(), userId, roleId: id });
        }
      }
    }

    const updated = await db('roles').where({ id }).first();

    await logAudit({
      actorUserId: null,
      entityType: 'role',
      entityId: id,
      action: existing ? 'scim_updated' : 'scim_provisioned',
      beforeData: existing ? { name: existing.name } : null,
      afterData: { name: updated.name },
    });

    return NextResponse.json(await toScimGroup(db, updated));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request, { params }) {
  try {
    if (!await isScimEnabled()) return NextResponse.json({ error: 'SCIM not enabled' }, { status: 501 });
    if (!await verifyScimToken(request)) {
      return NextResponse.json({ detail: 'Unauthorized', status: 401, schemas: ['urn:ietf:params:scim:api:messages:2.0:Error'] }, { status: 401 });
    }

    const { id } = await params;
    const db = getDb();
    const role = await db('roles').where({ id }).first();
    if (!role) return NextResponse.json({ detail: 'Group not found', status: 404, schemas: ['urn:ietf:params:scim:api:messages:2.0:Error'] }, { status: 404 });

    await db('user_roles').where({ roleId: id }).del();
    await db('roles').where({ id }).del();

    await logAudit({
      actorUserId: null,
      entityType: 'role',
      entityId: id,
      action: 'scim_deleted',
      beforeData: { name: role.name },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleApiError(error);
  }
}
