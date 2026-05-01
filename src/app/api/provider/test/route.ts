import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { endpoint, token } = await req.json();
    if (!endpoint || !token) {
      return NextResponse.json({ error: 'endpoint and token are required' }, { status: 400 });
    }

    // إرسال طلب اختبار إلى API المزود (مثلاً /client/api/profile)
    const response = await fetch(`${endpoint}/client/api/profile`, {
      headers: { 'api-token': token },
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'فشل الاتصال');

    return NextResponse.json({ success: true, balance: data.balance });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}