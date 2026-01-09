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
