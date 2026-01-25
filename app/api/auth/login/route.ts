import { NextResponse } from 'next/server';
import { users } from '@/lib/db';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: '用户名和密码必填' }, { status: 400 });
    }

    // 查找用户
    const user = users.find(username);
    if (!user) {
      return NextResponse.json({ error: '用户名或密码错误' }, { status: 401 });
    }

    // 验证密码
    const isValid = users.validatePassword(user, password);
    if (!isValid) {
      return NextResponse.json({ error: '用户名或密码错误' }, { status: 401 });
    }

    // 设置 Cookie (模拟 Session)
    // 注意：实际生产中应该使用加密的 JWT 或 Session ID
    // 这里简单存储用户 ID
    const cookieStore = await cookies();
    cookieStore.set('userId', user.id, { 
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 7 天
    });

    const { password: _, ...userWithoutPassword } = user;
    return NextResponse.json({ success: true, user: userWithoutPassword });

  } catch (error) {
    console.error('登录失败:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
