import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { withRateLimit } from '@/lib/withRateLimit';
import { seedCategories } from '@/lib/seedCategories';

export const POST = withRateLimit(async function (req: NextRequest) {
  try {
    const { name, email, password } = await req.json();

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Please enter both email and password' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already in use' },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user with default settings
    const user = await prisma.user.create({
      data: {
        email,
        name: name || null,
        passwordHash,
        settings: {
          create: {
            theme: 'dark',
            currency: 'USD',
            safeThreshold: null,
            tightThreshold: null,
            enableWarnings: true,
            warningThreshold: null,
            defaultPaymentMethod: null,
          },
        },
      },
    });

    // Seed default categories for new user
    await seedCategories(user.id);

    return NextResponse.json(
      {
        user: { id: user.id, email: user.email, name: user.name },
        message: 'Account created successfully!',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'We couldn\'t create your account. Please try again.' },
      { status: 500 }
    );
  }
});
