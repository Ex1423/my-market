import crypto from 'crypto';
import { prisma } from './prisma';

export { prisma };

// 确保管理员账号存在
async function ensureAdmin() {
  const admin = await prisma.user.findUnique({
    where: { username: 'admin' }
  });

  if (!admin) {
    const adminSalt = crypto.randomBytes(16).toString('hex');
    const adminHash = crypto.pbkdf2Sync('admin123', adminSalt, 1000, 64, 'sha512').toString('hex');
    
    await prisma.user.create({
      data: {
        username: 'admin',
        password: `${adminSalt}:${adminHash}`,
        role: 'admin'
      }
    });
    console.log('Admin user created');
  }
}

// 初始化数据库
ensureAdmin().catch(console.error);

// 用户相关操作 (适配 Prisma)
export const users = {
  getAll: async () => await prisma.user.findMany(),
  find: async (username: string) => await prisma.user.findUnique({ where: { username } }),
  findById: async (id: string) => await prisma.user.findUnique({ where: { id } }),
  findBySupabaseId: async (supabaseId: string) =>
    await prisma.user.findUnique({ where: { supabaseId } }),
  create: async (user: any) => {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(user.password, salt, 1000, 64, 'sha512').toString('hex');

    return await prisma.user.create({
      data: {
        username: user.username,
        password: `${salt}:${hash}`,
        role: user.role || 'user',
        supabaseId: user.supabaseId ?? undefined,
      }
    });
  },
  // 根据 Supabase 用户查找或创建 Prisma 用户（用于发布商品等）
  findOrCreateBySupabase: async (supabaseUser: { id: string; email?: string; user_metadata?: { username?: string } }) => {
    let u = await prisma.user.findUnique({ where: { supabaseId: supabaseUser.id } });
    if (u) return u;
    const username = supabaseUser.user_metadata?.username || supabaseUser.email?.split('@')[0] || `user_${supabaseUser.id.slice(0, 8)}`;
    const uniqueUsername = await (async () => {
      let base = username.replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 20);
      let candidate = base;
      let n = 0;
      while (await prisma.user.findUnique({ where: { username: candidate } })) {
        candidate = `${base}_${++n}`;
      }
      return candidate;
    })();
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(crypto.randomBytes(32).toString('hex'), salt, 1000, 64, 'sha512').toString('hex');
    u = await prisma.user.create({
      data: {
        username: uniqueUsername,
        password: `${salt}:${hash}`,
        role: 'user',
        supabaseId: supabaseUser.id,
      }
    });
    return u;
  },
  validatePassword: (user: any, inputPassword: string) => {
    const [salt, originalHash] = user.password.split(':');
    const hash = crypto.pbkdf2Sync(inputPassword, salt, 1000, 64, 'sha512').toString('hex');
    return hash === originalHash;
  }
};

// 商品相关操作 (适配 Prisma)
export const products = {
  getAll: async () => {
    const products = await prisma.product.findMany({ 
      orderBy: { publishDate: 'desc' },
      include: { seller: { select: { username: true, id: true } } } // Include seller info
    });
    return products.map(p => {
      let parsedSpecs = [];
      try {
        const parsed = p.specs ? JSON.parse(p.specs) : [];
        parsedSpecs = Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        console.error('Failed to parse specs for product ' + p.id, e);
      }
      return { ...p, specs: parsedSpecs };
    });
  },
  getById: async (id: string) => {
    const product = await prisma.product.findUnique({
      where: { id },
      include: { 
        seller: { select: { username: true, id: true, createdAt: true } },
        images: true 
      }
    });
    if (!product) return null;
    
    let parsedSpecs = [];
    try {
      const parsed = product.specs ? JSON.parse(product.specs) : [];
      parsedSpecs = Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error('Failed to parse specs for product ' + id, e);
    }
    return { ...product, specs: parsedSpecs };
  },
  create: async (product: any) => {
    // 提取 images 数组（如果存在）
    const { images, ...productData } = product;
    
    // 如果没有 images 数组，但有 imageData (兼容旧逻辑)，则创建单图
    // 如果有 images 数组，则创建多图
    
    const imageDataToUse = images && images.length > 0 ? images[0] : product.imageData;
    
    // Ensure specs is stringified if it is an object
    const specsStr = typeof productData.specs === 'object' ? JSON.stringify(productData.specs) : productData.specs;
    
    const createdProduct = await prisma.product.create({
      data: {
        title: productData.title,
        price: productData.price,
        description: productData.description,
        imageColor: productData.imageColor,
        category: productData.category,
        imageData: imageDataToUse, // 主图
        condition: productData.condition || '全新',
        location: productData.location,
        specs: specsStr, // 新增规格参数
        seller: {
          connect: { id: productData.sellerId }
        },
        images: {
          create: images && images.length > 0 
            ? images.map((url: string) => ({ url }))
            : imageDataToUse ? [{ url: imageDataToUse }] : []
        }
      },
      include: { images: true }
    });

    // Return with parsed specs
    let parsedSpecs = [];
    try {
        const parsed = createdProduct.specs ? JSON.parse(createdProduct.specs) : [];
        parsedSpecs = Array.isArray(parsed) ? parsed : [];
    } catch (e) {
        // ignore
    }
    
    return { ...createdProduct, specs: parsedSpecs };
  },
  update: async (id: string, sellerId: string, data: any) => {
    const existing = await prisma.product.findUnique({
      where: { id },
      include: { images: true }
    });
    if (!existing) return null;
    if (existing.sellerId !== sellerId) return null;

    const { images, ...productData } = data;
    const imageDataToUse = images && images.length > 0 ? images[0] : productData.imageData ?? existing.imageData;
    const specsStr = typeof productData.specs === 'object' ? JSON.stringify(productData.specs) : (productData.specs ?? existing.specs);

    await prisma.productImage.deleteMany({ where: { productId: id } });

    const updated = await prisma.product.update({
      where: { id },
      data: {
        title: productData.title ?? existing.title,
        price: productData.price ?? existing.price,
        description: productData.description ?? existing.description,
        imageColor: productData.imageColor ?? existing.imageColor,
        category: productData.category ?? existing.category,
        imageData: imageDataToUse,
        condition: productData.condition ?? existing.condition,
        location: productData.location ?? existing.location,
        specs: specsStr,
        images: {
          create: images && images.length > 0
            ? images.map((url: string) => ({ url }))
            : imageDataToUse ? [{ url: imageDataToUse }] : []
        }
      },
      include: { images: true }
    });

    let parsedSpecs: any[] = [];
    try {
      const parsed = updated.specs ? JSON.parse(updated.specs) : [];
      parsedSpecs = Array.isArray(parsed) ? parsed : [];
    } catch (e) { /* ignore */ }
    return { ...updated, specs: parsedSpecs };
  }
};
