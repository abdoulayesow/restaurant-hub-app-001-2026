import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

// Neon serverless requires careful connection management
// - connection_limit set in DATABASE_URL controls max connections per instance
// - pgbouncer=true in DATABASE_URL enables connection pooling
// - pool_timeout and connect_timeout prevent hanging connections
export const prisma = globalForPrisma.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development'
    ? ['error', 'warn']  // Reduced logging: removed 'query' to reduce console noise
    : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
})

// Prevent multiple instances in development (hot reload)
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Graceful shutdown handlers (production only)
// In development, these interfere with Next.js hot reload
if (process.env.NODE_ENV === 'production') {
  const cleanup = async () => {
    try {
      await prisma.$disconnect()
    } catch (error) {
      console.error('Error disconnecting Prisma:', error)
    }
  }

  process.on('beforeExit', cleanup)
  process.on('SIGINT', cleanup)
  process.on('SIGTERM', cleanup)
}
