/**
 * Currency formatting utilities for GNF (Guinean Franc)
 *
 * Provides consistent currency formatting across the application
 * with locale support for French and English.
 */

/**
 * Formats an amount in GNF with locale-specific number formatting
 *
 * @param amount - Amount in GNF to format
 * @param locale - Locale string ('fr' or 'en')
 * @param options - Optional formatting options
 * @returns Formatted currency string with GNF suffix
 *
 * @example
 * formatCurrency(1500000, 'fr') // "1 500 000 GNF"
 * formatCurrency(1500000, 'en') // "1,500,000 GNF"
 * formatCurrency(1500000, 'fr', { compact: true }) // "1,5M GNF"
 */
export function formatCurrency(
  amount: number,
  locale: string = 'en',
  options?: {
    compact?: boolean
    showCurrency?: boolean
    decimals?: number
  }
): string {
  const {
    compact = false,
    showCurrency = true,
    decimals = 0
  } = options || {}

  const localeCode = locale === 'fr' ? 'fr-GN' : 'en-GN'

  const formatted = new Intl.NumberFormat(localeCode, {
    style: 'decimal',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    ...(compact && {
      notation: 'compact',
      compactDisplay: 'short'
    })
  }).format(amount)

  return showCurrency ? `${formatted} GNF` : formatted
}

/**
 * Formats a currency amount with compact notation (K, M, B)
 *
 * @param amount - Amount in GNF to format
 * @param locale - Locale string ('fr' or 'en')
 * @returns Formatted currency string with compact notation
 *
 * @example
 * formatCurrencyCompact(1500000, 'en') // "1.5M GNF"
 * formatCurrencyCompact(5000, 'fr') // "5K GNF"
 */
export function formatCurrencyCompact(
  amount: number,
  locale: string = 'en'
): string {
  return formatCurrency(amount, locale, { compact: true })
}

/**
 * Formats a currency amount without the GNF suffix
 *
 * @param amount - Amount in GNF to format
 * @param locale - Locale string ('fr' or 'en')
 * @param decimals - Number of decimal places (default: 0)
 * @returns Formatted number string without currency
 *
 * @example
 * formatAmount(1500000, 'en') // "1,500,000"
 * formatAmount(1500.50, 'fr', 2) // "1 500,50"
 */
export function formatAmount(
  amount: number,
  locale: string = 'en',
  decimals: number = 0
): string {
  return formatCurrency(amount, locale, { showCurrency: false, decimals })
}
