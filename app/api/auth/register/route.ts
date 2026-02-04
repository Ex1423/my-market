import { NextResponse } from 'next/server';
import { users } from '@/lib/db';
import { validate, registerSchema } from '@/lib/validation';
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
    const validation = validate(registerSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { username, password } = validation.data as { username: string; password: string };

    // 额外验证：用户名长度和格式
    if (username.length < 3 || username.length > 20) {
      return NextResponse.json({ error: '用户名长度必须在3-20个字符之间' }, { status: 400 });
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return NextResponse.json({ error: '用户名只能包含字母、数字和下划线' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: '密码长度至少6位' }, { status: 400 });
    }

    // 检查用户是否已存在
    const existingUser = await users.find(username);
    if (existingUser) {
      return NextResponse.json({ error: '用户名已存在' }, { status: 409 });
    }

    // 创建新用户
    const newUser = await users.create({ username, password });

    // 返回除了密码之外的信息
    const { password: _, ...userWithoutPassword } = newUser;

    return NextResponse.json({ success: true, user: userWithoutPassword });
  } catch (error) {
    logger.error('注册失败:', error);
    const message = error instanceof Error ? error.message : '服务器错误';
    return NextResponse.json(
      { error: process.env.NODE_ENV === 'development' ? message : '服务器错误' },
      { status: 500 }
    );
  }
}
