import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function getUserId(req: Request): Promise<string> {
  const authHeader = req.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '');
  if (!token) throw new Error('غير مصرح');
  const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
  return decoded.id;
}

export async function GET(req: Request) {
  try {
    const userId = await getUserId(req);
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: factors } = await supabase.auth.mfa.listFactors({ userId });
    return NextResponse.json({ has2FA: factors?.totp.length > 0 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const userId = await getUserId(req);
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' });
    if (error) throw error;
    return NextResponse.json({ factorId: data.id, qr_code: data.totp.qr_code, secret: data.totp.secret });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const userId = await getUserId(req);
    const { factorId, code } = await req.json();
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

    const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });
    if (challengeError) throw challengeError;

    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.id,
      code,
    });
    if (verifyError) throw verifyError;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const userId = await getUserId(req);
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: factors } = await supabase.auth.mfa.listFactors({ userId });
    const factor = factors?.totp[0];
    if (!factor) throw new Error('لا يوجد 2FA مفعل');

    const { error } = await supabase.auth.mfa.unenroll({ factorId: factor.id });
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}