import { prisma } from '@/lib/prisma';
import { cache } from 'react';

export const getProduct = cache(async (id: string) => {
  try {
    const existingProduct = await prisma.product.findUnique({
      where: { id: id }
    });

    if (existingProduct) {
      const product = await prisma.product.update({
        where: { id: id },
        data: { views: { increment: 1 } },
        include: {
          seller: {
            select: {
              id: true,
              username: true,
              createdAt: true,
            }
          },
          images: true
        }
      });
      
      // Serialize dates
      return {
        ...product,
        publishDate: product.publishDate.toISOString(),
        seller: {
          ...product.seller,
          createdAt: product.seller.createdAt.toISOString()
        }
      };
    }
    return null;
  } catch (error) {
    console.error(`Error fetching product ${id}:`, error);
    return null;
  }
});
