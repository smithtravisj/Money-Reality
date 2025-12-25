import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { authConfig } from '@/auth.config';
import { withRateLimit } from '@/lib/withRateLimit';

/**
 * GET /api/gift-cards
 * Fetch all gift cards for the authenticated user
 */
export const GET = withRateLimit(async function (_request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    console.log('[GET /api/gift-cards] Session check:', { hasSession: !!session, userId: session?.user?.id });

    if (!session?.user?.id) {
      console.log('[GET /api/gift-cards] No authenticated user');
      return NextResponse.json(
        { error: 'Please sign in to continue' },
        { status: 401 }
      );
    }

    console.log(`[GET /api/gift-cards] Fetching gift cards for user: ${session.user.id}`);
    const giftCards = await prisma.giftCard.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
    });

    console.log(`[GET /api/gift-cards] Found ${giftCards.length} gift cards`);
    return NextResponse.json({ giftCards });
  } catch (error) {
    console.error('[GET /api/gift-cards] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[GET /api/gift-cards] Error message:', errorMessage);
    return NextResponse.json(
      { error: 'Failed to fetch gift cards', details: errorMessage },
      { status: 500 }
    );
  }
});

/**
 * POST /api/gift-cards
 * Create a new gift card
 * Required: name, initialBalance, currentBalance, type
 * Optional: expirationDate, notes
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
    if (!data.name || data.initialBalance === undefined || data.type === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: name, initialBalance, type' },
        { status: 400 }
      );
    }

    // Validate amounts
    const initialBalance = parseFloat(data.initialBalance);
    const currentBalance = data.currentBalance !== undefined ? parseFloat(data.currentBalance) : initialBalance;

    if (isNaN(initialBalance) || isNaN(currentBalance) || initialBalance < 0 || currentBalance < 0) {
      return NextResponse.json(
        { error: 'Amounts must be valid positive numbers' },
        { status: 400 }
      );
    }

    // Validate type
    if (!['digital', 'physical'].includes(data.type)) {
      return NextResponse.json(
        { error: 'Type must be either "digital" or "physical"' },
        { status: 400 }
      );
    }

    // Parse expiration date if provided
    let expirationDate = null;
    if (data.expirationDate) {
      try {
        expirationDate = new Date(data.expirationDate);
        if (isNaN(expirationDate.getTime())) {
          throw new Error('Invalid date');
        }
      } catch {
        return NextResponse.json(
          { error: 'Invalid expiration date format' },
          { status: 400 }
        );
      }
    }

    // Create gift card
    const giftCard = await prisma.giftCard.create({
      data: {
        userId: session.user.id,
        name: data.name,
        initialBalance,
        currentBalance,
        type: data.type,
        expirationDate,
        notes: data.notes || '',
      },
    });

    return NextResponse.json({ giftCard }, { status: 201 });
  } catch (error) {
    console.error('Error creating gift card:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to create gift card', details: errorMessage },
      { status: 500 }
    );
  }
});
