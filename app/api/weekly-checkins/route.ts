import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { authConfig } from '@/auth.config';
import { withRateLimit } from '@/lib/withRateLimit';

/**
 * GET /api/weekly-checkins
 * Fetch all weekly check-ins for the authenticated user
 * Sorted by weekStartDate (newest first)
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

    const checkins = await prisma.weeklyCheckin.findMany({
      where: { userId: session.user.id },
      orderBy: { weekStartDate: 'desc' },
    });

    return NextResponse.json({ checkins });
  } catch (error) {
    console.error('Error fetching weekly check-ins:', error);
    return NextResponse.json(
      {
        error: 'We couldn\'t load your weekly check-ins. Please check your connection and try again.',
      },
      { status: 500 }
    );
  }
});

/**
 * POST /api/weekly-checkins
 * Create a new weekly check-in
 * Required fields: weekStartDate, weekEndDate, totalIncome, totalExpenses, netChange, startingBalance, endingBalance
 * Optional fields: reflectionNotes
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
    if (
      !data.weekStartDate ||
      !data.weekEndDate ||
      data.totalIncome === undefined ||
      data.totalExpenses === undefined ||
      data.netChange === undefined ||
      data.startingBalance === undefined ||
      data.endingBalance === undefined
    ) {
      return NextResponse.json(
        {
          error: 'Missing required fields: weekStartDate, weekEndDate, totalIncome, totalExpenses, netChange, startingBalance, endingBalance',
        },
        { status: 400 }
      );
    }

    // Validate dates
    let weekStartDate: Date;
    let weekEndDate: Date;
    try {
      weekStartDate = new Date(data.weekStartDate);
      weekEndDate = new Date(data.weekEndDate);

      if (isNaN(weekStartDate.getTime()) || isNaN(weekEndDate.getTime())) {
        throw new Error('Invalid date');
      }

      if (weekStartDate >= weekEndDate) {
        throw new Error('Week start date must be before end date');
      }
    } catch (e) {
      return NextResponse.json(
        { error: 'Invalid date format or week date range' },
        { status: 400 }
      );
    }

    // Validate amounts are numbers
    const totalIncome = parseFloat(data.totalIncome);
    const totalExpenses = parseFloat(data.totalExpenses);
    const netChange = parseFloat(data.netChange);
    const startingBalance = parseFloat(data.startingBalance);
    const endingBalance = parseFloat(data.endingBalance);

    if (
      isNaN(totalIncome) ||
      isNaN(totalExpenses) ||
      isNaN(netChange) ||
      isNaN(startingBalance) ||
      isNaN(endingBalance)
    ) {
      return NextResponse.json(
        { error: 'All amounts must be valid numbers' },
        { status: 400 }
      );
    }

    // Verify that netChange = endingBalance - startingBalance
    const expectedNetChange = endingBalance - startingBalance;
    if (Math.abs(netChange - expectedNetChange) > 0.01) {
      return NextResponse.json(
        {
          error: `Net change (${netChange}) must equal ending balance (${endingBalance}) minus starting balance (${startingBalance})`,
        },
        { status: 400 }
      );
    }

    // Create check-in
    const checkin = await prisma.weeklyCheckin.create({
      data: {
        userId: session.user.id,
        weekStartDate,
        weekEndDate,
        totalIncome,
        totalExpenses,
        netChange,
        startingBalance,
        endingBalance,
        reflectionNotes: data.reflectionNotes || '',
      },
    });

    return NextResponse.json({ checkin }, { status: 201 });
  } catch (error) {
    console.error('Error creating weekly check-in:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to create weekly check-in', details: errorMessage },
      { status: 500 }
    );
  }
});
