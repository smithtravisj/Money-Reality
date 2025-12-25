import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authConfig } from '@/auth.config';
import { transferRollover } from '@/lib/monthlyRollover';
import { withRateLimit } from '@/lib/withRateLimit';

/**
 * POST /api/categories/rollover-transfer
 * Transfer rollover balance from one category to another
 * Request body:
 *   - fromCategoryId: string - Source category ID
 *   - toCategoryId: string - Destination category ID
 *   - amount: number - Amount to transfer (must be positive)
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

    const { fromCategoryId, toCategoryId, amount } = await req.json();

    // Validate required fields
    if (!fromCategoryId || !toCategoryId || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields: fromCategoryId, toCategoryId, amount' },
        { status: 400 }
      );
    }

    // Validate amount is positive
    if (typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be a positive number' },
        { status: 400 }
      );
    }

    // Validate categories are different
    if (fromCategoryId === toCategoryId) {
      return NextResponse.json(
        { error: 'Cannot transfer rollover to the same category' },
        { status: 400 }
      );
    }

    const result = await transferRollover(
      session.user.id,
      fromCategoryId,
      toCategoryId,
      amount
    );

    return NextResponse.json({ transfer: result });
  } catch (error) {
    console.error('Rollover transfer failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Transfer failed', details: errorMessage },
      { status: 500 }
    );
  }
});
