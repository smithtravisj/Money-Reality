import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { authConfig } from '@/auth.config';
import { withRateLimit } from '@/lib/withRateLimit';

/**
 * PATCH /api/gift-cards/[id]
 * Update a gift card
 * Can update: name, currentBalance, notes, expirationDate
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
    const existingGiftCard = await prisma.giftCard.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existingGiftCard) {
      return NextResponse.json(
        { error: 'Gift card not found' },
        { status: 404 }
      );
    }

    // Validate and prepare update data
    const updateData: any = {};

    if (data.name !== undefined) {
      updateData.name = data.name;
    }

    if (data.currentBalance !== undefined) {
      const currentBalance = parseFloat(data.currentBalance);
      if (isNaN(currentBalance) || currentBalance < 0) {
        return NextResponse.json(
          { error: 'Current balance must be a valid positive number' },
          { status: 400 }
        );
      }
      updateData.currentBalance = currentBalance;
    }

    if (data.notes !== undefined) {
      updateData.notes = data.notes;
    }

    if (data.expirationDate !== undefined) {
      if (data.expirationDate === null) {
        updateData.expirationDate = null;
      } else {
        try {
          const expirationDate = new Date(data.expirationDate);
          if (isNaN(expirationDate.getTime())) {
            throw new Error('Invalid date');
          }
          updateData.expirationDate = expirationDate;
        } catch {
          return NextResponse.json(
            { error: 'Invalid expiration date format' },
            { status: 400 }
          );
        }
      }
    }

    // Update gift card
    const giftCard = await prisma.giftCard.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ giftCard });
  } catch (error) {
    console.error('Error updating gift card:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to update gift card', details: errorMessage },
      { status: 500 }
    );
  }
});

/**
 * DELETE /api/gift-cards/[id]
 * Delete a gift card
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

    // Verify ownership
    const giftCard = await prisma.giftCard.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!giftCard) {
      return NextResponse.json(
        { error: 'Gift card not found' },
        { status: 404 }
      );
    }

    // Delete the gift card
    await prisma.giftCard.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting gift card:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to delete gift card', details: errorMessage },
      { status: 500 }
    );
  }
});
