import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: List conversations for current user
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  try {
    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [
          { buyerId: userId },
          { sellerId: userId }
        ]
      },
      include: {
        buyer: {
          select: { id: true, username: true }
        },
        seller: {
          select: { id: true, username: true }
        },
        product: {
          select: { id: true, title: true, imageData: true, images: { take: 1 } }
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1
        },
        _count: {
          select: {
            messages: {
               where: {
                 read: false,
                 senderId: { not: userId }
               }
             }
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    // Transform data to include flat unreadCount
    const conversationsWithCount = conversations.map(c => ({
      ...c,
      unreadCount: c._count.messages,
      _count: undefined // Remove internal _count object
    }));

    return NextResponse.json({ conversations: conversationsWithCount });
  } catch (error) {
    console.error('Get conversations error:', error);
    return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
  }
}

// POST: Create or find conversation
export async function POST(request: Request) {
  try {
    const { buyerId, sellerId, productId } = await request.json();

    if (!buyerId || !sellerId) {
      return NextResponse.json({ error: 'Missing participants' }, { status: 400 });
    }

    // Check if exists
    let conversation = await prisma.conversation.findFirst({
      where: {
        buyerId,
        sellerId,
        productId: productId || null // Handle optional product
      },
      include: {
        buyer: { select: { id: true, username: true } },
        seller: { select: { id: true, username: true } },
        product: { select: { id: true, title: true, imageData: true, images: { take: 1 } } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 }
      }
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          buyerId,
          sellerId,
          productId: productId || undefined
        },
        include: {
          buyer: { select: { id: true, username: true } },
          seller: { select: { id: true, username: true } },
          product: { select: { id: true, title: true, imageData: true, images: { take: 1 } } },
          messages: { orderBy: { createdAt: 'desc' }, take: 1 }
        }
      });
    }

    return NextResponse.json({ conversation });
  } catch (error) {
    console.error('Create conversation error:', error);
    return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 });
  }
}

// DELETE: Delete a conversation (and its messages)
export async function DELETE(request: Request) {
  try {
    const { conversationId } = await request.json();

    if (!conversationId) {
      return NextResponse.json({ error: 'Conversation ID is required' }, { status: 400 });
    }

    // Delete related messages first (in case cascade is not configured)
    await prisma.message.deleteMany({
      where: { conversationId }
    });

    await prisma.conversation.delete({
      where: { id: conversationId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete conversation error:', error);
    return NextResponse.json({ error: 'Failed to delete conversation' }, { status: 500 });
  }
}
