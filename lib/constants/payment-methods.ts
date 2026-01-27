import { DollarSign, Smartphone, CreditCard, LucideIcon } from 'lucide-react'

/**
 * Standardized payment methods for the Bakery Hub application.
 * The bakery only accepts these 3 payment types.
 *
 * This file is the single source of truth for payment method constants.
 * All components and API routes should import from here.
 */

// Payment method value types (matches BankPaymentMethod enum in Prisma)
export const PAYMENT_METHOD_VALUES = ['Cash', 'OrangeMoney', 'Card'] as const
export type PaymentMethodValue = typeof PAYMENT_METHOD_VALUES[number]

// Display names with space (for user-facing strings where needed)
export const PAYMENT_METHOD_DISPLAY_NAMES: Record<PaymentMethodValue, string> = {
  Cash: 'Cash',
  OrangeMoney: 'Orange Money',
  Card: 'Card',
}

// Translation keys for i18n
export const PAYMENT_METHOD_TRANSLATION_KEYS: Record<PaymentMethodValue, { expenses: string; sales: string; bank: string }> = {
  Cash: {
    expenses: 'expenses.cash',
    sales: 'sales.cash',
    bank: 'bank.methods.Cash',
  },
  OrangeMoney: {
    expenses: 'expenses.orangeMoney',
    sales: 'sales.orangeMoney',
    bank: 'bank.methods.OrangeMoney',
  },
  Card: {
    expenses: 'expenses.card',
    sales: 'sales.card',
    bank: 'bank.methods.Card',
  },
}

// Icons for each payment method
export const PAYMENT_METHOD_ICONS: Record<PaymentMethodValue, LucideIcon> = {
  Cash: DollarSign,
  OrangeMoney: Smartphone,
  Card: CreditCard,
}

// Colors for each payment method (Tailwind classes)
export const PAYMENT_METHOD_COLORS: Record<PaymentMethodValue, { text: string; bg: string; hex: string }> = {
  Cash: {
    text: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-100 dark:bg-green-900/30',
    hex: '#059669',
  },
  OrangeMoney: {
    text: 'text-orange-600 dark:text-orange-400',
    bg: 'bg-orange-100 dark:bg-orange-900/30',
    hex: '#EA580C',
  },
  Card: {
    text: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    hex: '#2563EB',
  },
}

// Full payment method config for components
export interface PaymentMethodConfig {
  value: PaymentMethodValue
  displayName: string
  icon: LucideIcon
  textColor: string
  bgColor: string
  hexColor: string
}

export const PAYMENT_METHODS: PaymentMethodConfig[] = [
  {
    value: 'Cash',
    displayName: 'Cash',
    icon: DollarSign,
    textColor: PAYMENT_METHOD_COLORS.Cash.text,
    bgColor: PAYMENT_METHOD_COLORS.Cash.bg,
    hexColor: PAYMENT_METHOD_COLORS.Cash.hex,
  },
  {
    value: 'OrangeMoney',
    displayName: 'Orange Money',
    icon: Smartphone,
    textColor: PAYMENT_METHOD_COLORS.OrangeMoney.text,
    bgColor: PAYMENT_METHOD_COLORS.OrangeMoney.bg,
    hexColor: PAYMENT_METHOD_COLORS.OrangeMoney.hex,
  },
  {
    value: 'Card',
    displayName: 'Card',
    icon: CreditCard,
    textColor: PAYMENT_METHOD_COLORS.Card.text,
    bgColor: PAYMENT_METHOD_COLORS.Card.bg,
    hexColor: PAYMENT_METHOD_COLORS.Card.hex,
  },
]

/**
 * Validates if a string is a valid payment method.
 * Use this in API routes to validate incoming payment method values.
 *
 * @param method - The payment method string to validate
 * @returns true if the method is one of the 3 allowed payment methods
 */
export function isValidPaymentMethod(method: string): method is PaymentMethodValue {
  return PAYMENT_METHOD_VALUES.includes(method as PaymentMethodValue)
}

/**
 * Normalizes payment method strings that might have spaces (e.g., "Orange Money" -> "OrangeMoney").
 * Useful for handling legacy data or user input.
 *
 * @param method - The payment method string (may have spaces)
 * @returns The normalized PaymentMethodValue or null if invalid
 */
export function normalizePaymentMethod(method: string): PaymentMethodValue | null {
  // Direct match
  if (isValidPaymentMethod(method)) {
    return method
  }

  // Handle "Orange Money" with space
  const normalized = method.replace(/\s+/g, '')
  if (isValidPaymentMethod(normalized)) {
    return normalized
  }

  // Case-insensitive match
  const lowerMethod = normalized.toLowerCase()
  for (const validMethod of PAYMENT_METHOD_VALUES) {
    if (validMethod.toLowerCase() === lowerMethod) {
      return validMethod
    }
  }

  return null
}

/**
 * Gets the payment method config by value.
 *
 * @param value - The PaymentMethodValue
 * @returns The full PaymentMethodConfig or undefined if not found
 */
export function getPaymentMethodConfig(value: PaymentMethodValue): PaymentMethodConfig | undefined {
  return PAYMENT_METHODS.find(pm => pm.value === value)
}
