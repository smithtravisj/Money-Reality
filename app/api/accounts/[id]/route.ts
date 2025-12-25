import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { authConfig } from '@/auth.config';
import { withRateLimit } from '@/lib/withRateLimit';

/**
 * PATCH /api/accounts/[id]
 * Update an existing account
 * Only the user who created the account can update it
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
    const existingAccount = await prisma.account.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existingAccount) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }

    // Validate and prepare update data
    const updateData: any = {};

    if (data.name !== undefined) {
      // Check for duplicate account name
      const duplicate = await prisma.account.findFirst({
        where: {
          userId: session.user.id,
          name: data.name,
          NOT: { id },
        },
      });

      if (duplicate) {
        return NextResponse.json(
          { error: 'Account with this name already exists' },
          { status: 400 }
        );
      }

      updateData.name = data.name;
    }

    if (data.type !== undefined) {
      const validTypes = ['checking', 'savings', 'credit', 'cash'];
      if (!validTypes.includes(data.type)) {
        return NextResponse.json(
          { error: `Type must be one of: ${validTypes.join(', ')}` },
          { status: 400 }
        );
      }
      updateData.type = data.type;
    }

    if (data.notes !== undefined) {
      updateData.notes = data.notes;
    }

    if (data.colorTag !== undefined) {
      updateData.colorTag = data.colorTag;
    }

    if (data.icon !== undefined) {
      updateData.icon = data.icon;
    }

    if (data.order !== undefined) {
      if (typeof data.order !== 'number' || data.order < 0) {
        return NextResponse.json(
          { error: 'Order must be a non-negative number' },
          { status: 400 }
        );
      }
      updateData.order = data.order;
    }

    if (data.currentBalance !== undefined) {
      const balance = parseFloat(data.currentBalance);
      if (isNaN(balance)) {
        return NextResponse.json(
          { error: 'Current balance must be a valid number' },
          { status: 400 }
        );
      }
      updateData.currentBalance = balance;
    }

    if (data.isDefault !== undefined) {
      if (data.isDefault === true) {
        // Unset other defaults
        await prisma.account.updateMany({
          where: {
            userId: session.user.id,
            isDefault: true,
            NOT: { id }
          },
          data: { isDefault: false },
        });

        // Update settings
        await prisma.settings.upsert({
          where: { userId: session.user.id },
          create: {
            userId: session.user.id,
            defaultAccountId: id,
          },
          update: {
            defaultAccountId: id,
          },
        });
      }
      updateData.isDefault = data.isDefault;
    }

    // Validate autoPayAccountId for credit cards
    if (data.autoPayAccountId !== undefined) {
      if (data.autoPayAccountId === null) {
        updateData.autoPayAccountId = null;
      } else {
        // Validate that the auto-pay account exists and belongs to the user
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

        // Prevent self-reference
        if (data.autoPayAccountId === id) {
          return NextResponse.json(
            { error: 'An account cannot auto-pay itself' },
            { status: 400 }
          );
        }

        updateData.autoPayAccountId = data.autoPayAccountId;
      }
    }

    // Update account
    const account = await prisma.account.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ account });
  } catch (error) {
    console.error('Error updating account:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to update account', details: errorMessage },
      { status: 500 }
    );
  }
});

/**
 * DELETE /api/accounts/[id]
 * Delete an account
 * Only allowed if account has no transactions
 * Only the user who created the account can delete it
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

    // Verify ownership before deleting
    const account = await prisma.account.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      include: {
        _count: {
          select: { transactions: true }
        }
      }
    });

    if (!account) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }

    // Prevent deletion if account has transactions
    if (account._count.transactions > 0) {
      return NextResponse.json(
        {
          error: 'Cannot delete account with transactions. Please move or delete all transactions first.',
          transactionCount: account._count.transactions
        },
        { status: 400 }
      );
    }

    // If deleting default account, clear from settings
    if (account.isDefault) {
      await prisma.settings.updateMany({
        where: {
          userId: session.user.id,
          defaultAccountId: id
        },
        data: { defaultAccountId: null },
      });
    }

    // Delete the account
    await prisma.account.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting account:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to delete account', details: errorMessage },
      { status: 500 }
    );
  }
});
