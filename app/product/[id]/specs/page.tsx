import React from 'react';
import { prisma } from '@/lib/prisma';
import ProductSpecs from '@/components/product/ProductSpecs';
import ProductNotFound from '@/components/ProductNotFound';

const JIANXU_DATA = {
  specs: [
    { label: "材质", value: "高密度岩板 / 北美白蜡木 / 棉麻" },
    { label: "尺寸 (桌)", value: "140cm × 70cm × 75cm" },
    { label: "尺寸 (椅)", value: "50cm × 55cm × 85cm" },
    { label: "重量", value: "桌: 45kg / 椅: 8kg" },
    { label: "包装", value: "加厚瓦楞纸 + 珍珠棉护角" }
  ]
};

export default async function ProductSpecsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const product = await prisma.product.findUnique({
    where: { id: id },
     include: {
      seller: {
        select: {
          id: true,
          username: true,
          createdAt: true,
        }
      }
    }
  });

  if (!product) return <ProductNotFound />;

  let parsedSpecs = JIANXU_DATA.specs;
  if (product.specs) {
    try {
      const dbSpecs = JSON.parse(product.specs);
      if (dbSpecs && dbSpecs.length > 0) {
        parsedSpecs = dbSpecs;
      }
    } catch (e) {
      console.error('Failed to parse specs:', e);
    }
  }

  const serializedProduct = {
    ...product,
    publishDate: product.publishDate.toISOString(),
    seller: {
        ...product.seller,
        createdAt: product.seller.createdAt.toISOString()
    }
  };

  return <ProductSpecs product={serializedProduct} specs={parsedSpecs} />;
}
