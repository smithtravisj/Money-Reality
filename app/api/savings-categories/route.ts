import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { authConfig } from '@/auth.config';
import { withRateLimit } from '@/lib/withRateLimit';

/**
 * GET /api/savings-categories
 * Fetch all savings categories for the authenticated user
 */
export const GET = withRateLimit(async function (_request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Please sign in to continue' },
        { status: 401 }
      );
    }

    const categories = await prisma.savingsCategory.findMany({
      where: { userId: session.user.id },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ categories });
  } catch (error) {
    console.error('Error fetching savings categories:', error);
    return NextResponse.json(
      { error: 'Failed to load savings categories' },
      { status: 500 }
    );
  }
});

/**
 * POST /api/savings-categories
 * Create a new savings category
 * Required fields: name
 * Optional fields: description, targetAmount
 */
export const POST = withRateLimit(async function (req: NextRequest) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Please sign in to continue' },
        { status: 401 }
      );
    }

    const data = await req.json();

    // Validate required fields
    if (!data.name || !data.name.trim()) {
      return NextResponse.json(
        { error: 'Category name is required' },
        { status: 400 }
      );
    }

    // Check for duplicate category name
    const existingCategory = await prisma.savingsCategory.findFirst({
      where: {
        userId: session.user.id,
        name: data.name.trim(),
      },
    });

    if (existingCategory) {
      return NextResponse.json(
        { error: 'A savings category with this name already exists' },
        { status: 400 }
      );
    }

    // Get the next order value
    const lastCategory = await prisma.savingsCategory.findFirst({
      where: { userId: session.user.id },
      orderBy: { order: 'desc' },
    });

    const nextOrder = (lastCategory?.order ?? -1) + 1;

    // Validate target amount if provided
    let targetAmount = null;
    if (data.targetAmount !== undefined && data.targetAmount !== null) {
      targetAmount = parseFloat(data.targetAmount);
      if (isNaN(targetAmount) || targetAmount < 0) {
        return NextResponse.json(
          { error: 'Target amount must be a non-negative number' },
          { status: 400 }
        );
      }
    }

    // Create the savings category
    const category = await prisma.savingsCategory.create({
      data: {
        userId: session.user.id,
        name: data.name.trim(),
        description: data.description || '',
        targetAmount,
        order: nextOrder,
      },
    });

    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    console.error('Error creating savings category:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to create savings category', details: errorMessage },
      { status: 500 }
    );
  }
});
