/**
 * Date utility functions for handling timezone-aware date operations
 *
 * IMPORTANT: These utilities ensure dates are handled consistently across the app
 * by converting to/from local timezone when working with date inputs.
 */

/**
 * Converts a Date object or ISO string to YYYY-MM-DD format in local timezone
 * Use this when setting values for <input type="date"> fields
 *
 * @param date - Date object or ISO string from API
 * @returns String in YYYY-MM-DD format (e.g., "2026-01-26")
 *
 * @example
 * // API returns: "2026-01-26T00:00:00.000Z"
 * // User's local timezone: GMT+0 (Conakry)
 * formatDateForInput("2026-01-26T00:00:00.000Z") // "2026-01-26"
 */
export function formatDateForInput(date: Date | string | null | undefined): string {
  if (!date) {
    return new Date().toISOString().split('T')[0]
  }

  const dateObj = typeof date === 'string' ? new Date(date) : date

  // Get local date components (accounts for timezone)
  const year = dateObj.getFullYear()
  const month = String(dateObj.getMonth() + 1).padStart(2, '0')
  const day = String(dateObj.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

/**
 * Converts a YYYY-MM-DD string from date input to Date object at local midnight
 * Use this when reading values from <input type="date"> fields before sending to API
 *
 * @param dateString - Date string in YYYY-MM-DD format
 * @returns Date object set to midnight in local timezone
 *
 * @example
 * // User selects: "2026-01-26"
 * parseDateInput("2026-01-26") // Date object: 2026-01-26T00:00:00 in local timezone
 */
export function parseDateInput(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number)
  // Create date at midnight in local timezone
  return new Date(year, month - 1, day)
}

/**
 * Gets today's date in YYYY-MM-DD format (local timezone)
 * Use this as default value for date inputs
 *
 * @returns String in YYYY-MM-DD format for today's date
 */
export function getTodayDateString(): string {
  return formatDateForInput(new Date())
}

/**
 * Formats a date for display to the user
 *
 * @param date - Date object or ISO string
 * @param locale - Locale string (e.g., 'fr-FR' or 'en-US')
 * @param options - Intl.DateTimeFormat options
 * @returns Formatted date string
 *
 * @example
 * formatDateForDisplay("2026-01-26", "fr-FR") // "dim. 26 janv. 2026"
 * formatDateForDisplay("2026-01-26", "en-US") // "Sun, Jan 26, 2026"
 */
export function formatDateForDisplay(
  date: Date | string | null | undefined,
  locale: string = 'en-US',
  options: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }
): string {
  if (!date) return ''

  const dateObj = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat(locale, options).format(dateObj)
}
