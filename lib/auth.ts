import { cookies } from 'next/headers';
import { prisma } from './prisma';
import { NextResponse } from 'next/server';

export interface AuthResult {
  success: boolean;
  userId?: string;
  user?: any;
  error?: string;
}

export interface AdminResult {
  success: boolean;
  userId?: string;
  user?: any;
  error?: string;
}

/**
 * 验证用户身份（从 cookie 中获取 userId）
 */
export async function verifyAuth(request: Request | null = null): Promise<AuthResult> {
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;

  if (!userId) {
    return { success: false, error: 'Unauthorized' };
  }

  // Optionally verify user exists in DB if critical
  // For performance, we might skip this for every request if we trust the cookie strategy
  // But strictly speaking, we should check.
  
  return { success: true, userId };
}

/**
 * 验证管理员身份
 */
export async function verifyAdmin(): Promise<AdminResult> {
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;

  if (!userId) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, username: true }
    });

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    if (user.role !== 'admin') {
      return { success: false, error: 'Forbidden: Admin access required' };
    }

    return { success: true, userId: user.id, user };
  } catch (error) {
    return { success: false, error: 'Database error' };
  }
}

/**
 * 获取当前登录用户信息
 */
export async function getCurrentUser() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;
  
  if (!userId) return null;
  
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    if (user) {
      const { password, ...rest } = user;
      return rest;
    }
  } catch (e) {
    console.error(e);
  }
  return null;
}

/**
 * 身份验证中间件 - 用于 API 路由
 * 如果验证失败，返回错误响应；否则返回 null（继续执行）
 */
export async function requireAuth(): Promise<NextResponse | null> {
  const authResult = await verifyAuth();
  if (!authResult.success || !authResult.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}

/**
 * 管理员身份验证中间件 - 用于需要管理员权限的 API 路由
 * 如果验证失败，返回错误响应；否则返回 null（继续执行）
 */
export async function requireAdmin(): Promise<NextResponse | null> {
  const adminResult = await verifyAdmin();
  if (!adminResult.success) {
    const status = adminResult.error?.includes('Forbidden') ? 403 : 401;
    return NextResponse.json({ error: adminResult.error || 'Unauthorized' }, { status });
  }
  return null;
}
