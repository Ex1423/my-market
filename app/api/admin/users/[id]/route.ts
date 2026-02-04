import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import crypto from 'crypto';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Auth Check
    const cookieStore = await cookies();
    const currentUserId = cookieStore.get('userId')?.value;

    if (!currentUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: currentUserId }
    });

    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get Data
    const body = await request.json();
    const { username, password, role, phone, avatar, notificationSound } = body;

    // Validate
    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    // Check unique username if changed
    const existingUser = await prisma.user.findUnique({
      where: { username }
    });
    if (existingUser && existingUser.id !== id) {
      return NextResponse.json({ error: 'Username already taken' }, { status: 400 });
    }

    // Prepare Update Data
    const updateData: any = {
      username,
      role,
      phone,
      avatar,
      notificationSound
    };

    // Hash password if provided
    if (password) {
      const salt = crypto.randomBytes(16).toString('hex');
      const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
      updateData.password = `${salt}:${hash}`;
    }

    // Update
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = updatedUser;

    return NextResponse.json(userWithoutPassword);

  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Auth Check
    const cookieStore = await cookies();
    const currentUserId = cookieStore.get('userId')?.value;

    if (!currentUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: currentUserId }
    });

    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // Prevent deleting self
    if (id === currentUserId) {
        return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 });
    }

    await prisma.user.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
