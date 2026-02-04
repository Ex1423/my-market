import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, verifyAuth } from '@/lib/auth';
import { validate, updateCartItemSchema } from '@/lib/validation';
import { logger } from '@/lib/logger';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    // 使用统一的身份验证中间件
    const authError = await requireAuth();
    if (authError) return authError;

    // 获取 userId
    const authResult = await verifyAuth(request);
    if (!authResult.success || !authResult.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { itemId } = await params;
    const body = await request.json();
    
    // 使用 Zod 验证
    const validation = validate(updateCartItemSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { quantity } = validation.data as { quantity: number };

    // Verify item belongs to user's cart
    const cartItem = await prisma.cartItem.findUnique({
      where: { id: itemId },
      include: { cart: true }
    });

    if (!cartItem || cartItem.cart.userId !== authResult.userId) {
      return NextResponse.json({ error: 'Item not found or unauthorized' }, { status: 404 });
    }

    const updatedItem = await prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity }
    });

    return NextResponse.json({ item: updatedItem });
  } catch (error) {
    console.error('Update cart item error:', error);
    return NextResponse.json({ error: 'Failed to update item' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success || !authResult.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { itemId } = await params;

    // Verify item belongs to user's cart
    const cartItem = await prisma.cartItem.findUnique({
      where: { id: itemId },
      include: { cart: true }
    });

    if (!cartItem || cartItem.cart.userId !== authResult.userId) {
      return NextResponse.json({ error: 'Item not found or unauthorized' }, { status: 404 });
    }

    await prisma.cartItem.delete({
      where: { id: itemId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Delete cart item error:', error);
    return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 });
  }
}
