import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { authConfig } from '@/auth.config';
import { getCreditCardSpendingHistory } from '@/lib/creditCardCalculations';
import { CreditCardSpendingHistoryResponse } from '@/types';

/**
 * GET /api/credit-cards/[id]/spending
 * Get spending history for a credit card
 * Returns monthly spending breakdown for the card
 */
export async function GET(
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

    // Verify ownership and that it's a credit card
    const creditCard = await prisma.account.findFirst({
      where: {
        id,
        userId: session.user.id,
        type: 'credit',
      },
    });

    if (!creditCard) {
      return NextResponse.json(
        { error: 'Credit card not found' },
        { status: 404 }
      );
    }

    // Get all transactions for the user
    const transactions = await prisma.transaction.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        date: 'desc',
      },
    });

    // Get all accounts for auto-pay lookup
    const accounts = await prisma.account.findMany({
      where: {
        userId: session.user.id,
      },
    });

    // Convert Prisma dates to ISO strings
    const transactionsWithDates = transactions.map((t) => ({
      ...t,
      date: t.date.toISOString(),
      type: t.type as 'expense' | 'income',
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    }));

    // Calculate spending history
    const spendingHistory = getCreditCardSpendingHistory(transactionsWithDates, id, 12);

    // Get current month data
    const currentMonth = spendingHistory.find((m) => m.isCurrentMonth) || spendingHistory[0];

    // Get auto-pay account
    const autoPayAccount = creditCard.autoPayAccountId
      ? accounts.find((a) => a.id === creditCard.autoPayAccountId)
      : null;

    const response: CreditCardSpendingHistoryResponse = {
      cardId: creditCard.id,
      cardName: creditCard.name,
      currentMonth: currentMonth || {
        month: new Date().toISOString().slice(0, 7),
        year: new Date().getFullYear(),
        monthNum: new Date().getMonth() + 1,
        monthName: new Date().toLocaleDateString('en-US', { month: 'long' }),
        spent: 0,
        transactionCount: 0,
        isCurrentMonth: true,
      },
      history: spendingHistory.slice(1), // Exclude current month from history
      autoPayAccount: autoPayAccount
        ? {
            id: autoPayAccount.id,
            name: autoPayAccount.name,
            type: autoPayAccount.type as 'checking' | 'savings' | 'credit' | 'cash',
          }
        : null,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching credit card spending:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to fetch spending history', details: errorMessage },
      { status: 500 }
    );
  }
}
