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
  // Use new Date() as default, then format with local components
  const dateObj = date
    ? (typeof date === 'string' ? new Date(date) : date)
    : new Date()

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

/**
 * Parses a YYYY-MM-DD string or ISO datetime to a UTC Date object at midnight
 * Use this for database storage to avoid timezone shifts
 *
 * @param dateString - Date string in YYYY-MM-DD format or full ISO datetime
 * @returns Date object set to midnight UTC
 *
 * @example
 * parseToUTCDate("2026-01-26") // Date: 2026-01-26T00:00:00.000Z
 * parseToUTCDate("2026-01-26T06:00:00.000Z") // Date: 2026-01-26T00:00:00.000Z
 */
export function parseToUTCDate(dateString: string): Date {
  // Handle ISO datetime strings (extract just the date portion)
  const datePart = dateString.includes('T') ? dateString.split('T')[0] : dateString
  const [year, month, day] = datePart.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0))
}

/**
 * Parses a YYYY-MM-DD string or ISO datetime to a UTC Date object at end of day (23:59:59.999)
 * Use this for date range queries (end date)
 *
 * @param dateString - Date string in YYYY-MM-DD format or full ISO datetime
 * @returns Date object set to end of day UTC
 *
 * @example
 * parseToUTCEndOfDay("2026-01-26") // Date: 2026-01-26T23:59:59.999Z
 * parseToUTCEndOfDay("2026-01-26T05:59:59.999Z") // Date: 2026-01-26T23:59:59.999Z
 */
export function parseToUTCEndOfDay(dateString: string): Date {
  // Handle ISO datetime strings (extract just the date portion)
  const datePart = dateString.includes('T') ? dateString.split('T')[0] : dateString
  const [year, month, day] = datePart.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999))
}

/**
 * Extracts the date portion from an ISO string and creates a local Date for display
 * Use this to display dates from the database without timezone conversion
 *
 * @param isoString - ISO date string from database (e.g., "2026-01-26T00:00:00.000Z")
 * @returns Date object for display in local format
 *
 * @example
 * // Database returns: "2026-01-26T00:00:00.000Z"
 * // We want to display "Jan 26" not "Jan 25" (if user is in negative UTC offset)
 * parseUTCForDisplay("2026-01-26T00:00:00.000Z") // Local Date representing Jan 26
 */
export function parseUTCForDisplay(isoString: string): Date {
  const [datePart] = isoString.split('T')
  const [year, month, day] = datePart.split('-').map(Number)
  return new Date(year, month - 1, day)
}

/**
 * Formats a UTC ISO string for display without timezone conversion
 * Combines parseUTCForDisplay with Intl formatting
 *
 * @param isoString - ISO date string from database
 * @param locale - Locale string (e.g., 'fr-FR' or 'en-US')
 * @param options - Intl.DateTimeFormat options
 * @returns Formatted date string
 *
 * @example
 * formatUTCDateForDisplay("2026-01-26T00:00:00.000Z", "en-US")
 * // Returns "Sun, Jan 26, 2026" regardless of user's timezone
 */
export function formatUTCDateForDisplay(
  isoString: string | null | undefined,
  locale: string = 'en-US',
  options: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }
): string {
  if (!isoString) return ''
  const date = parseUTCForDisplay(isoString)
  return new Intl.DateTimeFormat(locale, options).format(date)
}

/**
 * Formats a date in short numeric format (DD/MM/YYYY for French, MM/DD/YYYY for English)
 * Handles YYYY-MM-DD strings without timezone conversion issues
 *
 * @param date - Date object, ISO string, or YYYY-MM-DD string
 * @param locale - Locale string (e.g., 'fr' or 'en')
 * @returns Formatted date string in numeric format
 *
 * @example
 * formatDateShort("2026-01-26", "fr") // "26/01/2026"
 * formatDateShort("2026-01-26", "en") // "01/26/2026"
 */
export function formatDateShort(
  date: Date | string | null | undefined,
  locale: string = 'en'
): string {
  if (!date) return ''

  // For YYYY-MM-DD strings from date inputs, parse safely without timezone issues
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const [year, month, day] = date.split('-')
    return locale === 'fr' ? `${day}/${month}/${year}` : `${month}/${day}/${year}`
  }

  // For ISO strings or Date objects, use parseUTCForDisplay to avoid timezone shifts
  const dateObj = typeof date === 'string' ? parseUTCForDisplay(date) : date
  const localeCode = locale === 'fr' ? 'fr-FR' : 'en-US'

  return new Intl.DateTimeFormat(localeCode, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(dateObj)
}

/**
 * Compares if two dates are on the same day (ignoring time)
 *
 * @param date1 - First date to compare
 * @param date2 - Second date to compare
 * @returns True if dates are on the same day
 *
 * @example
 * isSameDay(new Date('2026-01-26T10:00:00'), new Date('2026-01-26T15:00:00')) // true
 * isSameDay(new Date('2026-01-26'), new Date('2026-01-27')) // false
 */
export function isSameDay(date1: Date | string, date2: Date | string): boolean {
  const d1 = typeof date1 === 'string' ? new Date(date1) : date1
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2

  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  )
}

/**
 * Checks if a date is today
 *
 * @param date - Date to check
 * @returns True if date is today
 *
 * @example
 * isToday(new Date()) // true
 * isToday(new Date('2026-01-25')) // false (assuming today is not Jan 25)
 */
export function isToday(date: Date | string): boolean {
  return isSameDay(date, new Date())
}

/**
 * Checks if a date is yesterday
 *
 * @param date - Date to check
 * @returns True if date is yesterday
 *
 * @example
 * const yesterday = new Date()
 * yesterday.setDate(yesterday.getDate() - 1)
 * isYesterday(yesterday) // true
 */
export function isYesterday(date: Date | string): boolean {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  return isSameDay(date, yesterday)
}

/**
 * Converts YYYY-MM-DD to locale-specific display format (DD/MM/YYYY or MM/DD/YYYY)
 * Use this for text input fields that show dates in locale format
 *
 * @param isoDate - Date string in YYYY-MM-DD format
 * @param locale - Locale string (e.g., 'fr' or 'en')
 * @returns Formatted date string (DD/MM/YYYY for French, MM/DD/YYYY for English)
 *
 * @example
 * formatISOToLocaleInput("2026-02-01", "fr") // "01/02/2026"
 * formatISOToLocaleInput("2026-02-01", "en") // "02/01/2026"
 */
export function formatISOToLocaleInput(isoDate: string, locale: string = 'en'): string {
  if (!isoDate) return ''
  const [year, month, day] = isoDate.split('-')
  return locale === 'fr' ? `${day}/${month}/${year}` : `${month}/${day}/${year}`
}

/**
 * Converts locale-specific display format to YYYY-MM-DD
 * Use this to parse text input values back to ISO format for storage
 *
 * @param displayDate - Date string in DD/MM/YYYY or MM/DD/YYYY format
 * @param locale - Locale string (e.g., 'fr' or 'en')
 * @returns Date string in YYYY-MM-DD format or empty string if invalid
 *
 * @example
 * parseLocaleInputToISO("01/02/2026", "fr") // "2026-02-01"
 * parseLocaleInputToISO("02/01/2026", "en") // "2026-02-01"
 */
export function parseLocaleInputToISO(displayDate: string, locale: string = 'en'): string {
  if (!displayDate) return ''

  const parts = displayDate.split('/')
  if (parts.length !== 3) return ''

  const [part1, part2, year] = parts

  // French: DD/MM/YYYY, English: MM/DD/YYYY
  const month = locale === 'fr' ? part2 : part1
  const day = locale === 'fr' ? part1 : part2

  // Basic validation
  const yearNum = parseInt(year)
  const monthNum = parseInt(month)
  const dayNum = parseInt(day)

  if (yearNum < 1900 || yearNum > 2100 || monthNum < 1 || monthNum > 12 || dayNum < 1 || dayNum > 31) {
    return ''
  }

  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
}

/**
 * Gets the date input placeholder based on locale
 *
 * @param locale - Locale string (e.g., 'fr' or 'en')
 * @returns Placeholder string for date input
 *
 * @example
 * getDatePlaceholder("fr") // "JJ/MM/AAAA"
 * getDatePlaceholder("en") // "MM/DD/YYYY"
 */
export function getDatePlaceholder(locale: string = 'en'): string {
  return locale === 'fr' ? 'JJ/MM/AAAA' : 'MM/DD/YYYY'
}
