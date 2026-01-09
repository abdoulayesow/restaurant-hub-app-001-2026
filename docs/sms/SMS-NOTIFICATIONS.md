# SMS Notifications Implementation Guide

> **Status**: Draft
> **Last Updated**: 2026-01-08
> **Target Location**: Guinea (Conakry)

---

## Table of Contents

1. [Overview](#1-overview)
2. [Use Cases](#2-use-cases)
3. [SMS Provider Comparison](#3-sms-provider-comparison)
4. [Recommended Provider](#4-recommended-provider)
5. [Implementation Guide](#5-implementation-guide)
6. [Database Schema Changes](#6-database-schema-changes)
7. [API Endpoints](#7-api-endpoints)
8. [Environment Configuration](#8-environment-configuration)
9. [Security Considerations](#9-security-considerations)
10. [Cost Estimation](#10-cost-estimation)

---

## 1. Overview

This document outlines the implementation of SMS notifications for Bakery Hub, enabling real-time alerts and communications for:
- **Remote Owner (Atlanta)**: Critical business alerts
- **On-site Staff (Conakry)**: Operational notifications
- **System**: Automated alerts for low stock, approvals, etc.

### Guinea Phone Number Format

Guinea country code: **+224**

Common carriers in Guinea:
- **Orange Guinea** (622-XXX-XXXX, 625-XXX-XXXX)
- **MTN Guinea** (620-XXX-XXXX, 628-XXX-XXXX)
- **Cellcom Guinea** (664-XXX-XXXX)

---

## 2. Use Cases

### Priority 1 - Critical Alerts (Owner)
| Alert Type | Trigger | Recipient |
|------------|---------|-----------|
| Low Stock | Inventory below `minStock` threshold | Manager |
| Critical Stock | Inventory near zero (< 10% of minStock) | Manager |
| Large Expense | Expense above configurable threshold | Manager |
| Daily Summary | End of day sales/expense summary | Manager |
| Approval Required | New pending expense/sale submissions | Manager |

### Priority 2 - Operational Notifications (Staff)
| Alert Type | Trigger | Recipient |
|------------|---------|-----------|
| Expense Approved/Rejected | Manager reviews submission | Submitter |
| Sale Approved/Rejected | Manager reviews submission | Submitter |
| Stock Adjustment | Manual stock adjustment made | Manager |
| Production Reminder | Upcoming production schedule | Staff |

### Priority 3 - Future Enhancements
| Alert Type | Trigger | Recipient |
|------------|---------|-----------|
| Restock Reminder | Predicted stock depletion | Manager |
| Weekly Report | Weekly business summary | Manager |
| Cash Deposit Reminder | Pending deposits threshold | Manager |

---

## 3. SMS Provider Comparison

### International Providers Supporting Guinea (+224)

| Provider | Price/SMS (USD) | Free Tier | Pros | Cons |
|----------|-----------------|-----------|------|------|
| **Twilio** | $0.1517 | Trial credits (~$15) | Best documentation, reliable, scalable | Higher cost |
| **Plivo** | $0.12096 | Trial credits (~$10) | Good API, cost-effective | Smaller ecosystem |
| **Sinch** | $0.225 | Contact sales | Premium quality | Expensive, enterprise focus |
| **Infobip** | $0.2173 | Contact sales | Omnichannel | Complex pricing |
| **Unimtx** | $0.0922 | Pay-as-you-go | Lowest cost | Less documentation |
| **Releans** | $0.0952 | Pay-as-you-go | Africa-focused | Newer provider |
| **SMS Gateway Hub** | $0.0915 | Pay-as-you-go | Cheapest | Less known |
| **SMSLocal** | $0.1229 | Pay-as-you-go | Simple API | Limited features |

### Africa-Focused Providers

| Provider | Coverage | Notes |
|----------|----------|-------|
| **Africa's Talking** | 20+ African countries | Contact for Guinea pricing, strong West Africa presence |
| **Termii** | Nigeria-focused | May have Guinea routes |
| **Hubtel** | Ghana-focused | Limited Guinea support |

### Important Notes

⚠️ **No truly free SMS services exist for Guinea** - International SMS has carrier costs that providers must cover.

💡 **Best options for Guinea**:
1. **For reliability**: Twilio (trial credits to start)
2. **For cost**: SMS Gateway Hub or Unimtx
3. **For Africa expertise**: Africa's Talking (contact for pricing)

---

## 4. Recommended Provider

### Primary: **Twilio** (Development & Production)

**Why Twilio:**
- Extensive documentation and SDKs
- Free trial credits (~$15) to test
- Reliable delivery to Guinea
- Easy Next.js integration
- Supports sender ID customization
- Detailed delivery reports

**Alternative: Africa's Talking**
- Better local knowledge for West Africa
- Potentially better delivery rates to local carriers
- Contact them for Guinea-specific pricing

---

## 5. Implementation Guide

### Step 1: Install Dependencies

```bash
npm install twilio
```

### Step 2: Create SMS Service

```typescript
// lib/sms.ts
import twilio from 'twilio'

// Initialize Twilio client
const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null

interface SendSMSParams {
  to: string           // Phone number with country code (+224XXXXXXXX)
  message: string      // Message content (max 160 chars for 1 segment)
  restaurantId?: string // For logging purposes
}

interface SMSResult {
  success: boolean
  messageId?: string
  error?: string
}

/**
 * Format phone number to E.164 format for Guinea
 */
export function formatGuineaPhone(phone: string): string {
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '')
  
  // Handle different input formats
  if (digits.startsWith('224')) {
    return `+${digits}`
  } else if (digits.startsWith('00224')) {
    return `+${digits.slice(2)}`
  } else if (digits.length === 9 && digits.startsWith('6')) {
    // Local Guinea format (6XX-XX-XX-XX)
    return `+224${digits}`
  }
  
  // Return as-is if already formatted
  if (phone.startsWith('+')) {
    return phone
  }
  
  return `+${digits}`
}

/**
 * Send SMS via Twilio
 */
export async function sendSMS({ to, message, restaurantId }: SendSMSParams): Promise<SMSResult> {
  if (!twilioClient) {
    console.warn('SMS service not configured - TWILIO credentials missing')
    return { success: false, error: 'SMS service not configured' }
  }

  try {
    const formattedNumber = formatGuineaPhone(to)
    
    const result = await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: formattedNumber,
    })

    console.log(`SMS sent: ${result.sid} to ${formattedNumber}`)

    return {
      success: true,
      messageId: result.sid,
    }
  } catch (error) {
    console.error('SMS sending failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Send bulk SMS to multiple recipients
 */
export async function sendBulkSMS(
  recipients: string[],
  message: string,
  restaurantId?: string
): Promise<{ sent: number; failed: number }> {
  let sent = 0
  let failed = 0

  for (const recipient of recipients) {
    const result = await sendSMS({ to: recipient, message, restaurantId })
    if (result.success) {
      sent++
    } else {
      failed++
    }
    // Add delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  return { sent, failed }
}
```

### Step 3: Create Notification Templates

```typescript
// lib/sms-templates.ts

interface NotificationContext {
  restaurantName: string
  locale?: 'fr' | 'en'
}

// Template functions for bilingual support (French default for Guinea)
export const smsTemplates = {
  lowStock: (itemName: string, currentStock: number, unit: string, ctx: NotificationContext) => {
    if (ctx.locale === 'en') {
      return `[${ctx.restaurantName}] LOW STOCK: ${itemName} is running low (${currentStock} ${unit} remaining). Please reorder soon.`
    }
    return `[${ctx.restaurantName}] STOCK BAS: ${itemName} est bientôt épuisé (${currentStock} ${unit} restants). Veuillez commander bientôt.`
  },

  criticalStock: (itemName: string, ctx: NotificationContext) => {
    if (ctx.locale === 'en') {
      return `[${ctx.restaurantName}] CRITICAL: ${itemName} is nearly out of stock! Immediate reorder required.`
    }
    return `[${ctx.restaurantName}] CRITIQUE: ${itemName} est presque épuisé! Commande immédiate requise.`
  },

  expenseApproved: (amount: number, category: string, ctx: NotificationContext) => {
    if (ctx.locale === 'en') {
      return `[${ctx.restaurantName}] Your expense of ${amount.toLocaleString()} GNF (${category}) has been APPROVED.`
    }
    return `[${ctx.restaurantName}] Votre dépense de ${amount.toLocaleString()} GNF (${category}) a été APPROUVÉE.`
  },

  expenseRejected: (amount: number, category: string, reason: string, ctx: NotificationContext) => {
    if (ctx.locale === 'en') {
      return `[${ctx.restaurantName}] Your expense of ${amount.toLocaleString()} GNF (${category}) was REJECTED. Reason: ${reason}`
    }
    return `[${ctx.restaurantName}] Votre dépense de ${amount.toLocaleString()} GNF (${category}) a été REJETÉE. Raison: ${reason}`
  },

  pendingApproval: (type: 'expense' | 'sale', count: number, ctx: NotificationContext) => {
    const typeText = type === 'expense' 
      ? (ctx.locale === 'en' ? 'expenses' : 'dépenses')
      : (ctx.locale === 'en' ? 'sales' : 'ventes')
    
    if (ctx.locale === 'en') {
      return `[${ctx.restaurantName}] ${count} ${typeText} pending your approval. Review in Bakery Hub.`
    }
    return `[${ctx.restaurantName}] ${count} ${typeText} en attente de votre approbation. Vérifiez dans Bakery Hub.`
  },

  dailySummary: (
    totalSales: number,
    totalExpenses: number,
    profit: number,
    ctx: NotificationContext
  ) => {
    if (ctx.locale === 'en') {
      return `[${ctx.restaurantName}] Daily Summary: Sales: ${totalSales.toLocaleString()} GNF | Expenses: ${totalExpenses.toLocaleString()} GNF | Profit: ${profit.toLocaleString()} GNF`
    }
    return `[${ctx.restaurantName}] Résumé du jour: Ventes: ${totalSales.toLocaleString()} GNF | Dépenses: ${totalExpenses.toLocaleString()} GNF | Bénéfice: ${profit.toLocaleString()} GNF`
  },

  largeExpense: (amount: number, category: string, submitter: string, ctx: NotificationContext) => {
    if (ctx.locale === 'en') {
      return `[${ctx.restaurantName}] ALERT: Large expense of ${amount.toLocaleString()} GNF (${category}) submitted by ${submitter}. Review required.`
    }
    return `[${ctx.restaurantName}] ALERTE: Dépense importante de ${amount.toLocaleString()} GNF (${category}) soumise par ${submitter}. Vérification requise.`
  },
}
```

### Step 4: Create Notification Service

```typescript
// lib/notification-service.ts
import { prisma } from '@/lib/prisma'
import { sendSMS } from '@/lib/sms'
import { smsTemplates } from '@/lib/sms-templates'

interface NotificationOptions {
  restaurantId: string
  type: 'low_stock' | 'critical_stock' | 'expense_approved' | 'expense_rejected' | 
        'pending_approval' | 'daily_summary' | 'large_expense'
  data: Record<string, unknown>
  recipientType?: 'manager' | 'submitter' | 'all_staff'
  recipientUserId?: string
}

/**
 * Get phone numbers for notification recipients
 */
async function getRecipients(
  restaurantId: string,
  recipientType: 'manager' | 'submitter' | 'all_staff',
  specificUserId?: string
): Promise<string[]> {
  const phones: string[] = []

  if (specificUserId) {
    const user = await prisma.user.findUnique({
      where: { id: specificUserId },
      select: { phone: true },
    })
    if (user?.phone) {
      phones.push(user.phone)
    }
    return phones
  }

  // Get users associated with this restaurant
  const userRestaurants = await prisma.userRestaurant.findMany({
    where: { restaurantId },
    include: {
      user: {
        select: { id: true, phone: true, role: true },
      },
    },
  })

  for (const ur of userRestaurants) {
    if (!ur.user.phone) continue

    if (recipientType === 'manager' && ur.user.role === 'Manager') {
      phones.push(ur.user.phone)
    } else if (recipientType === 'all_staff') {
      phones.push(ur.user.phone)
    }
  }

  // Also check restaurant contact phone
  if (recipientType === 'manager') {
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: { contactPhone: true },
    })
    if (restaurant?.contactPhone && !phones.includes(restaurant.contactPhone)) {
      phones.push(restaurant.contactPhone)
    }
  }

  return phones
}

/**
 * Send notification based on type
 */
export async function sendNotification(options: NotificationOptions): Promise<void> {
  const { restaurantId, type, data, recipientType = 'manager', recipientUserId } = options

  // Get restaurant info for context
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    select: { name: true },
  })

  if (!restaurant) {
    console.error(`Restaurant not found: ${restaurantId}`)
    return
  }

  const ctx = { restaurantName: restaurant.name, locale: 'fr' as const }

  // Generate message based on type
  let message: string

  switch (type) {
    case 'low_stock':
      message = smsTemplates.lowStock(
        data.itemName as string,
        data.currentStock as number,
        data.unit as string,
        ctx
      )
      break

    case 'critical_stock':
      message = smsTemplates.criticalStock(data.itemName as string, ctx)
      break

    case 'expense_approved':
      message = smsTemplates.expenseApproved(
        data.amount as number,
        data.category as string,
        ctx
      )
      break

    case 'expense_rejected':
      message = smsTemplates.expenseRejected(
        data.amount as number,
        data.category as string,
        data.reason as string,
        ctx
      )
      break

    case 'pending_approval':
      message = smsTemplates.pendingApproval(
        data.type as 'expense' | 'sale',
        data.count as number,
        ctx
      )
      break

    case 'daily_summary':
      message = smsTemplates.dailySummary(
        data.totalSales as number,
        data.totalExpenses as number,
        data.profit as number,
        ctx
      )
      break

    case 'large_expense':
      message = smsTemplates.largeExpense(
        data.amount as number,
        data.category as string,
        data.submitter as string,
        ctx
      )
      break

    default:
      console.error(`Unknown notification type: ${type}`)
      return
  }

  // Get recipients
  const recipients = await getRecipients(restaurantId, recipientType, recipientUserId)

  if (recipients.length === 0) {
    console.warn(`No recipients found for notification: ${type}`)
    return
  }

  // Send to all recipients
  for (const phone of recipients) {
    await sendSMS({ to: phone, message, restaurantId })
  }
}

/**
 * Check and send low stock alerts
 * Run this as a scheduled job (e.g., daily via Vercel Cron)
 */
export async function checkAndNotifyLowStock(restaurantId: string): Promise<void> {
  // Use $queryRaw for column-to-column comparison
  const lowStockItems = await prisma.$queryRaw<Array<{
    name: string
    currentStock: number
    minStock: number
    unit: string
  }>>`
    SELECT name, "currentStock", "minStock", unit
    FROM "InventoryItem"
    WHERE "restaurantId" = ${restaurantId}
    AND "isActive" = true
    AND "currentStock" <= "minStock"
  `

  for (const item of lowStockItems) {
    const isCritical = item.currentStock <= item.minStock * 0.1

    await sendNotification({
      restaurantId,
      type: isCritical ? 'critical_stock' : 'low_stock',
      data: {
        itemName: item.name,
        currentStock: item.currentStock,
        unit: item.unit,
      },
    })
  }
}
```

### Step 5: Create API Endpoint for Manual Notifications

```typescript
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
```

### Step 6: Add Cron Job for Scheduled Notifications

```typescript
// app/api/cron/daily-notifications/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkAndNotifyLowStock, sendNotification } from '@/lib/notification-service'

// This endpoint should be called by Vercel Cron daily
// See vercel.json configuration below
export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Get all active restaurants
    const restaurants = await prisma.restaurant.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
    })

    for (const restaurant of restaurants) {
      // Check low stock
      await checkAndNotifyLowStock(restaurant.id)

      // Send daily summary
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      const [salesData, expensesData] = await Promise.all([
        prisma.sale.aggregate({
          where: {
            restaurantId: restaurant.id,
            date: { gte: today, lt: tomorrow },
            status: 'Approved',
          },
          _sum: { totalGNF: true },
        }),
        prisma.expense.aggregate({
          where: {
            restaurantId: restaurant.id,
            date: { gte: today, lt: tomorrow },
            status: 'Approved',
          },
          _sum: { amountGNF: true },
        }),
      ])

      const totalSales = salesData._sum.totalGNF || 0
      const totalExpenses = expensesData._sum.amountGNF || 0

      await sendNotification({
        restaurantId: restaurant.id,
        type: 'daily_summary',
        data: {
          totalSales,
          totalExpenses,
          profit: totalSales - totalExpenses,
        },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Cron job failed:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

---

## 6. Database Schema Changes

Add these models to track SMS notifications and user preferences:

```prisma
// Add to prisma/schema.prisma

// ============================================================================
// NOTIFICATION PREFERENCES & LOGS
// ============================================================================

model NotificationPreference {
  id                  String   @id @default(uuid())
  userId              String
  user                User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Notification toggles
  lowStockAlerts      Boolean  @default(true)
  criticalStockAlerts Boolean  @default(true)
  expenseAlerts       Boolean  @default(true)
  approvalAlerts      Boolean  @default(true)
  dailySummary        Boolean  @default(true)
  
  // Thresholds
  largeExpenseThreshold Float? @default(500000) // GNF threshold for alerts
  
  // Preferences
  preferredLocale     String   @default("fr") // 'fr' | 'en'
  quietHoursStart     String?  // e.g., "22:00"
  quietHoursEnd       String?  // e.g., "07:00"
  
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  @@unique([userId])
}

model NotificationLog {
  id            String   @id @default(uuid())
  restaurantId  String
  restaurant    Restaurant @relation(fields: [restaurantId], references: [id])
  recipientPhone String
  messageType   String   // 'low_stock', 'expense_approved', etc.
  message       String
  status        String   // 'sent', 'failed', 'delivered'
  providerMsgId String?  // Twilio message SID
  errorMessage  String?
  sentAt        DateTime @default(now())
  deliveredAt   DateTime?

  @@index([restaurantId])
  @@index([sentAt])
  @@index([status])
}

// Update User model to add relation
model User {
  // ... existing fields ...
  notificationPreference NotificationPreference?
}

// Update Restaurant model to add relation
model Restaurant {
  // ... existing fields ...
  notificationLogs NotificationLog[]
}
```

---

## 7. API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/notifications/send` | Send manual SMS (Manager only) | Manager |
| GET | `/api/notifications/preferences` | Get user's notification preferences | Any |
| PUT | `/api/notifications/preferences` | Update notification preferences | Any |
| GET | `/api/notifications/logs` | Get notification history | Manager |
| GET | `/api/cron/daily-notifications` | Cron endpoint for daily alerts | Cron Secret |

---

## 8. Environment Configuration

Add to your `.env.local`:

```bash
# Twilio Configuration
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890  # Your Twilio phone number

# Cron Job Security
CRON_SECRET=generate_a_secure_random_string_here

# Optional: SMS Feature Toggle
SMS_NOTIFICATIONS_ENABLED=true
```

Add to `vercel.json` for cron jobs:

```json
{
  "crons": [
    {
      "path": "/api/cron/daily-notifications",
      "schedule": "0 18 * * *"
    }
  ]
}
```

> Note: Schedule `0 18 * * *` = 6 PM UTC = 6 PM in Guinea (GMT timezone)

---

## 9. Security Considerations

### Phone Number Validation

```typescript
// lib/phone-validation.ts
export function isValidGuineaPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, '')
  
  // Guinea numbers: 224 + 9 digits starting with 6
  if (digits.length === 12 && digits.startsWith('224') && digits[3] === '6') {
    return true
  }
  
  // Local format: 9 digits starting with 6
  if (digits.length === 9 && digits.startsWith('6')) {
    return true
  }
  
  return false
}
```

### Rate Limiting

- Implement rate limiting per user/restaurant
- Max 100 SMS per restaurant per day
- Max 10 SMS per user per hour

### Opt-out Mechanism

- Users can disable SMS in notification preferences
- Respect quiet hours settings
- Include opt-out instructions in messages

---

## 10. Cost Estimation

### Twilio Pricing for Guinea

| Item | Cost |
|------|------|
| Per SMS | $0.1517 |
| Twilio Phone Number | $1.00/month |

### Monthly Cost Scenarios

| Scenario | SMS/Day | SMS/Month | Cost/Month |
|----------|---------|-----------|------------|
| Minimal (alerts only) | 5 | 150 | ~$23 |
| Standard (alerts + daily) | 10 | 300 | ~$46 |
| Heavy (multi-staff) | 25 | 750 | ~$114 |

### Cost Optimization Tips

1. **Batch notifications**: Combine multiple low-stock alerts into one SMS
2. **Use quiet hours**: Don't send non-critical alerts at night
3. **Smart thresholds**: Only alert when stock is truly low
4. **Daily digest**: Send one summary instead of multiple alerts
5. **Consider WhatsApp**: Twilio WhatsApp is often cheaper than SMS

---

## Next Steps

1. [ ] Create Twilio account and get trial credits
2. [ ] Add environment variables to Vercel
3. [ ] Run Prisma migration for new models
4. [ ] Implement SMS service (`lib/sms.ts`)
5. [ ] Implement notification templates (`lib/sms-templates.ts`)
6. [ ] Create API endpoints
7. [ ] Add notification preferences UI
8. [ ] Test with Guinea phone numbers
9. [ ] Set up Vercel cron jobs
10. [ ] Monitor delivery rates and costs

---

## Alternative: WhatsApp Business API

For potentially lower costs and better engagement, consider Twilio's WhatsApp Business API:

- Better delivery rates in Africa
- Rich media support (images, buttons)
- Cost: ~$0.05 per message to Guinea
- Requires WhatsApp Business approval

Contact Twilio for WhatsApp Business setup if interested.
