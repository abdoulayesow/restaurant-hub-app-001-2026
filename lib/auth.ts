import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from './prisma'
import type { Adapter } from 'next-auth/adapters'
import type { UserRole } from '@prisma/client'

// =============================================================================
// AUTHORIZATION HELPERS
// =============================================================================

export type AuthorizeResult =
  | { authorized: true; role: UserRole }
  | { authorized: false; error: string; status: 401 | 403 }

/**
 * Authorize a user for a restaurant-scoped action.
 *
 * @param userId - The authenticated user's ID
 * @param restaurantId - The restaurant to check access for
 * @param permissionCheck - Optional function to verify role has required permission
 * @returns AuthorizeResult with role on success, or error details on failure
 *
 * @example
 * // Basic restaurant access check
 * const auth = await authorizeRestaurantAccess(session.user.id, restaurantId)
 * if (!auth.authorized) {
 *   return NextResponse.json({ error: auth.error }, { status: auth.status })
 * }
 * // auth.role is now available
 *
 * @example
 * // With permission check
 * const auth = await authorizeRestaurantAccess(
 *   session.user.id,
 *   restaurantId,
 *   canRecordSales
 * )
 */
export async function authorizeRestaurantAccess(
  userId: string | undefined,
  restaurantId: string,
  permissionCheck?: (role: UserRole) => boolean,
  permissionErrorMessage?: string
): Promise<AuthorizeResult> {
  if (!userId) {
    return { authorized: false, error: 'Unauthorized', status: 401 }
  }

  const userRestaurant = await prisma.userRestaurant.findUnique({
    where: {
      userId_restaurantId: {
        userId,
        restaurantId,
      },
    },
    select: { role: true },
  })

  if (!userRestaurant) {
    return { authorized: false, error: 'You do not have access to this restaurant', status: 403 }
  }

  if (permissionCheck && !permissionCheck(userRestaurant.role)) {
    return {
      authorized: false,
      error: permissionErrorMessage || 'Your role does not have permission for this action',
      status: 403,
    }
  }

  return { authorized: true, role: userRestaurant.role }
}

const ALLOWED_EMAILS = process.env.ALLOWED_EMAILS?.split(',').map(e => e.trim()) || []

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 3 * 60 * 60, // 3 hours
  },
  callbacks: {
    async signIn({ user }) {
      // Check if email is in allowed list
      if (!user.email) return false
      return ALLOWED_EMAILS.length === 0 || ALLOWED_EMAILS.includes(user.email)
    },
    async jwt({ token, user }) {
      if (user) {
        // Fetch role from database
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email! },
          select: { id: true, role: true },
        })
        token.role = dbUser?.role || 'Editor'
        token.id = dbUser?.id || user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string
        session.user.id = token.id as string
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
}
