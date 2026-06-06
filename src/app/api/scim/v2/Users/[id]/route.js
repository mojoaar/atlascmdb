import { NextResponse } from 'next/server';
import getDb from '../../../../../../lib/db';
import { verifyScimToken, isScimEnabled } from '../../../../../../lib/scim';
import { handleApiError } from '../../../../../../lib/api-helpers';
import { logAudit } from '../../../../../../lib/audit';

const SCHEMA_USER = 'urn:ietf:params:scim:schemas:core:2.0:User';

function toScimUser(u) {
  const nameParts = (u.displayName || '').split(' ');
  return {
    schemas: [SCHEMA_USER],
    id: u.id,
    userName: u.email,
    name: {
      formatted: u.displayName,
      givenName: nameParts[0] || '',
      familyName: nameParts.slice(1).join(' ') || '',
    },
    displayName: u.displayName,
    emails: [{ value: u.email, primary: true }],
    active: u.status !== 'inactive',
    meta: {
      resourceType: 'User',
      created: u.createdAt,
      lastModified: u.updatedAt,
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
    const user = await db('users').where({ id }).first();
    if (!user) return NextResponse.json({ detail: 'User not found', status: 404, schemas: ['urn:ietf:params:scim:api:messages:2.0:Error'] }, { status: 404 });

    return NextResponse.json(toScimUser(user));
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
    const user = await db('users').where({ id }).first();
    if (!user) return NextResponse.json({ detail: 'User not found', status: 404, schemas: ['urn:ietf:params:scim:api:messages:2.0:Error'] }, { status: 404 });

    const ops = body.Operations || [];
    for (const op of ops) {
      if (op.op === 'replace') {
        if (!op.path || op.path === 'active') {
          if (op.value !== undefined) {
            await db('users').where({ id }).update({ status: op.value ? 'active' : 'inactive', updatedAt: new Date().toISOString() });
          }
        }
        if (!op.path || op.path === 'displayName') {
          if (op.value) {
            await db('users').where({ id }).update({ displayName: op.value, updatedAt: new Date().toISOString() });
          }
        }
      } else if (op.op === 'add') {
        if (op.path === 'emails' && op.value.email) {
          await db('users').where({ id }).update({ email: op.value.email, updatedAt: new Date().toISOString() });
        }
      }
    }

    const updated = await db('users').where({ id }).first();

    await logAudit({
      actorUserId: null,
      entityType: 'user',
      entityId: id,
      action: 'scim_updated',
      beforeData: { email: user.email, displayName: user.displayName, status: user.status },
      afterData: { email: updated.email, displayName: updated.displayName, status: updated.status },
    });

    return NextResponse.json(toScimUser(updated));
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

    const existing = await db('users').where({ id }).first();
    if (!existing) {
      const newId = id;
      await db('users').insert({
        id: newId,
        email: body.userName || body.emails?.[0]?.value || '',
        displayName: body.displayName || body.name?.formatted || body.userName || '',
        passwordHash: '',
        status: body.active === false ? 'inactive' : 'active',
      });
      const created = await db('users').where({ id: newId }).first();

      await logAudit({
        actorUserId: null,
        entityType: 'user',
        entityId: newId,
        action: 'scim_provisioned',
        afterData: { email: created.email, displayName: created.displayName, status: created.status },
      });

      return NextResponse.json(toScimUser(created), { status: 201 });
    }

    const updates = { updatedAt: new Date().toISOString() };
    if (body.displayName !== undefined) updates.displayName = body.displayName;
    if (body.name?.formatted !== undefined && body.displayName === undefined) updates.displayName = body.name.formatted;
    if (body.active !== undefined) updates.status = body.active ? 'active' : 'inactive';
    if (body.userName !== undefined) updates.email = body.userName;
    if (body.emails?.[0]?.value !== undefined && body.userName === undefined) updates.email = body.emails[0].value;

    await db('users').where({ id }).update(updates);
    const updated = await db('users').where({ id }).first();

    await logAudit({
      actorUserId: null,
      entityType: 'user',
      entityId: id,
      action: 'scim_updated',
      beforeData: { email: existing.email, displayName: existing.displayName, status: existing.status },
      afterData: { email: updated.email, displayName: updated.displayName, status: updated.status },
    });

    return NextResponse.json(toScimUser(updated));
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
    const user = await db('users').where({ id }).first();
    if (!user) return NextResponse.json({ detail: 'User not found', status: 404, schemas: ['urn:ietf:params:scim:api:messages:2.0:Error'] }, { status: 404 });

    await db('users').where({ id }).update({ status: 'inactive', updatedAt: new Date().toISOString() });

    await logAudit({
      actorUserId: null,
      entityType: 'user',
      entityId: id,
      action: 'scim_deactivated',
      beforeData: { email: user.email, displayName: user.displayName, status: user.status },
      afterData: { status: 'inactive' },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleApiError(error);
  }
}
