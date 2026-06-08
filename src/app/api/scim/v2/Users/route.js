import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import getDb from '../../../../../lib/db';
import { verifyScimToken, isScimEnabled } from '../../../../../lib/scim';
import { handleApiError } from '../../../../../lib/api-helpers';
import { logAudit } from '../../../../../lib/audit';

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

    let query = db('users');
    if (filter) {
      const eqMatch = filter.match(/userName eq "(.+)"/);
      if (eqMatch) {
        query = query.where('email', eqMatch[1]);
      }
    }

    const [totalResult] = await query.clone().clearSelect().count('* as total');
    const users = await query.offset(startIndex - 1).limit(count);

    return NextResponse.json({
      schemas: ['urn:ietf:params:scim:api:messages:2.0:ListResponse'],
      totalResults: Number(totalResult.total),
      startIndex,
      itemsPerPage: count,
      Resources: users.map(toScimUser),
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
    const userName = body.userName;
    const displayName = body.displayName || body.name?.formatted || userName;
    const emailValue = body.emails?.[0]?.value || userName;

    if (!userName) {
      return NextResponse.json({ detail: 'userName required', status: 400, schemas: ['urn:ietf:params:scim:api:messages:2.0:Error'] }, { status: 400 });
    }

    const db = getDb();

    const existing = await db('users').where({ email: emailValue }).first();
    if (existing) {
      return NextResponse.json(toScimUser(existing), { status: 200 });
    }

    const id = uuidv4();
    await db('users').insert({
      id,
      email: emailValue,
      displayName,
      passwordHash: '',
      status: body.active === false ? 'inactive' : 'active',
    });

    const user = await db('users').where({ id }).first();

    await logAudit({
      actorUserId: null,
      entityType: 'user',
      entityId: id,
      action: 'scim_provisioned',
      afterData: { email: emailValue, displayName, status: user.status },
    });

    return NextResponse.json(toScimUser(user), { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
