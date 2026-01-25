import { NextResponse } from 'next/server';
import { users } from '@/lib/db';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const currentUserId = cookieStore.get('userId')?.value;

    if (!currentUserId) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const currentUser = users.findById(currentUserId);
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json({ error: '无权限' }, { status: 403 });
    }

    const allUsers = users.getAll().map((u: any) => {
      const { password, ...userWithoutPassword } = u;
      return userWithoutPassword;
    });

    return NextResponse.json(allUsers);
  } catch (error) {
    console.error('获取用户列表失败:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
