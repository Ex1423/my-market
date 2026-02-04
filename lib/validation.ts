/**
 * 输入验证工具
 * 使用 Zod 进行数据验证
 */

// 注意：需要先运行 npm install zod
// 如果未安装，这里会报错，提示用户安装

let z: any;
try {
  // 尝试使用 ES6 import（Next.js 环境）
  z = require('zod');
  // 如果 require 失败，尝试动态 import
  if (!z) {
    import('zod').then((zodModule) => {
      z = zodModule.default || zodModule;
    }).catch(() => {
      console.warn('Zod 未安装，请运行: npm install zod');
    });
  }
} catch (error) {
  console.warn('Zod 未安装，请运行: npm install zod');
}

/**
 * 常用验证 Schema
 */
export const schemas = {
  // 用户相关
  username: z?.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/, '用户名只能包含字母、数字和下划线'),
  password: z?.string().min(6, '密码至少6位'),
  
  // 商品相关
  productTitle: z?.string().min(1).max(200),
  productPrice: z?.number().positive('价格必须大于0'),
  productDescription: z?.string().max(5000).optional(),
  
  // 分类相关
  categoryName: z?.string().min(1).max(100),
  categoryLevel: z?.number().int().min(1).max(3),
  
  // 通用
  id: z?.string().min(1, 'ID不能为空'),
  email: z?.string().email('无效的邮箱格式').optional(),
  url: z?.string().url('无效的URL格式').optional(),
};

/**
 * 注册请求验证
 */
export const registerSchema = z?.object({
  username: schemas.username,
  password: schemas.password,
});

/**
 * 登录请求验证
 */
export const loginSchema = z?.object({
  username: z?.string().min(1, '用户名不能为空'),
  password: z?.string().min(1, '密码不能为空'),
});

/**
 * 创建商品验证
 */
export const createProductSchema = z?.object({
  title: schemas.productTitle,
  price: schemas.productPrice,
  description: schemas.productDescription,
  category: z?.string().min(1),
  condition: z?.string().optional(),
  location: z?.string().optional(),
  imageData: z?.string().optional(),
  images: z?.array(z?.string()).optional(),
  specs: z?.any().optional(),
});

/**
 * 更新分类验证
 */
export const updateCategorySchema = z?.object({
  name: schemas.categoryName.optional(),
  description: z?.string().max(500).optional(),
  keywords: z?.string().max(200).optional(),
});

/**
 * 创建分类验证
 */
export const createCategorySchema = z?.object({
  name: schemas.categoryName,
  level: schemas.categoryLevel,
  parentId: z?.string().optional().nullable(),
  description: z?.string().max(500).optional(),
  keywords: z?.string().max(200).optional(),
});

/**
 * 添加到购物车验证
 */
export const addToCartSchema = z?.object({
  productId: z?.string().min(1, '无效的商品ID'),
  quantity: z?.number().int().positive('数量必须大于0').default(1),
});

/**
 * 更新购物车商品数量验证
 */
export const updateCartItemSchema = z?.object({
  quantity: z?.number().int().min(1, '数量必须大于0'),
});

/**
 * 添加收藏验证
 */
export const addFavoriteSchema = z?.object({
  productId: z?.string().min(1, '无效的商品ID'),
  category: z?.string().max(50).optional(),
});

/**
 * 验证函数包装器
 * 用于 API 路由中统一处理验证错误
 */
export function validate<T>(schema: any, data: unknown): { success: true; data: T } | { success: false; error: string } {
  // 如果 Zod 未安装，使用基本验证
  if (!z || !schema) {
    // 基本验证：检查必需字段
    if (typeof data !== 'object' || data === null) {
      return { success: false, error: '请求数据格式错误' };
    }
    const obj = data as Record<string, any>;
    
    // 对于登录和注册，至少需要 username 和 password
    if (!obj.username || typeof obj.username !== 'string' || obj.username.trim().length === 0) {
      return { success: false, error: '用户名不能为空' };
    }
    if (!obj.password || typeof obj.password !== 'string' || obj.password.length === 0) {
      return { success: false, error: '密码不能为空' };
    }
    
    // 基本验证通过，返回数据
    return { success: true, data: obj as T };
  }

  try {
    const result = schema.parse(data);
    return { success: true, data: result as T };
  } catch (error: any) {
    if (error.errors && error.errors.length > 0) {
      const firstError = error.errors[0];
      return { success: false, error: firstError.message || '验证失败' };
    }
    return { success: false, error: error.message || '验证失败' };
  }
}
