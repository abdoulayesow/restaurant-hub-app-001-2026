/**
 * Cursor-based pagination utilities for API endpoints
 */

export interface PaginationParams {
  cursor?: string
  limit: number
}

export interface PaginatedResult<T> {
  items: T[]
  nextCursor: string | null
  hasMore: boolean
}

/**
 * Parse pagination parameters from URL search params
 * @param searchParams - URL search params
 * @param defaultLimit - Default page size (default: 50)
 * @param maxLimit - Maximum allowed page size (default: 100)
 */
export function parsePaginationParams(
  searchParams: URLSearchParams,
  defaultLimit = 50,
  maxLimit = 100
): PaginationParams {
  const cursor = searchParams.get('cursor') || undefined
  const requestedLimit = parseInt(searchParams.get('limit') || '', 10)
  const limit = isNaN(requestedLimit)
    ? defaultLimit
    : Math.min(Math.max(1, requestedLimit), maxLimit)

  return { cursor, limit }
}

/**
 * Build Prisma query args for cursor-based pagination
 * @param params - Pagination parameters
 * @param cursorField - Field to use for cursor (default: 'id')
 */
export function buildPaginationArgs<T extends string>(
  params: PaginationParams,
  cursorField: T = 'id' as T
): { take: number; skip?: number; cursor?: { [K in T]: string } } {
  const args: { take: number; skip?: number; cursor?: { [K in T]: string } } = {
    take: params.limit + 1, // Fetch one extra to determine if there are more
  }

  if (params.cursor) {
    args.cursor = { [cursorField]: params.cursor } as { [K in T]: string }
    args.skip = 1 // Skip the cursor item itself
  }

  return args
}

/**
 * Process query results into paginated response
 * @param items - Query results (should be limit + 1 items if more exist)
 * @param limit - Requested page size
 * @param cursorField - Field to use for cursor (default: 'id')
 */
export function buildPaginatedResult<T extends Record<string, unknown>>(
  items: T[],
  limit: number,
  cursorField: keyof T = 'id'
): PaginatedResult<T> {
  const hasMore = items.length > limit
  const resultItems = hasMore ? items.slice(0, limit) : items
  const lastItem = resultItems[resultItems.length - 1]
  const nextCursor = hasMore && lastItem ? String(lastItem[cursorField]) : null

  return {
    items: resultItems,
    nextCursor,
    hasMore,
  }
}
