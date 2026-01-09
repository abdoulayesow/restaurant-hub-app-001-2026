// lib/notification-service.ts
import { prisma } from '@/lib/prisma'
import { sendSMS } from '@/lib/sms'
import { smsTemplates } from '@/lib/sms-templates'

type NotificationType = 'low_stock' | 'critical_stock' | 'expense_approved' | 'expense_rejected' |
        'sale_approved' | 'sale_rejected' | 'pending_approval' | 'daily_summary' | 'large_expense'

interface NotificationOptions {
  restaurantId: string
  type: NotificationType
  data: Record<string, unknown>
  recipientType?: 'manager' | 'submitter' | 'all_staff'
  recipientUserId?: string
}

/**
 * Check if a notification should be sent based on user preferences
 */
async function shouldSendNotification(
  userId: string,
  type: NotificationType
): Promise<{ send: boolean; locale: 'fr' | 'en' }> {
  const prefs = await prisma.notificationPreference.findUnique({
    where: { userId },
  })

  // Default: send all notifications in French
  if (!prefs) {
    return { send: true, locale: 'fr' }
  }

  // Check quiet hours
  if (prefs.quietHoursStart && prefs.quietHoursEnd) {
    const now = new Date()
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`

    // Handle quiet hours that may span midnight
    const start = prefs.quietHoursStart
    const end = prefs.quietHoursEnd

    let inQuietHours = false
    if (start <= end) {
      // Same day: e.g., 22:00 to 23:00
      inQuietHours = currentTime >= start && currentTime < end
    } else {
      // Spans midnight: e.g., 22:00 to 07:00
      inQuietHours = currentTime >= start || currentTime < end
    }

    if (inQuietHours) {
      return { send: false, locale: prefs.preferredLocale as 'fr' | 'en' }
    }
  }

  // Check alert type preference
  let shouldSend = true
  switch (type) {
    case 'low_stock':
      shouldSend = prefs.lowStockAlerts
      break
    case 'critical_stock':
      shouldSend = prefs.criticalStockAlerts
      break
    case 'expense_approved':
    case 'expense_rejected':
    case 'large_expense':
      shouldSend = prefs.expenseAlerts
      break
    case 'sale_approved':
    case 'sale_rejected':
    case 'pending_approval':
      shouldSend = prefs.approvalAlerts
      break
    case 'daily_summary':
      shouldSend = prefs.dailySummary
      break
  }

  return { send: shouldSend, locale: prefs.preferredLocale as 'fr' | 'en' }
}

interface Recipient {
  userId: string
  phone: string
}

/**
 * Get phone numbers for notification recipients
 */
async function getRecipients(
  restaurantId: string,
  recipientType: 'manager' | 'submitter' | 'all_staff',
  specificUserId?: string
): Promise<Recipient[]> {
  const recipients: Recipient[] = []

  if (specificUserId) {
    const user = await prisma.user.findUnique({
      where: { id: specificUserId },
      select: { id: true, phone: true },
    })
    if (user?.phone) {
      recipients.push({ userId: user.id, phone: user.phone })
    }
    return recipients
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
      recipients.push({ userId: ur.user.id, phone: ur.user.phone })
    } else if (recipientType === 'all_staff') {
      recipients.push({ userId: ur.user.id, phone: ur.user.phone })
    }
  }

  return recipients
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

    case 'sale_approved':
      message = smsTemplates.saleApproved(
        data.amount as number,
        ctx
      )
      break

    case 'sale_rejected':
      message = smsTemplates.saleRejected(
        data.amount as number,
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

  // Send to all recipients, respecting their preferences
  for (const recipient of recipients) {
    // Check user preferences
    const { send, locale } = await shouldSendNotification(recipient.userId, type)

    if (!send) {
      console.log(`Notification ${type} skipped for user ${recipient.userId} due to preferences`)
      continue
    }

    // Generate message with user's preferred locale
    const userCtx = { restaurantName: restaurant.name, locale }
    let userMessage: string

    switch (type) {
      case 'low_stock':
        userMessage = smsTemplates.lowStock(
          data.itemName as string,
          data.currentStock as number,
          data.unit as string,
          userCtx
        )
        break
      case 'critical_stock':
        userMessage = smsTemplates.criticalStock(data.itemName as string, userCtx)
        break
      case 'expense_approved':
        userMessage = smsTemplates.expenseApproved(data.amount as number, data.category as string, userCtx)
        break
      case 'expense_rejected':
        userMessage = smsTemplates.expenseRejected(data.amount as number, data.category as string, data.reason as string, userCtx)
        break
      case 'sale_approved':
        userMessage = smsTemplates.saleApproved(data.amount as number, userCtx)
        break
      case 'sale_rejected':
        userMessage = smsTemplates.saleRejected(data.amount as number, data.reason as string, userCtx)
        break
      case 'pending_approval':
        userMessage = smsTemplates.pendingApproval(data.type as 'expense' | 'sale', data.count as number, userCtx)
        break
      case 'daily_summary':
        userMessage = smsTemplates.dailySummary(data.totalSales as number, data.totalExpenses as number, data.profit as number, userCtx)
        break
      case 'large_expense':
        userMessage = smsTemplates.largeExpense(data.amount as number, data.category as string, data.submitter as string, userCtx)
        break
      default:
        userMessage = message
    }

    await sendSMS({ to: recipient.phone, message: userMessage, restaurantId })
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
