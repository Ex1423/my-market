import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success || !authResult.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const cart = await prisma.cart.findUnique({
      where: { userId: authResult.userId },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });

    if (!cart || cart.items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }

    let total = 0;
    const orderItems = cart.items.map(item => {
      const priceStr = item.product.price.replace(/[^\d.]/g, '');
      const price = parseFloat(priceStr) || 0;
      const subtotal = price * item.quantity;
      total += subtotal;
      return {
        productId: item.productId,
        quantity: item.quantity,
        price
      };
    });

    const order = await prisma.$transaction(async tx => {
      const created = await tx.order.create({
        data: {
          userId: authResult.userId!,
          total,
          status: 'PAID',
          items: {
            create: orderItems
          }
        },
        include: {
          items: {
            include: { product: true }
          }
        }
      });
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      return created;
    });

    return NextResponse.json({ order });
  } catch (error) {
    console.error('Create order error:', error);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success || !authResult.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orders = await prisma.order.findMany({
      where: { userId: authResult.userId },
      include: {
        items: {
          include: {
            product: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error('Fetch orders error:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}
