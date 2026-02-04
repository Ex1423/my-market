import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  try {
    const categories = await prisma.favorite.findMany({
      where: { userId },
      select: { category: true },
      distinct: ['category']
    });

    return NextResponse.json({ categories: categories.map(c => c.category) });
  } catch (error) {
    console.error('Get favorite categories error:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}
