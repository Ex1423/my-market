import { NextResponse } from 'next/server';
import { users } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: '用户名和密码必填' }, { status: 400 });
    }

    // 检查用户是否已存在
    const existingUser = users.find(username);
    if (existingUser) {
      return NextResponse.json({ error: '用户名已存在' }, { status: 409 });
    }

    // 创建新用户
    const newUser = users.create({ username, password });

    // 返回除了密码之外的信息
    const { password: _, ...userWithoutPassword } = newUser;

    return NextResponse.json({ success: true, user: userWithoutPassword });
  } catch (error) {
    console.error('注册失败:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
