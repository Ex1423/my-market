import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase-server';

export async function POST() {
  const cookieStore = await cookies();

  // Supabase 登出（清除 session cookies）
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    try {
      const supabase = await createClient();
      await supabase.auth.signOut();
    } catch (e) {
      console.error('Supabase signOut error:', e);
    }
  }

  // Prisma 旧系统 cookie
  cookieStore.delete('userId');
  return NextResponse.json({ success: true });
}
