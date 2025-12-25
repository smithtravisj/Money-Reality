import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authConfig } from '@/auth.config';
import { processMonthlyRollover } from '@/lib/monthlyRollover';
import { withRateLimit } from '@/lib/withRateLimit';

/**
 * POST /api/monthly-rollover
 * Process monthly rollover for the current user
 * Calculates unspent budget for previous month and adds to each category's rollover balance
 */
export const POST = withRateLimit(async function () {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Please sign in to continue' },
        { status: 401 }
      );
    }

    const summary = await processMonthlyRollover(session.user.id);
    return NextResponse.json({ summary });
  } catch (error) {
    console.error('Monthly rollover failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Rollover processing failed', details: errorMessage },
      { status: 500 }
    );
  }
});
