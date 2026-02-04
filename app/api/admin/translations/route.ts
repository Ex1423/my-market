import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { logger } from '@/lib/logger';

export async function GET(request: Request) {
  try {
    // 使用统一的管理员验证中间件
    const authError = await requireAdmin();
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    
    const translations = await prisma.translation.findMany({
      where: {
        OR: [
          { sourceText: { contains: search } },
          { translatedText: { contains: search } }
        ]
      },
      orderBy: { updatedAt: 'desc' },
      take: 100
    });
    
    return NextResponse.json({ translations });
  } catch (error) {
    logger.error('Fetch translations error:', error);
    return NextResponse.json({ error: 'Failed to fetch translations' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    // 使用统一的管理员验证中间件
    const authError = await requireAdmin();
    if (authError) return authError;

    const { id, translatedText } = await request.json();
    
    if (!id || !translatedText) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const translation = await prisma.translation.update({
      where: { id },
      data: { translatedText }
    });
    
    return NextResponse.json({ translation });
  } catch (error) {
    logger.error('Update translation error:', error);
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    // 使用统一的管理员验证中间件
    const authError = await requireAdmin();
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing ID' }, { status: 400 });
    }

    await prisma.translation.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Delete translation error:', error);
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
}
