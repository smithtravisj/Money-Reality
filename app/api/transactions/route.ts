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
      include: { category: true },
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
    if (!data.type || !data.amount || !data.date) {
      return NextResponse.json(
        { error: 'Missing required fields: type, amount, date' },
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
        categoryId: data.categoryId || null,
        merchant: data.merchant || null,
        paymentMethod: data.paymentMethod || null,
        notes: data.notes || '',
      },
      include: { category: true },
    });

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
