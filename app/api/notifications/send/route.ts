// app/api/notifications/send/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendSMS } from '@/lib/sms'
import { isOwner } from '@/lib/roles'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only owners can send manual SMS
    const userRestaurant = await prisma.userRestaurant.findFirst({
      where: { userId: session.user.id },
      select: { role: true }
    })

    if (!userRestaurant || !isOwner(userRestaurant.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { to, message, restaurantId } = await request.json()

    if (!to || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: to, message' },
        { status: 400 }
      )
    }

    const result = await sendSMS({ to, message, restaurantId })

    if (result.success) {
      return NextResponse.json({ success: true, messageId: result.messageId })
    } else {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }
  } catch (error) {
    console.error('Error sending SMS:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
