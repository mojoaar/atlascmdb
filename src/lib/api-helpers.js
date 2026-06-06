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
