import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { endpoint, token, path } = await req.json();
    if (!endpoint || !token || !path) {
      return NextResponse.json({ error: 'endpoint, token, path are required' }, { status: 400 });
    }

    const url = `${endpoint}${path}`;
    const response = await fetch(url, {
      headers: { 'api-token': token },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}