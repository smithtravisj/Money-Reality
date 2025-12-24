import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { authConfig } from '@/auth.config';
import { withRateLimit } from '@/lib/withRateLimit';

const DEFAULT_SETTINGS = {
  theme: 'dark',
  currency: 'USD',
  safeThreshold: null,
  tightThreshold: null,
  enableWarnings: true,
  warningThreshold: null,
  defaultPaymentMethod: null,
};

/**
 * GET /api/settings
 * Fetch user settings or default settings if not exists
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

    // Try to find existing settings
    let settings = await prisma.settings.findUnique({
      where: { userId: session.user.id },
    });

    // If no settings exist, create default settings for this user
    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          userId: session.user.id,
          ...DEFAULT_SETTINGS,
        },
      });
    }

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      {
        error: 'We couldn\'t load your settings. Please check your connection and try again.',
      },
      { status: 500 }
    );
  }
});

/**
 * PATCH /api/settings
 * Update user settings
 * Optional fields: theme, currency, safeThreshold, tightThreshold, enableWarnings, warningThreshold, defaultPaymentMethod
 */
export const PATCH = withRateLimit(async function (req: NextRequest) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Please sign in to continue' },
        { status: 401 }
      );
    }

    const data = await req.json();

    // Validate and prepare update data
    const updateData: any = {};

    if (data.theme !== undefined) {
      // Only support dark theme for now
      if (data.theme !== 'dark') {
        return NextResponse.json(
          { error: 'Theme must be "dark"' },
          { status: 400 }
        );
      }
      updateData.theme = data.theme;
    }

    if (data.currency !== undefined) {
      const validCurrencies = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'INR'];
      if (!validCurrencies.includes(data.currency)) {
        return NextResponse.json(
          { error: `Currency must be one of: ${validCurrencies.join(', ')}` },
          { status: 400 }
        );
      }
      updateData.currency = data.currency;
    }

    if (data.safeThreshold !== undefined) {
      if (data.safeThreshold !== null) {
        const safeThreshold = parseFloat(data.safeThreshold);
        if (isNaN(safeThreshold) || safeThreshold <= 0) {
          return NextResponse.json(
            { error: 'safeThreshold must be a positive number or null' },
            { status: 400 }
          );
        }
        updateData.safeThreshold = safeThreshold;
      } else {
        updateData.safeThreshold = null;
      }
    }

    if (data.tightThreshold !== undefined) {
      if (data.tightThreshold !== null) {
        const tightThreshold = parseFloat(data.tightThreshold);
        if (isNaN(tightThreshold) || tightThreshold <= 0) {
          return NextResponse.json(
            { error: 'tightThreshold must be a positive number or null' },
            { status: 400 }
          );
        }
        updateData.tightThreshold = tightThreshold;
      } else {
        updateData.tightThreshold = null;
      }
    }

    if (data.warningThreshold !== undefined) {
      if (data.warningThreshold !== null) {
        const warningThreshold = parseFloat(data.warningThreshold);
        if (isNaN(warningThreshold)) {
          return NextResponse.json(
            { error: 'warningThreshold must be a number or null' },
            { status: 400 }
          );
        }
        updateData.warningThreshold = warningThreshold;
      } else {
        updateData.warningThreshold = null;
      }
    }

    if (data.enableWarnings !== undefined) {
      if (typeof data.enableWarnings !== 'boolean') {
        return NextResponse.json(
          { error: 'enableWarnings must be a boolean' },
          { status: 400 }
        );
      }
      updateData.enableWarnings = data.enableWarnings;
    }

    if (data.defaultPaymentMethod !== undefined) {
      if (data.defaultPaymentMethod !== null) {
        const validMethods = ['Cash', 'Card', 'Transfer', 'Other'];
        if (!validMethods.includes(data.defaultPaymentMethod)) {
          return NextResponse.json(
            { error: `defaultPaymentMethod must be one of: ${validMethods.join(', ')} or null` },
            { status: 400 }
          );
        }
      }
      updateData.defaultPaymentMethod = data.defaultPaymentMethod;
    }

    // Ensure settings exist for this user before updating
    let settings = await prisma.settings.findUnique({
      where: { userId: session.user.id },
    });

    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          userId: session.user.id,
          ...DEFAULT_SETTINGS,
          ...updateData,
        },
      });
    } else {
      settings = await prisma.settings.update({
        where: { userId: session.user.id },
        data: updateData,
      });
    }

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Error updating settings:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to update settings', details: errorMessage },
      { status: 500 }
    );
  }
});
