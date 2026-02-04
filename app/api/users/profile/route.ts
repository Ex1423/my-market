import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { prisma, users } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';
import { createClient } from '@/lib/supabase-server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

// 获取当前用户 ID（优先 Supabase：cookies 或 Bearer token，回退 Prisma cookie）
async function getCurrentUserId(request: Request): Promise<string | null> {
  if (!supabaseUrl || !supabaseKey) {
    const authResult = await verifyAuth(null);
    return authResult.success && authResult.userId ? authResult.userId : null;
  }

  // 1. 尝试 Authorization Bearer token（Vercel 上 cookies 可能不可靠时的回退）
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (token) {
    try {
      const supabase = createSupabaseClient(supabaseUrl, supabaseKey);
      const { data } = await supabase.auth.getUser(token);
      if (data?.user) {
        const prismaUser = await users.findOrCreateBySupabase(data.user);
        return prismaUser.id;
      }
    } catch (e) {
      console.error('Supabase Bearer auth error:', e);
    }
  }

  // 2. 尝试 Supabase cookies（服务端 session）
  try {
    const cookieStore = await cookies();
    const supabase = await createClient(cookieStore);
    const { data } = await supabase.auth.getUser();
    if (data?.user) {
      const prismaUser = await users.findOrCreateBySupabase(data.user);
      return prismaUser.id;
    }
    console.error('Server Side: No session found! (Supabase cookies)');
  } catch (e) {
    console.error('Supabase cookie auth error:', e);
  }

  // 3. 回退 Prisma cookie
  const authResult = await verifyAuth(null);
  if (!authResult.success || !authResult.userId) {
    console.error('Server Side: No session found! (all auth methods failed)');
  }
  return authResult.success && authResult.userId ? authResult.userId : null;
}

export async function PUT(request: Request) {
  try {
    const userId = await getCurrentUserId(request);
    if (!userId) {
      console.error('Server Side: No session found!');
      return NextResponse.json({ error: '请重新登录' }, { status: 401 });
    }

    const body = await request.json();
    const { username, avatar, phone, notificationSound, receiverName, address } = body;

    // Check if username is taken (if changed)
    if (username) {
      const existingUser = await prisma.user.findFirst({
        where: { 
          username,
          NOT: { id: userId }
        }
      });
      if (existingUser) {
        return NextResponse.json({ error: 'Username already taken' }, { status: 400 });
      }
    }

    const updateData: Record<string, unknown> = {};
    if (username) updateData.username = username;
    if (avatar !== undefined) updateData.avatar = avatar;
    if (phone !== undefined) updateData.phone = phone || null;
    if (notificationSound) updateData.notificationSound = notificationSound;
    if (receiverName !== undefined) updateData.receiverName = receiverName || null;
    if (address !== undefined) updateData.address = address || null;

    const updatedUser = Object.keys(updateData).length > 0
      ? await prisma.user.update({
          where: { id: userId },
          data: updateData,
        })
      : await prisma.user.findUniqueOrThrow({
          where: { id: userId },
        });

    const { password: _, ...userWithoutPassword } = updatedUser;
    return NextResponse.json({ user: userWithoutPassword });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Update profile error:', error);
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
