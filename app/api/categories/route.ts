import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { authConfig } from '@/auth.config';
import { withRateLimit } from '@/lib/withRateLimit';

/**
 * GET /api/categories
 * Fetch all categories for the authenticated user
 * Grouped by type (expense or income)
 * Ordered by type and order field
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

    const categories = await prisma.category.findMany({
      where: { userId: session.user.id },
      orderBy: [{ type: 'asc' }, { order: 'asc' }],
    });

    return NextResponse.json({ categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      {
        error: 'We couldn\'t load your categories. Please check your connection and try again.',
      },
      { status: 500 }
    );
  }
});

/**
 * POST /api/categories
 * Create a new category (expense or income)
 * Required fields: name, type, parentGroup
 * Optional fields: colorTag, icon
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
    if (!data.name || !data.type || !data.parentGroup) {
      return NextResponse.json(
        { error: 'Missing required fields: name, type, parentGroup' },
        { status: 400 }
      );
    }

    // Validate type
    if (!['expense', 'income'].includes(data.type)) {
      return NextResponse.json(
        { error: 'Type must be either "expense" or "income"' },
        { status: 400 }
      );
    }

    // Validate parentGroup
    const validParentGroups = ['Essentials', 'Lifestyle', 'Health', 'Personal', 'Income'];
    if (!validParentGroups.includes(data.parentGroup)) {
      return NextResponse.json(
        { error: `ParentGroup must be one of: ${validParentGroups.join(', ')}` },
        { status: 400 }
      );
    }

    // Check for duplicate category name per user per type
    const existingCategory = await prisma.category.findFirst({
      where: {
        userId: session.user.id,
        name: data.name,
        type: data.type,
      },
    });

    if (existingCategory) {
      return NextResponse.json(
        { error: 'Category with this name already exists for this type' },
        { status: 400 }
      );
    }

    // Get the next order value
    const lastCategory = await prisma.category.findFirst({
      where: {
        userId: session.user.id,
        type: data.type,
      },
      orderBy: { order: 'desc' },
    });

    const nextOrder = (lastCategory?.order ?? 0) + 1;

    // Create category
    const category = await prisma.category.create({
      data: {
        userId: session.user.id,
        name: data.name,
        type: data.type,
        parentGroup: data.parentGroup,
        colorTag: data.colorTag || null,
        icon: data.icon || null,
        order: nextOrder,
      },
    });

    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    console.error('Error creating category:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to create category', details: errorMessage },
      { status: 500 }
    );
  }
});
