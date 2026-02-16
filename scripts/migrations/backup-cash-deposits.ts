/**
 * Backup CashDeposit data before migration
 * Run with: npx tsx scripts/backup-cash-deposits.ts
 */

import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Backing up CashDeposit data...\n')

  // Query raw since model was removed from Prisma schema
  const cashDeposits = await prisma.$queryRaw`SELECT * FROM "CashDeposit"` as unknown[]

  console.log(`📊 Found ${cashDeposits.length} CashDeposit records`)

  if (cashDeposits.length === 0) {
    console.log('ℹ️  No CashDeposit records to backup')
    return
  }

  // Create backups directory
  const backupDir = path.join(__dirname, '../backups')
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true })
  }

  // Save backup with timestamp
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const backupFile = path.join(backupDir, `cash-deposits-backup-${timestamp}.json`)

  fs.writeFileSync(backupFile, JSON.stringify(cashDeposits, null, 2))

  console.log(`✅ Backup saved to: ${backupFile}`)
  console.log('\nSample record:')
  console.log(JSON.stringify(cashDeposits[0], null, 2))
}

main()
  .catch((error) => {
    console.error('❌ Backup failed:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
