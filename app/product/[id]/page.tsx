import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import ProductDetailClient from '@/components/ProductDetailClient';
import ProductNotFound from '@/components/ProductNotFound';

/**
 * 商品详情页组件
 * 动态路由: /product/[id]
 */
export default async function ProductDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // 获取路由参数中的 id
  const { id } = await params;

  // 从数据库获取商品数据，包含卖家信息，并增加浏览量
  let product;
  try {
    // 首先尝试查找商品是否存在
    const existingProduct = await prisma.product.findUnique({
      where: { id: id }
    });

    if (existingProduct) {
      // 如果存在，则更新浏览量并获取完整信息
      product = await prisma.product.update({
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
          images: true // 包含多图
        }
      });
    } else {
      product = null;
    }
  } catch (error) {
    console.error(`Error fetching product ${id}:`, error);
    // 如果更新失败（例如 ID 不存在），尝试仅查找
    product = null;
  }

  // 如果没有找到商品，显示 404
  if (!product) {
    return <ProductNotFound />;
  }

  // 构造图片列表（确保包含 imageData）
  let imageList: string[] = [];
  if (product.images && product.images.length > 0) {
    imageList = product.images.map(img => img.url);
  } else if (product.imageData) {
    imageList = [product.imageData];
  }

  // 解析 specs
  let parsedSpecs = undefined;
  if (product.specs) {
    try {
      parsedSpecs = JSON.parse(product.specs);
    } catch (e) {
      console.error('Failed to parse specs:', e);
    }
  }

  // 序列化 product 对象，确保 Date 转换为字符串，避免传给 Client Component 时出错
  const serializedProduct = {
    ...product,
    publishDate: product.publishDate.toISOString(),
    seller: {
      ...product.seller,
      createdAt: product.seller.createdAt.toISOString()
    }
  };

  return <ProductDetailClient product={serializedProduct} imageList={imageList} specs={parsedSpecs} />;
}
