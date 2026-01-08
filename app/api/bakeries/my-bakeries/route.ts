import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user with their bakeries
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        bakeries: {
          include: {
            bakery: {
              select: {
                id: true,
                name: true,
                location: true,
              },
            },
          },
        },
        defaultBakery: {
          select: {
            id: true,
            name: true,
            location: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const bakeries = user.bakeries.map((ub) => ub.bakery)

    return NextResponse.json({
      bakeries,
      defaultBakery: user.defaultBakery,
    })
  } catch (error) {
    console.error('Error fetching bakeries:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
