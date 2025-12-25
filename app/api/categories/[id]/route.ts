import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { authConfig } from '@/auth.config';
import { withRateLimit } from '@/lib/withRateLimit';

/**
 * PATCH /api/categories/[id]
 * Update an existing category
 * Only the user who created the category can update it
 */
export const PATCH = withRateLimit(async function (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Please sign in to continue' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const data = await req.json();

    // Verify ownership
    const existingCategory = await prisma.category.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existingCategory) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    // Validate and prepare update data
    const updateData: any = {};

    if (data.name !== undefined) {
      // Check for duplicate category name per type
      const duplicate = await prisma.category.findFirst({
        where: {
          userId: session.user.id,
          name: data.name,
          type: existingCategory.type,
          NOT: { id }, // Exclude current category
        },
      });

      if (duplicate) {
        return NextResponse.json(
          { error: 'Category with this name already exists for this type' },
          { status: 400 }
        );
      }

      updateData.name = data.name;
    }

    if (data.parentGroup !== undefined) {
      if (!data.parentGroup.trim()) {
        return NextResponse.json(
          { error: 'Group name cannot be empty' },
          { status: 400 }
        );
      }
      updateData.parentGroup = data.parentGroup;
    }

    if (data.colorTag !== undefined) {
      updateData.colorTag = data.colorTag;
    }

    if (data.icon !== undefined) {
      updateData.icon = data.icon;
    }

    if (data.order !== undefined) {
      if (typeof data.order !== 'number' || data.order < 0) {
        return NextResponse.json(
          { error: 'Order must be a non-negative number' },
          { status: 400 }
        );
      }
      updateData.order = data.order;
    }

    if (data.monthlyBudget !== undefined) {
      updateData.monthlyBudget = data.monthlyBudget === null ? null : parseFloat(data.monthlyBudget);
    }

    if (data.budgetPeriod !== undefined) {
      updateData.budgetPeriod = data.budgetPeriod;
    }

    // Update category
    const category = await prisma.category.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ category });
  } catch (error) {
    console.error('Error updating category:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to update category', details: errorMessage },
      { status: 500 }
    );
  }
});

/**
 * DELETE /api/categories/[id]
 * Delete a category
 * Only the user who created the category can delete it
 * Sets all transactions with this category to null
 */
export const DELETE = withRateLimit(async function (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Please sign in to continue' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Verify ownership before deleting
    const category = await prisma.category.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    // Delete the category
    // The schema has onDelete: SetNull for categoryId, so transactions will retain categoryId as null
    await prisma.category.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting category:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to delete category', details: errorMessage },
      { status: 500 }
    );
  }
});
