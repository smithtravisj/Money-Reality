import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authConfig } from '@/auth.config';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authConfig);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { email } = await req.json();

    if (!email || !email.trim()) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    // Check if email already exists (excluding current user)
    const existingUser = await prisma.user.findUnique({
      where: { email: email.trim() },
    });

    if (existingUser && existingUser.id !== session.user.id) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { email: email.trim() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to update email:', error);
    return NextResponse.json({ error: 'Failed to update email' }, { status: 500 });
  }
}
