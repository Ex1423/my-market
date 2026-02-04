import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verifyAuth } from '@/lib/auth'; // Assuming this exists or similar logic

export async function PUT(request: Request) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success || !authResult.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { username, avatar, phone, notificationSound, receiverName, address } = body;

    // Check if username is taken (if changed)
    if (username) {
      const existingUser = await prisma.user.findFirst({
        where: { 
          username,
          NOT: { id: authResult.userId }
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
          where: { id: authResult.userId },
          data: updateData,
        })
      : await prisma.user.findUniqueOrThrow({
          where: { id: authResult.userId },
        });

    const { password: _, ...userWithoutPassword } = updatedUser;
    return NextResponse.json({ user: userWithoutPassword });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Update profile error:', error);
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
