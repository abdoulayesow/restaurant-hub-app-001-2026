// app/api/notifications/send/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sendSMS } from '@/lib/sms'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only managers can send manual SMS
    if (session.user.role !== 'Manager') {
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
