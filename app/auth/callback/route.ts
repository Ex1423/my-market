// Supabase 认证回调：处理邮箱确认、OAuth 等重定向
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (!code) {
    return NextResponse.redirect(`${origin}/auth?error=missing_code`);
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('Auth callback error:', error);
      return NextResponse.redirect(`${origin}/auth?error=${encodeURIComponent(error.message)}`);
    }

    return NextResponse.redirect(`${origin}${next}`);
  } catch (e) {
    console.error('Auth callback exception:', e);
    const msg = e instanceof Error ? e.message : 'callback_error';
    return NextResponse.redirect(`${origin}/auth?error=${encodeURIComponent(msg)}`);
  }
}
