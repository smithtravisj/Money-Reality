import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { authConfig } from '@/auth.config';
import { withRateLimit } from '@/lib/withRateLimit';

/**
 * GET /api/transactions
 * Fetch all transactions for the authenticated user
 * Sorted by date (newest first)
 * Includes category details
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

    const transactions = await prisma.transaction.findMany({
      where: { userId: session.user.id },
      include: {
        category: true,
        account: true,
      },
      orderBy: { date: 'desc' },
    });

    return NextResponse.json({ transactions });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      {
        error: 'We couldn\'t load your transactions. Please check your connection and try again.',
      },
      { status: 500 }
    );
  }
});

/**
 * POST /api/transactions
 * Create a new transaction (expense or income)
 * Required fields: type, amount, date
 * Optional fields: categoryId, merchant, paymentMethod, notes
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
    if (!data.type || !data.amount || !data.date || !data.accountId) {
      return NextResponse.json(
        { error: 'Missing required fields: type, amount, date, accountId' },
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

    // Validate amount
    const amount = parseFloat(data.amount);
    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be a positive number' },
        { status: 400 }
      );
    }

    // Validate date
    let transactionDate: Date;
    try {
      transactionDate = new Date(data.date);
      if (isNaN(transactionDate.getTime())) {
        throw new Error('Invalid date');
      }
    } catch {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      );
    }

    // Validate account (REQUIRED)
    const account = await prisma.account.findFirst({
      where: {
        id: data.accountId,
        userId: session.user.id,
      },
    });

    if (!account) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }

    // Validate category if provided
    if (data.categoryId) {
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

      // Verify category type matches transaction type
      if (category.type !== data.type) {
        return NextResponse.json(
          { error: `Category type must be "${data.type}"` },
          { status: 400 }
        );
      }
    }

    // Create transaction
    const transaction = await prisma.transaction.create({
      data: {
        userId: session.user.id,
        type: data.type,
        amount,
        date: transactionDate,
        accountId: data.accountId,
        categoryId: data.categoryId || null,
        merchant: data.merchant || null,
        paymentMethod: data.paymentMethod || null,
        notes: data.notes || '',
        allocations: data.allocations ? JSON.stringify(data.allocations) : '[]',
      },
      include: {
        category: true,
        account: true,
      },
    });

    // Update account balance
    await updateAccountBalance(data.accountId, session.user.id);

    // Process income allocations if provided
    if (data.type === 'income' && data.allocations && Array.isArray(data.allocations)) {
      await processIncomeAllocations(data.allocations, amount, session.user.id);
    }

    return NextResponse.json({ transaction }, { status: 201 });
  } catch (error) {
    console.error('Error creating transaction:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to create transaction', details: errorMessage },
      { status: 500 }
    );
  }
});

/**
 * Helper function to process income allocations to savings categories
 */
async function processIncomeAllocations(
  allocations: Array<{ categoryId: string; amount: number; isPercentage: boolean }>,
  totalIncome: number,
  userId: string
) {
  for (const allocation of allocations) {
    if (allocation.amount <= 0) continue;

    // Calculate actual amount to allocate
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

    // Update savings category balance
    await prisma.savingsCategory.update({
      where: { id: allocation.categoryId },
      data: {
        currentBalance: {
          increment: actualAmount,
        },
      },
    });
  }
}

/**
 * Helper function to recalculate and update account balance
 * Ensures account has an initial transaction for proper balance tracking
 */
async function updateAccountBalance(accountId: string, userId: string) {
  const account = await prisma.account.findFirst({
    where: { id: accountId, userId },
  });

  if (!account) return;

  const transactions = await prisma.transaction.findMany({
    where: { accountId, userId },
    orderBy: { createdAt: 'asc' },
  });

  // Check if account has an "Initial account balance" transaction
  const hasInitialTransaction = transactions.some(
    t => t.notes === 'Initial account balance'
  );

  // If account has transactions but no initial transaction, and currentBalance > 0,
  // create an initial transaction to ensure proper balance tracking
  if (!hasInitialTransaction && transactions.length > 0 && account.currentBalance > 0) {
    const nonInitialBalance = transactions.reduce((acc, t) => {
      return acc + (t.type === 'income' ? t.amount : -t.amount);
    }, 0);

    // If there's a discrepancy, the account likely had an initial balance that wasn't tracked
    if (account.currentBalance !== nonInitialBalance) {
      const initialBalance = account.currentBalance - nonInitialBalance;
      if (initialBalance > 0) {
        await prisma.transaction.create({
          data: {
            userId,
            type: 'income',
            amount: initialBalance,
            date: new Date(0), // Epoch start to ensure it's first chronologically
            accountId,
            notes: 'Initial account balance',
            allocations: '[]',
          },
        });

        // Refetch transactions after creating initial transaction
        const updatedTransactions = await prisma.transaction.findMany({
          where: { accountId, userId },
        });

        const balance = updatedTransactions.reduce((acc, t) => {
          return acc + (t.type === 'income' ? t.amount : -t.amount);
        }, 0);

        await prisma.account.update({
          where: { id: accountId },
          data: { currentBalance: balance },
        });

        return;
      }
    }
  }

  // Standard balance recalculation
  const balance = transactions.reduce((acc, t) => {
    return acc + (t.type === 'income' ? t.amount : -t.amount);
  }, 0);

  await prisma.account.update({
    where: { id: accountId },
    data: { currentBalance: balance },
  });
}
