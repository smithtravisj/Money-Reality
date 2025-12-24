import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { authConfig } from '@/auth.config';
import { withRateLimit } from '@/lib/withRateLimit';

/**
 * PATCH /api/weekly-checkins/[id]
 * Update an existing weekly check-in
 * Only the user who created the check-in can update it
 * Mainly for updating reflection notes
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
    const existingCheckin = await prisma.weeklyCheckin.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existingCheckin) {
      return NextResponse.json(
        { error: 'Weekly check-in not found' },
        { status: 404 }
      );
    }

    // Validate and prepare update data
    const updateData: any = {};

    // Only allow updating reflection notes and financial data
    if (data.reflectionNotes !== undefined) {
      updateData.reflectionNotes = data.reflectionNotes;
    }

    if (data.weekStartDate !== undefined) {
      try {
        const newStartDate = new Date(data.weekStartDate);
        if (isNaN(newStartDate.getTime())) {
          throw new Error('Invalid date');
        }
        updateData.weekStartDate = newStartDate;
      } catch {
        return NextResponse.json(
          { error: 'Invalid weekStartDate format' },
          { status: 400 }
        );
      }
    }

    if (data.weekEndDate !== undefined) {
      try {
        const newEndDate = new Date(data.weekEndDate);
        if (isNaN(newEndDate.getTime())) {
          throw new Error('Invalid date');
        }
        updateData.weekEndDate = newEndDate;
      } catch {
        return NextResponse.json(
          { error: 'Invalid weekEndDate format' },
          { status: 400 }
        );
      }
    }

    if (data.totalIncome !== undefined) {
      const totalIncome = parseFloat(data.totalIncome);
      if (isNaN(totalIncome)) {
        return NextResponse.json(
          { error: 'totalIncome must be a valid number' },
          { status: 400 }
        );
      }
      updateData.totalIncome = totalIncome;
    }

    if (data.totalExpenses !== undefined) {
      const totalExpenses = parseFloat(data.totalExpenses);
      if (isNaN(totalExpenses)) {
        return NextResponse.json(
          { error: 'totalExpenses must be a valid number' },
          { status: 400 }
        );
      }
      updateData.totalExpenses = totalExpenses;
    }

    if (data.netChange !== undefined) {
      const netChange = parseFloat(data.netChange);
      if (isNaN(netChange)) {
        return NextResponse.json(
          { error: 'netChange must be a valid number' },
          { status: 400 }
        );
      }
      updateData.netChange = netChange;
    }

    if (data.startingBalance !== undefined) {
      const startingBalance = parseFloat(data.startingBalance);
      if (isNaN(startingBalance)) {
        return NextResponse.json(
          { error: 'startingBalance must be a valid number' },
          { status: 400 }
        );
      }
      updateData.startingBalance = startingBalance;
    }

    if (data.endingBalance !== undefined) {
      const endingBalance = parseFloat(data.endingBalance);
      if (isNaN(endingBalance)) {
        return NextResponse.json(
          { error: 'endingBalance must be a valid number' },
          { status: 400 }
        );
      }
      updateData.endingBalance = endingBalance;
    }

    // If both startDate and endDate are being updated, validate
    if (updateData.weekStartDate || updateData.weekEndDate) {
      const startDate = updateData.weekStartDate || existingCheckin.weekStartDate;
      const endDate = updateData.weekEndDate || existingCheckin.weekEndDate;
      if (startDate >= endDate) {
        return NextResponse.json(
          { error: 'Week start date must be before end date' },
          { status: 400 }
        );
      }
    }

    // Update check-in
    const checkin = await prisma.weeklyCheckin.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ checkin });
  } catch (error) {
    console.error('Error updating weekly check-in:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to update weekly check-in', details: errorMessage },
      { status: 500 }
    );
  }
});
