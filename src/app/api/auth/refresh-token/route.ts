import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

export async function POST(req: Request) {
  try {
    const { token } = await req.json();
    const decoded = jwt.verify(token, JWT_SECRET, { ignoreExpiration: true }) as any;
    if (decoded.exp * 1000 < Date.now()) {
      return NextResponse.json({ error: 'Token expired beyond refresh window' }, { status: 401 });
    }
    const newToken = jwt.sign(
      { id: decoded.id, email: decoded.email, role: decoded.role, permissions: decoded.permissions || [] },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    return NextResponse.json({ token: newToken });
  } catch (e) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}