import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { validate, createCategorySchema } from '@/lib/validation';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      where: { level: 1 },
      include: {
        children: {
          include: {
            children: true
          }
        }
      }
    });
    return NextResponse.json({ categories });
  } catch (error) {
    logger.error('Fetch categories error:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    // 使用统一的管理员验证中间件
    const authError = await requireAdmin();
    if (authError) return authError;

    const body = await request.json();
    
    // 使用 Zod 验证
    const validation = validate(createCategorySchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { name, level, parentId, description, keywords } = validation.data as { name: string; level: number; parentId?: string | null; description?: string; keywords?: string };

    const category = await prisma.category.create({
      data: {
        name,
        level,
        parentId,
        description,
        keywords
      }
    });

    return NextResponse.json({ category });
  } catch (error) {
    logger.error('Create category error:', error);
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}
