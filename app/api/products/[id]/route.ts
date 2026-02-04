import { NextResponse } from 'next/server';
import { products } from '@/lib/db';
import { requireAuth, verifyAuth } from '@/lib/auth';
import { logger } from '@/lib/logger';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const product = await products.getById(id);
    if (!product) {
      return NextResponse.json({ error: '商品不存在' }, { status: 404 });
    }
    const imageList = product.images?.length ? product.images.map((img: any) => img.url) : (product.imageData ? [product.imageData] : []);
    return NextResponse.json({ ...product, images: imageList });
  } catch (error: any) {
    logger.error('获取商品失败:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authError = await requireAuth();
    if (authError) return authError;

    const authResult = await verifyAuth(request);
    if (!authResult.success || !authResult.userId) {
      return NextResponse.json({ success: false, error: '请先登录' }, { status: 401 });
    }

    const { id } = await params;
    const newProductData = await request.json();

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

    const updated = await products.update(id, authResult.userId, {
      title: String(newProductData.title).trim(),
      price: priceStr,
      description: newProductData.description ?? null,
      category: newProductData.category || '其他',
      condition: newProductData.condition || '全新',
      location: newProductData.location || null,
      imageColor: newProductData.imageColor ?? 'bg-purple-100',
      imageData: newProductData.imageData ?? newProductData.images?.[0] ?? null,
      images: newProductData.images ?? [],
      specs: newProductData.specs ?? null
    });

    if (!updated) {
      return NextResponse.json({ success: false, error: '商品不存在或无权编辑' }, { status: 404 });
    }

    return NextResponse.json({ success: true, product: updated });
  } catch (error: any) {
    logger.error('更新商品失败:', error);
    return NextResponse.json({ success: false, error: error.message || '更新失败' }, { status: 500 });
  }
}
