import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { authConfig } from '@/auth.config';
import { withRateLimit } from '@/lib/withRateLimit';

/**
 * PATCH /api/transactions/[id]
 * Update an existing transaction
 * Only the user who created the transaction can update it
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
    const existingTransaction = await prisma.transaction.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existingTransaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    // Validate and prepare update data
    const updateData: any = {};

    if (data.type !== undefined) {
      if (!['expense', 'income'].includes(data.type)) {
        return NextResponse.json(
          { error: 'Type must be either "expense" or "income"' },
          { status: 400 }
        );
      }
      updateData.type = data.type;
    }

    if (data.amount !== undefined) {
      const amount = parseFloat(data.amount);
      if (isNaN(amount) || amount <= 0) {
        return NextResponse.json(
          { error: 'Amount must be a positive number' },
          { status: 400 }
        );
      }
      updateData.amount = amount;
    }

    if (data.date !== undefined) {
      try {
        const transactionDate = new Date(data.date);
        if (isNaN(transactionDate.getTime())) {
          throw new Error('Invalid date');
        }
        updateData.date = transactionDate;
      } catch {
        return NextResponse.json(
          { error: 'Invalid date format' },
          { status: 400 }
        );
      }
    }

    if (data.categoryId !== undefined) {
      if (data.categoryId === null) {
        updateData.categoryId = null;
      } else {
        const category = await prisma.category.findFirst({
          where: {
            id: data.categoryId,
            userId: session.user.id,
          },
        });

        if (!category) {
          return NextResponse.json(
            { error: 'Category not found' },
            { status: 404 }
          );
        }

        // Use the type from the update or existing transaction
        const transactionType = updateData.type || existingTransaction.type;
        if (category.type !== transactionType) {
          return NextResponse.json(
            { error: `Category type must be "${transactionType}"` },
            { status: 400 }
          );
        }

        updateData.categoryId = data.categoryId;
      }
    }

    if (data.merchant !== undefined) {
      updateData.merchant = data.merchant;
    }

    if (data.paymentMethod !== undefined) {
      updateData.paymentMethod = data.paymentMethod;
    }

    if (data.notes !== undefined) {
      updateData.notes = data.notes;
    }

    // Update transaction
    const transaction = await prisma.transaction.update({
      where: { id },
      data: updateData,
      include: { category: true },
    });

    return NextResponse.json({ transaction });
  } catch (error) {
    console.error('Error updating transaction:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to update transaction', details: errorMessage },
      { status: 500 }
    );
  }
});

/**
 * DELETE /api/transactions/[id]
 * Delete a transaction
 * Only the user who created the transaction can delete it
 * Also reverses any income allocations to savings categories
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
    const transaction = await prisma.transaction.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    // Reverse allocations if this was an income transaction with allocations
    if (transaction.type === 'income' && transaction.allocations && transaction.allocations !== '[]') {
      try {
        const allocations = JSON.parse(transaction.allocations);
        await reverseIncomeAllocations(allocations, transaction.amount, session.user.id);
      } catch (error) {
        console.warn('Failed to reverse allocations:', error);
        // Continue with deletion even if allocation reversal fails
      }
    }

    // Delete the transaction
    await prisma.transaction.delete({
      where: { id },
    });

    // Recalculate account balance after deletion
    await updateAccountBalance(transaction.accountId, session.user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to delete transaction', details: errorMessage },
      { status: 500 }
    );
  }
});

/**
 * Helper function to reverse income allocations to savings categories
 */
async function reverseIncomeAllocations(
  allocations: Array<{ categoryId: string; amount: number; isPercentage: boolean }>,
  totalIncome: number,
  userId: string
) {
  for (const allocation of allocations) {
    if (allocation.amount <= 0) continue;

    // Calculate actual amount that was allocated
    const actualAmount = allocation.isPercentage
      ? (totalIncome * allocation.amount) / 100
      : allocation.amount;

    if (actualAmount <= 0) continue;

    // Verify savings category belongs to user
    const savingsCategory = await prisma.savingsCategory.findFirst({
      where: {
        id: allocation.categoryId,
        userId,
      },
    });

    if (!savingsCategory) {
      console.warn(`Savings category ${allocation.categoryId} not found for user ${userId}`);
      continue;
    }

    // Subtract from savings category balance
    await prisma.savingsCategory.update({
      where: { id: allocation.categoryId },
      data: {
        currentBalance: {
          decrement: actualAmount,
        },
      },
    });
  }
}

/**
 * Helper function to recalculate and update account balance
 */
async function updateAccountBalance(accountId: string, userId: string) {
  const transactions = await prisma.transaction.findMany({
    where: { accountId, userId },
  });

  const balance = transactions.reduce((acc, t) => {
    return acc + (t.type === 'income' ? t.amount : -t.amount);
  }, 0);

  await prisma.account.update({
    where: { id: accountId },
    data: { currentBalance: balance },
  });
}
