import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: Fetch messages for a conversation
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const messages = await prisma.message.findMany({
      where: { conversationId: id },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: {
          select: { id: true, username: true }
        }
      }
    });

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Get messages error:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

// POST: Send a message
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { senderId, content, type, mediaUrl } = await request.json();

    if (!senderId || (!content && !mediaUrl)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const message = await prisma.message.create({
      data: {
        conversationId: id,
        senderId,
        content,
        type,     // 'text', 'image', 'audio'
        mediaUrl  // Base64 string
      },
      include: {
        sender: {
          select: { id: true, username: true }
        }
      }
    });

    // Update conversation timestamp
    await prisma.conversation.update({
      where: { id: id },
      data: { updatedAt: new Date() }
    });

    return NextResponse.json({ message });
  } catch (error) {
    console.error('Send message error:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}

// DELETE: Delete messages
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { messageIds } = await request.json();

    if (!Array.isArray(messageIds) || messageIds.length === 0) {
      return NextResponse.json({ error: 'No messages selected' }, { status: 400 });
    }

    // Verify messages belong to this conversation (security check)
    const count = await prisma.message.deleteMany({
      where: {
        id: { in: messageIds },
        conversationId: id
      }
    });

    return NextResponse.json({ count });
  } catch (error) {
    console.error('Delete messages error:', error);
    return NextResponse.json({ error: 'Failed to delete messages' }, { status: 500 });
  }
}
