import { NextResponse } from 'next/server';
import { users } from '@/lib/db';
import { cookies } from 'next/headers';
import { validate, loginSchema } from '@/lib/validation';
import { logger } from '@/lib/logger';

export async function POST(request: Request) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: '请求格式错误' }, { status: 400 });
    }

    // 使用验证（支持 Zod 或基本验证）
    const validation = validate(loginSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { username, password } = validation.data as { username: string; password: string };

    // 基本验证
    if (!username || username.trim().length === 0) {
      return NextResponse.json({ error: '用户名不能为空' }, { status: 400 });
    }
    if (!password || password.length === 0) {
      return NextResponse.json({ error: '密码不能为空' }, { status: 400 });
    }

    // 查找用户
    const user = await users.find(username);
    if (!user) {
      return NextResponse.json({ error: '用户名或密码错误' }, { status: 401 });
    }

    // 验证密码（防止 password 格式异常导致抛错）
    if (!user.password || typeof user.password !== 'string') {
      logger.error('用户密码数据异常:', user.id);
      return NextResponse.json({ error: '用户名或密码错误' }, { status: 401 });
    }
    let isValid: boolean;
    try {
      isValid = users.validatePassword(user, password);
    } catch (e) {
      logger.error('验证密码异常:', e);
      return NextResponse.json({ error: '用户名或密码错误' }, { status: 401 });
    }
    if (!isValid) {
      return NextResponse.json({ error: '用户名或密码错误' }, { status: 401 });
    }

    // 设置 Cookie (模拟 Session)
    const cookieStore = await cookies();
    cookieStore.set('userId', user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 天
      sameSite: 'lax',
    });

    const { password: _, ...userWithoutPassword } = user;
    return NextResponse.json({ success: true, user: userWithoutPassword });
  } catch (error) {
    logger.error('登录失败:', error);
    const message = error instanceof Error ? error.message : '服务器错误';
    return NextResponse.json(
      { error: process.env.NODE_ENV === 'development' ? message : '服务器错误' },
      { status: 500 }
    );
  }
}
