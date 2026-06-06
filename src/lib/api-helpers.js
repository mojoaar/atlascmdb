import { NextResponse } from 'next/server';

export function handleApiError(error, message = 'Internal server error') {
  console.error(`${message}:`, error);
  return NextResponse.json({ error: message }, { status: 500 });
}

export function notFound(entity = 'Resource') {
  return NextResponse.json({ error: `${entity} not found` }, { status: 404 });
}

export function badRequest(message) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export function success(data, status = 200) {
  return NextResponse.json(data, { status });
}

export function created(data) {
  return NextResponse.json(data, { status: 201 });
}

export function unauthorized(message = 'Authentication required') {
  return NextResponse.json({ error: message }, { status: 401 });
}

export function forbidden(message = 'Insufficient permissions') {
  return NextResponse.json({ error: message }, { status: 403 });
}

export function conflict(message = 'Conflict') {
  return NextResponse.json({ error: message }, { status: 409 });
}

export function guardResponse(auth) {
  if (auth.status === 401) {
    return unauthorized(auth.body?.error);
  }
  if (auth.status === 403) {
    return forbidden(auth.body?.error);
  }
  return NextResponse.json(auth.body || { error: 'Access denied' }, { status: auth.status || 403 });
}
