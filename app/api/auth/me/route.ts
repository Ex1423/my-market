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
        const prismaUser = await users.findOrCreateBySupabase(data.user);
        const { password: _, ...userWithoutPassword } = prismaUser;
        return NextResponse.json({ user: userWithoutPassword });
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
