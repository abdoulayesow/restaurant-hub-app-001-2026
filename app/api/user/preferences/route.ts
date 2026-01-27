import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Default notification preferences
const defaultPreferences = {
  lowStockAlerts: true,
  criticalStockAlerts: true,
  expenseAlerts: true,
  approvalAlerts: true,
  dailySummary: true,
  largeExpenseThreshold: 500000,
  preferredLocale: 'fr',
  quietHoursStart: null,
  quietHoursEnd: null,
}

// GET - Fetch user's notification preferences
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is a Manager
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (user?.role !== 'Manager') {
      return NextResponse.json({ error: 'Only managers can access notification preferences' }, { status: 403 })
    }

    // Fetch existing preferences or return defaults
    const preferences = await prisma.notificationPreference.findUnique({
      where: { userId: session.user.id },
    })

    if (!preferences) {
      return NextResponse.json({
        preferences: {
          ...defaultPreferences,
          userId: session.user.id,
        },
        isDefault: true,
      })
    }

    return NextResponse.json({
      preferences,
      isDefault: false,
    })
  } catch (error) {
    console.error('Error fetching notification preferences:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Create or update notification preferences
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is a Manager
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (user?.role !== 'Manager') {
      return NextResponse.json({ error: 'Only managers can update notification preferences' }, { status: 403 })
    }

    const body = await request.json()

    // Validate fields
    const {
      lowStockAlerts,
      criticalStockAlerts,
      expenseAlerts,
      approvalAlerts,
      dailySummary,
      largeExpenseThreshold,
      preferredLocale,
      quietHoursStart,
      quietHoursEnd,
    } = body

    // Validate booleans
    const booleanFields = { lowStockAlerts, criticalStockAlerts, expenseAlerts, approvalAlerts, dailySummary }
    for (const [key, value] of Object.entries(booleanFields)) {
      if (value !== undefined && typeof value !== 'boolean') {
        return NextResponse.json({ error: `${key} must be a boolean` }, { status: 400 })
      }
    }

    // Validate expense threshold
    if (largeExpenseThreshold !== undefined) {
      if (typeof largeExpenseThreshold !== 'number' || largeExpenseThreshold < 0) {
        return NextResponse.json({ error: 'largeExpenseThreshold must be a non-negative number' }, { status: 400 })
      }
    }

    // Validate locale
    if (preferredLocale !== undefined && !['fr', 'en'].includes(preferredLocale)) {
      return NextResponse.json({ error: 'preferredLocale must be "fr" or "en"' }, { status: 400 })
    }

    // Validate time format (HH:MM or null)
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
    if (quietHoursStart !== undefined && quietHoursStart !== null) {
      if (typeof quietHoursStart !== 'string' || !timeRegex.test(quietHoursStart)) {
        return NextResponse.json({ error: 'quietHoursStart must be in HH:MM format or null' }, { status: 400 })
      }
    }
    if (quietHoursEnd !== undefined && quietHoursEnd !== null) {
      if (typeof quietHoursEnd !== 'string' || !timeRegex.test(quietHoursEnd)) {
        return NextResponse.json({ error: 'quietHoursEnd must be in HH:MM format or null' }, { status: 400 })
      }
    }

    // Upsert preferences
    const preferences = await prisma.notificationPreference.upsert({
      where: { userId: session.user.id },
      update: {
        lowStockAlerts: lowStockAlerts ?? undefined,
        criticalStockAlerts: criticalStockAlerts ?? undefined,
        expenseAlerts: expenseAlerts ?? undefined,
        approvalAlerts: approvalAlerts ?? undefined,
        dailySummary: dailySummary ?? undefined,
        largeExpenseThreshold: largeExpenseThreshold ?? undefined,
        preferredLocale: preferredLocale ?? undefined,
        quietHoursStart: quietHoursStart,
        quietHoursEnd: quietHoursEnd,
      },
      create: {
        userId: session.user.id,
        lowStockAlerts: lowStockAlerts ?? defaultPreferences.lowStockAlerts,
        criticalStockAlerts: criticalStockAlerts ?? defaultPreferences.criticalStockAlerts,
        expenseAlerts: expenseAlerts ?? defaultPreferences.expenseAlerts,
        approvalAlerts: approvalAlerts ?? defaultPreferences.approvalAlerts,
        dailySummary: dailySummary ?? defaultPreferences.dailySummary,
        largeExpenseThreshold: largeExpenseThreshold ?? defaultPreferences.largeExpenseThreshold,
        preferredLocale: preferredLocale ?? defaultPreferences.preferredLocale,
        quietHoursStart: quietHoursStart ?? null,
        quietHoursEnd: quietHoursEnd ?? null,
      },
    })

    return NextResponse.json({
      message: 'Preferences updated successfully',
      preferences,
    })
  } catch (error) {
    console.error('Error updating notification preferences:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
