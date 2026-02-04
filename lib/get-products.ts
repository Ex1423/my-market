/**
 * 服务端直接获取商品列表（优先 Supabase，回退 Prisma）
 * 用于首页等，避免经过 API 转发
 */
import { products } from '@/lib/db';
import { createClient } from '@/lib/supabase-server';
import { logger } from '@/lib/logger';

export interface ProductItem {
  id: number | string;
  title: string;
  price: string;
  description?: string;
  category: string;
  condition?: string;
  location?: string;
  imageColor?: string;
  imageData?: string;
  publishDate?: string;
  seller?: { id: string; username: string };
  specs?: { label: string; value: string }[];
}

export async function getProducts(): Promise<ProductItem[]> {
  try {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      try {
        const supabase = await createClient();
        const { data: supabaseProducts, error } = await supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && supabaseProducts && supabaseProducts.length > 0) {
          return supabaseProducts.map((p: any) => ({
            id: p.id,
            title: p.title,
            price: typeof p.price === 'number' ? `¥ ${p.price}` : (p.price || '¥ 0'),
            description: p.description,
            category: p.category || '其他',
            condition: p.condition || '全新',
            location: p.location,
            imageColor: p.image_color || 'bg-gray-50',
            imageData: p.image_data || p.imageData,
            publishDate: p.created_at || p.publish_date,
            seller: p.seller ? { id: p.seller.id, username: p.seller.username } : { id: p.user_id, username: '用户' },
            specs: Array.isArray(p.specs) ? p.specs : [],
          }));
        }
      } catch (e) {
        logger.error('Supabase products fetch error:', e);
      }
    }

    const allProducts = await products.getAll();
    return allProducts.map((p: any) => ({
      id: p.id,
      title: p.title,
      price: p.price,
      description: p.description ?? undefined,
      category: p.category || '其他',
      condition: p.condition || '全新',
      location: p.location ?? undefined,
      imageColor: p.imageColor ?? 'bg-gray-50',
      imageData: p.imageData ?? undefined,
      publishDate: p.publishDate instanceof Date ? p.publishDate.toISOString() : p.publishDate,
      seller: p.seller ? { id: p.seller.id, username: p.seller.username } : undefined,
      specs: Array.isArray(p.specs) ? p.specs : [],
    }));
  } catch (error) {
    logger.error('getProducts error:', error);
    return [];
  }
}
