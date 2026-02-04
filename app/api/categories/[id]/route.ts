import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { validate, updateCategorySchema } from '@/lib/validation';
import { logger } from '@/lib/logger';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 使用统一的管理员验证中间件
    const authError = await requireAdmin();
    if (authError) return authError;

    const { id } = await params;
    const body = await request.json();
    
    // 使用 Zod 验证
    const validation = validate(updateCategorySchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { name, description, keywords } = validation.data as { name?: string; description?: string; keywords?: string };

    const updatedCategory = await prisma.category.update({
      where: { id },
      data: {
        name,
        description,
        keywords,
      },
    });

    return NextResponse.json({ category: updatedCategory });
  } catch (error) {
    logger.error('Update category error:', error);
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 使用统一的管理员验证中间件
    const authError = await requireAdmin();
    if (authError) return authError;

    const { id } = await params;

    // Check if category has children
    const category = await prisma.category.findUnique({
      where: { id },
      include: { children: true },
    });

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    if (category.children && category.children.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete category with sub-categories. Please delete sub-categories first.' },
        { status: 400 }
      );
    }

    await prisma.category.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Delete category error:', error);
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}
