import { NextResponse } from 'next/server';

const WAREHOUSE_API_SECRET = process.env.WAREHOUSE_API_SECRET || 'default-secret';

export async function GET(req: Request) {
  const apiKey = req.headers.get('x-api-key');
  if (apiKey !== WAREHOUSE_API_SECRET) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
  }
  return NextResponse.json({ ok: true, time: new Date().toISOString() });
}