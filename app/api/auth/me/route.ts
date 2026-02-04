import { NextResponse } from 'next/server';
import { users } from '@/lib/db';
import { createClient } from '@/lib/supabase-server';

export async function GET() {
  try {
    // 优先使用 Supabase 认证（若已配置且存在 session）
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      const supabase = await createClient();
      const { data } = await supabase.auth.getUser();

      if (data?.user) {
        const u = data.user;
        const username =
          (u.user_metadata?.username as string) || u.email?.split('@')[0] || '';
        return NextResponse.json({
          user: {
            id: u.id,
            username,
            email: u.email,
            avatar: u.user_metadata?.avatar_url ?? null,
            role: (u.user_metadata?.role as string) || 'user',
          },
        });
      }
    }

    // 回退到 Prisma 认证（旧系统 cookie）
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const userId = cookieStore.get('userId')?.value;

    if (!userId) {
      return NextResponse.json({ user: null });
    }

    const user = await users.findById(userId);
    if (!user) {
      return NextResponse.json({ user: null });
    }

    const { password: _, ...userWithoutPassword } = user;
    return NextResponse.json({ user: userWithoutPassword });
  } catch (error) {
    console.error('获取用户信息失败:', error);
    return NextResponse.json({ user: null });
  }
}
