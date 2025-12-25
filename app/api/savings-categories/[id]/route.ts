import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { authConfig } from '@/auth.config';
import { withRateLimit } from '@/lib/withRateLimit';

/**
 * PATCH /api/savings-categories/[id]
 * Update a savings category
 * Optional fields: name, description, targetAmount, currentBalance, order
 */
export const PATCH = withRateLimit(async function (req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    // Verify the category belongs to the user
    const category = await prisma.savingsCategory.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!category) {
      return NextResponse.json(
        { error: 'Savings category not found' },
        { status: 404 }
      );
    }

    // Build update data
    const updateData: any = {};

    if (data.name !== undefined) {
      if (!data.name.trim()) {
        return NextResponse.json(
          { error: 'Category name cannot be empty' },
          { status: 400 }
        );
      }

      // Check for duplicate name (excluding self)
      const existingCategory = await prisma.savingsCategory.findFirst({
        where: {
          userId: session.user.id,
          name: data.name.trim(),
          id: { not: id },
        },
      });

      if (existingCategory) {
        return NextResponse.json(
          { error: 'A savings category with this name already exists' },
          { status: 400 }
        );
      }

      updateData.name = data.name.trim();
    }

    if (data.description !== undefined) {
      updateData.description = data.description || '';
    }

    if (data.targetAmount !== undefined) {
      if (data.targetAmount !== null) {
        const targetAmount = parseFloat(data.targetAmount);
        if (isNaN(targetAmount) || targetAmount < 0) {
          return NextResponse.json(
            { error: 'Target amount must be a non-negative number' },
            { status: 400 }
          );
        }
        updateData.targetAmount = targetAmount;
      } else {
        updateData.targetAmount = null;
      }
    }

    if (data.currentBalance !== undefined) {
      const currentBalance = parseFloat(data.currentBalance);
      if (isNaN(currentBalance) || currentBalance < 0) {
        return NextResponse.json(
          { error: 'Current balance must be a non-negative number' },
          { status: 400 }
        );
      }
      updateData.currentBalance = currentBalance;
    }

    if (data.order !== undefined) {
      if (!Number.isInteger(data.order) || data.order < 0) {
        return NextResponse.json(
          { error: 'Order must be a non-negative integer' },
          { status: 400 }
        );
      }
      updateData.order = data.order;
    }

    // Update the category
    const updatedCategory = await prisma.savingsCategory.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ category: updatedCategory });
  } catch (error) {
    console.error('Error updating savings category:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to update savings category', details: errorMessage },
      { status: 500 }
    );
  }
});

/**
 * DELETE /api/savings-categories/[id]
 * Delete a savings category
 */
export const DELETE = withRateLimit(async function (_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Please sign in to continue' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Verify the category belongs to the user
    const category = await prisma.savingsCategory.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!category) {
      return NextResponse.json(
        { error: 'Savings category not found' },
        { status: 404 }
      );
    }

    // Delete the category
    await prisma.savingsCategory.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting savings category:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to delete savings category', details: errorMessage },
      { status: 500 }
    );
  }
});
