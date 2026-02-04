import { NextResponse } from 'next/server';
import { products, users } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';
import { createClient } from '@/lib/supabase-server';
import { logger } from '@/lib/logger';

// 获取当前用户 ID（优先 Supabase，回退 Prisma cookie）
async function getSellerId(): Promise<string | null> {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    try {
      const supabase = await createClient();
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        const prismaUser = await users.findOrCreateBySupabase(data.user);
        return prismaUser.id;
      }
    } catch (e) {
      logger.error('Supabase auth error:', e);
    }
  }
  const authResult = await verifyAuth(null);
  return authResult.success && authResult.userId ? authResult.userId : null;
}

// GET: 获取所有商品（优先 Supabase，回退 Prisma）
export async function GET() {
  try {
    // 1. 尝试从 Supabase products 表读取
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      try {
        const supabase = await createClient();
        const { data: supabaseProducts, error } = await supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && supabaseProducts && supabaseProducts.length > 0) {
          const mapped = supabaseProducts.map((p: any) => ({
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
          return NextResponse.json(mapped);
        }
      } catch (e) {
        logger.error('Supabase products fetch error:', e);
      }
    }

    // 2. 回退到 Prisma
    const allProducts = await products.getAll();
    return NextResponse.json(allProducts);
  } catch (error) {
    logger.error('读取数据失败:', error);
    return NextResponse.json([], { status: 500 });
  }
}

// POST: 发布新商品
export async function POST(request: Request) {
  try {
    const sellerId = await getSellerId();
    if (!sellerId) {
      return NextResponse.json({ success: false, error: '请先登录' }, { status: 401 });
    }

    const newProductData = await request.json();
    
    // 基本验证（兼容各种前端格式）
    if (!newProductData.title || String(newProductData.title).trim().length === 0) {
      return NextResponse.json({ success: false, error: '标题不能为空' }, { status: 400 });
    }
    const priceNum = typeof newProductData.price === 'number' 
      ? newProductData.price 
      : parseFloat(String(newProductData.price || '').replace(/[^\d.]/g, ''));
    if (isNaN(priceNum) || priceNum <= 0) {
      return NextResponse.json({ success: false, error: '价格必须大于0' }, { status: 400 });
    }
    
    const priceStr = typeof newProductData.price === 'number' 
      ? `¥ ${newProductData.price}` 
      : (String(newProductData.price || '').trim().startsWith('¥') ? String(newProductData.price).trim() : `¥ ${String(newProductData.price || '').trim()}`) || `¥ ${priceNum}`;
    
    const product = await products.create({
      title: String(newProductData.title).trim(),
      price: priceStr,
      description: newProductData.description ?? null,
      category: newProductData.category || '其他',
      condition: newProductData.condition || '全新',
      location: newProductData.location || null,
      imageColor: newProductData.imageColor ?? 'bg-purple-100',
      imageData: newProductData.imageData ?? newProductData.images?.[0] ?? null,
      images: newProductData.images ?? [],
      specs: newProductData.specs ?? null,
      sellerId
    });

    return NextResponse.json({ success: true, product });
  } catch (error: any) {
    logger.error('保存数据失败:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || '保存失败' 
    }, { status: 500 });
  }
}
