import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, verifyAuth } from '@/lib/auth';
import { validate, addFavoriteSchema } from '@/lib/validation';
import { logger } from '@/lib/logger';

export async function POST(request: Request) {
  try {
    // 使用统一的身份验证中间件
    const authError = await requireAuth();
    if (authError) return authError;

    // 获取 userId
    const authResult = await verifyAuth(request);
    if (!authResult.success || !authResult.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { userId } = authResult;

    const body = await request.json();
    
    // 使用 Zod 验证
    const validation = validate(addFavoriteSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { productId, category } = validation.data as { productId: string; category?: string };

    const favorite = await prisma.favorite.create({
      data: {
        userId,
        productId,
        category: category || '默认'
      }
    });

    return NextResponse.json({ success: true, favorite });
  } catch (error) {
    logger.error('Add favorite error:', error);
    return NextResponse.json({ error: 'Failed to add favorite' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    // 使用统一的身份验证中间件
    const authError = await requireAuth();
    if (authError) return authError;

    // 获取 userId
    const authResult = await verifyAuth(request);
    if (!authResult.success || !authResult.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
    const favorites = await prisma.favorite.findMany({
      where: { userId: authResult.userId },
      include: {
        product: {
          include: {
            images: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ favorites });
    } catch (error) {
      logger.error('Get favorites error:', error);
      return NextResponse.json({ error: 'Failed to fetch favorites' }, { status: 500 });
    }
  } catch (error) {
    logger.error('Get favorites auth error:', error);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
