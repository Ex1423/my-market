import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { validate, addToCartSchema } from '@/lib/validation';
import { logger } from '@/lib/logger';

export async function GET(request: Request) {
  try {
    // 使用统一的身份验证中间件
    const authError = await requireAuth();
    if (authError) return authError;

    // 获取 userId（需要从 cookie 中读取）
    const { verifyAuth } = await import('@/lib/auth');
    const authResult = await verifyAuth(request);
    if (!authResult.success || !authResult.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let cart = await prisma.cart.findUnique({
      where: { userId: authResult.userId },
      include: {
        items: {
          include: {
            product: {
              include: { images: true }
            }
          }
        }
      }
    });

    if (!cart) {
      // Create a cart if it doesn't exist? Or just return empty items.
      // Let's create it on the fly to simplify things later.
      cart = await prisma.cart.create({
        data: { userId: authResult.userId },
        include: {
          items: {
            include: {
              product: {
                include: { images: true }
              }
            }
          }
        }
      });
    }

    return NextResponse.json({ cart });
  } catch (error) {
    logger.error('Get cart error:', error);
    return NextResponse.json({ error: 'Failed to fetch cart' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    // 使用统一的身份验证中间件
    const authError = await requireAuth();
    if (authError) return authError;

    // 获取 userId
    const { verifyAuth } = await import('@/lib/auth');
    const authResult = await verifyAuth(request);
    if (!authResult.success || !authResult.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // 使用 Zod 验证
    const validation = validate(addToCartSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { productId, quantity = 1 } = validation.data as { productId: string; quantity?: number };

    // Ensure cart exists
    let cart = await prisma.cart.findUnique({
      where: { userId: authResult.userId }
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId: authResult.userId }
      });
    }

    // Check if item already exists in cart
    const existingItem = await prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId: productId
        }
      }
    });

    if (existingItem) {
      // Update quantity
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + quantity }
      });
    } else {
      // Create new item
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: productId,
          quantity: quantity
        }
      });
    }

    // Return updated cart
    const updatedCart = await prisma.cart.findUnique({
      where: { id: cart.id },
      include: {
        items: {
          include: {
            product: {
              include: { images: true }
            }
          }
        }
      }
    });

    return NextResponse.json({ cart: updatedCart });
  } catch (error) {
    logger.error('Add to cart error:', error);
    return NextResponse.json({ error: 'Failed to add to cart' }, { status: 500 });
  }
}
