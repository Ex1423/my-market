import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success || !authResult.userId) {
      // Return 0 if not authenticated, rather than error, to avoid console spam for guests
      return NextResponse.json({ count: 0, sound: 'default' });
    }

    // Get unread count
    const count = await prisma.message.count({
      where: {
        conversation: {
          OR: [
            { buyerId: authResult.userId },
            { sellerId: authResult.userId }
          ]
        },
        senderId: { not: authResult.userId }, // Messages NOT sent by me
        read: false
      }
    });

    // Get user sound preference
    const user = await prisma.user.findUnique({
      where: { id: authResult.userId },
      select: { notificationSound: true }
    });

    return NextResponse.json({ 
      count, 
      sound: user?.notificationSound || 'default' 
    });

  } catch (error) {
    console.error('Get unread count error:', error);
    return NextResponse.json({ error: 'Failed to fetch unread count' }, { status: 500 });
  }
}
