import { Suspense } from 'react';
import { getProducts } from '@/lib/get-products';
import HomeContent from '@/components/HomeContent';

export const revalidate = 60;

/**
 * 首页 - 服务端直接获取商品（Supabase/Prisma），60 秒 ISR 缓存
 */
export default async function Home() {
  const products = await getProducts();

  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50">加载中...</div>}>
      <HomeContent products={products} />
    </Suspense>
  );
}
