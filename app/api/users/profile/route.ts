import { NextResponse } from 'next/server';
import { prisma, users } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';
import { createClient } from '@/lib/supabase-server';

// 获取当前用户 ID（优先 Supabase，回退 Prisma cookie）
async function getCurrentUserId(): Promise<string | null> {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    try {
      const supabase = await createClient();
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        const prismaUser = await users.findOrCreateBySupabase(data.user);
        return prismaUser.id;
      }
    } catch (e) {
      console.error('Supabase auth error:', e);
    }
  }
  const authResult = await verifyAuth(null);
  return authResult.success && authResult.userId ? authResult.userId : null;
}

export async function PUT(request: Request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
