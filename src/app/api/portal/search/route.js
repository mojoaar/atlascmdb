import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ message: 'Portal search - use /api/search instead' });
}
