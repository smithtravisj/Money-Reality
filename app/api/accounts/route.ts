import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { authConfig } from '@/auth.config';
import { withRateLimit } from '@/lib/withRateLimit';

/**
 * GET /api/accounts
 * Fetch all accounts for the authenticated user
 * Sorted by order, then name
 * Includes transaction count for each account
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

    const accounts = await prisma.account.findMany({
      where: { userId: session.user.id },
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
      include: {
        _count: {
          select: { transactions: true }
        }
      }
    });

    return NextResponse.json({ accounts });
  } catch (error) {
    console.error('Error fetching accounts:', error);
    return NextResponse.json(
      {
        error: 'We couldn\'t load your accounts. Please check your connection and try again.',
      },
      { status: 500 }
    );
  }
});

/**
 * POST /api/accounts
 * Create a new account
 * Required fields: name, type
 * Optional fields: notes, colorTag, icon, autoPayAccountId
 * Note: autoPayAccountId is only valid for credit card accounts
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
    if (!data.name || !data.type) {
      return NextResponse.json(
        { error: 'Missing required fields: name, type' },
        { status: 400 }
      );
    }

    // Validate type
    const validTypes = ['checking', 'savings', 'credit', 'cash'];
    if (!validTypes.includes(data.type)) {
      return NextResponse.json(
        { error: `Type must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Check for duplicate account name per user
    const existingAccount = await prisma.account.findFirst({
      where: {
        userId: session.user.id,
        name: data.name,
      },
    });

    if (existingAccount) {
      return NextResponse.json(
        { error: 'Account with this name already exists' },
        { status: 400 }
      );
    }

    // Get the next order value
    const lastAccount = await prisma.account.findFirst({
      where: { userId: session.user.id },
      orderBy: { order: 'desc' },
    });

    const nextOrder = (lastAccount?.order ?? 0) + 1;

    // Check if this should be the default account (first account created)
    const accountCount = await prisma.account.count({
      where: { userId: session.user.id },
    });

    const isDefault = accountCount === 0 || data.isDefault === true;

    // If setting as default, unset other defaults
    if (isDefault) {
      await prisma.account.updateMany({
        where: {
          userId: session.user.id,
          isDefault: true
        },
        data: { isDefault: false },
      });
    }

    // Validate autoPayAccountId if provided
    let autoPayAccountId = null;
    if (data.autoPayAccountId) {
      const autoPayAccount = await prisma.account.findFirst({
        where: {
          id: data.autoPayAccountId,
          userId: session.user.id,
        },
      });

      if (!autoPayAccount) {
        return NextResponse.json(
          { error: 'Auto-pay account not found' },
          { status: 404 }
        );
      }

      // Ensure auto-pay account is checking or savings, not credit or cash
      if (!['checking', 'savings'].includes(autoPayAccount.type)) {
        return NextResponse.json(
          { error: 'Auto-pay account must be a checking or savings account' },
          { status: 400 }
        );
      }

      autoPayAccountId = data.autoPayAccountId;
    }

    // Create account
    const currentBalance = data.currentBalance ? parseFloat(data.currentBalance) : 0;
    const account = await prisma.account.create({
      data: {
        userId: session.user.id,
        name: data.name,
        type: data.type,
        notes: data.notes || '',
        colorTag: data.colorTag || null,
        icon: data.icon || null,
        order: nextOrder,
        isDefault,
        currentBalance,
        autoPayAccountId,
      },
    });

    // If account has an initial balance, create an initial transaction to track it
    if (currentBalance > 0) {
      await prisma.transaction.create({
        data: {
          userId: session.user.id,
          type: 'income',
          amount: currentBalance,
          date: new Date(),
          accountId: account.id,
          notes: 'Initial account balance',
          allocations: '[]',
        },
      });
    }

    // Update settings if this is the default account
    if (isDefault) {
      await prisma.settings.upsert({
        where: { userId: session.user.id },
        create: {
          userId: session.user.id,
          defaultAccountId: account.id,
        },
        update: {
          defaultAccountId: account.id,
        },
      });
    }

    return NextResponse.json({ account }, { status: 201 });
  } catch (error) {
    console.error('Error creating account:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to create account', details: errorMessage },
      { status: 500 }
    );
  }
});
