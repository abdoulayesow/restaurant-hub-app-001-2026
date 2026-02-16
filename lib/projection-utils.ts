/**
 * Projection Utility Functions
 *
 * Helper functions for calculating stock depletion forecasts, reorder recommendations,
 * cash runway scenarios, and demand forecasts.
 */

// ============================================================================
// Minimal Types for Calculations
// ============================================================================

interface MinimalStockMovement {
  quantity: number
}

// ============================================================================
// Type Definitions
// ============================================================================

export type ForecastStatus = 'CRITICAL' | 'WARNING' | 'LOW' | 'OK' | 'NO_DATA'
export type Confidence = 'HIGH' | 'MEDIUM' | 'LOW'
export type Trend = 'GROWING' | 'STABLE' | 'DECLINING'
export type Urgency = 'URGENT' | 'SOON' | 'PLAN_AHEAD'

export interface StockForecast {
  itemId: string
  itemName: string
  category: string
  currentStock: number
  unit: string
  dailyAverageUsage: number
  daysUntilDepletion: number | null
  depletionDate: Date | null
  status: ForecastStatus
  confidence: Confidence
}

export interface ReorderRecommendation {
  itemId: string
  itemName: string
  currentStock: number
  recommendedOrderQuantity: number
  unit: string
  estimatedCostGNF: number
  urgency: Urgency
  supplierId?: string
  supplierName?: string
}

export interface DemandForecast {
  period: '7d' | '14d' | '30d'
  expectedRevenue: number
  confidenceInterval: { low: number; high: number }
  expectedExpenses: number
  expenseConfidenceInterval: { low: number; high: number }
  trend: Trend
  trendPercentage: number
}

export interface CashRunwayData {
  currentBalance: number
  scenarios: {
    conservative: number
    expected: number
    optimistic: number
  }
  dailyRevenue: number
  dailyExpenses: number
}

export interface ProfitabilityData {
  currentMargin: number
  trend: Trend
  periodComparison: { period: string; margin: number }[]
}

// ============================================================================
// Stock Depletion Calculations
// ============================================================================

/**
 * Calculate daily average usage from stock movements
 */
export function calculateDailyAverage(
  movements: MinimalStockMovement[],
  days: number = 30
): number {
  if (movements.length === 0) return 0

  const totalUsage = movements.reduce((sum, movement) => {
    return sum + (movement.quantity < 0 ? Math.abs(movement.quantity) : 0)
  }, 0)

  return totalUsage / days
}

/**
 * Calculate days until stock depletion
 */
export function calculateDaysUntilDepletion(
  currentStock: number,
  dailyAverageUsage: number
): number | null {
  if (dailyAverageUsage === 0) return null
  if (currentStock <= 0) return 0

  return Math.floor(currentStock / dailyAverageUsage)
}

/**
 * Calculate depletion date
 */
export function calculateDepletionDate(daysUntilDepletion: number | null): Date | null {
  if (daysUntilDepletion === null) return null

  const date = new Date()
  date.setDate(date.getDate() + daysUntilDepletion)
  return date
}

/**
 * Determine forecast status based on days until depletion
 */
export function getForecastStatus(daysUntilDepletion: number | null): ForecastStatus {
  if (daysUntilDepletion === null) return 'NO_DATA'
  if (daysUntilDepletion < 3) return 'CRITICAL'
  if (daysUntilDepletion < 7) return 'WARNING'
  if (daysUntilDepletion < 14) return 'LOW'
  return 'OK'
}

/**
 * Calculate confidence level based on data consistency
 */
export function calculateConfidence(
  movements: MinimalStockMovement[],
  _days: number
): Confidence {
  if (movements.length < 7) return 'LOW'
  if (movements.length < 14) return 'MEDIUM'

  // Calculate standard deviation to check consistency
  const usageValues = movements
    .filter(m => m.quantity < 0)
    .map(m => Math.abs(m.quantity))

  if (usageValues.length < 7) return 'LOW'

  const mean = usageValues.reduce((a, b) => a + b, 0) / usageValues.length
  const variance = usageValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / usageValues.length
  const stdDev = Math.sqrt(variance)

  // If standard deviation is more than 50% of mean, usage is inconsistent
  if (stdDev > mean * 0.5) return 'MEDIUM'

  return 'HIGH'
}

// ============================================================================
// Reorder Recommendations
// ============================================================================

/**
 * Calculate reorder quantity
 */
export function calculateReorderQuantity(
  currentStock: number,
  dailyAverageUsage: number,
  leadTimeDays: number = 5,
  safetyDays: number = 3
): number {
  const safetyStock = dailyAverageUsage * safetyDays
  const reorderPoint = (dailyAverageUsage * leadTimeDays) + safetyStock

  if (currentStock >= reorderPoint) return 0

  return Math.ceil(reorderPoint - currentStock)
}

/**
 * Determine urgency level for reorder
 */
export function getReorderUrgency(daysUntilDepletion: number | null): Urgency {
  if (daysUntilDepletion === null) return 'PLAN_AHEAD'
  if (daysUntilDepletion < 3) return 'URGENT'
  if (daysUntilDepletion < 7) return 'SOON'
  return 'PLAN_AHEAD'
}

// ============================================================================
// Cash Runway Calculations
// ============================================================================

/**
 * Calculate cash runway scenarios
 */
export function calculateCashRunway(
  currentBalance: number,
  dailyRevenue: number,
  dailyExpenses: number
): CashRunwayData['scenarios'] {
  const dailyNetCashFlow = dailyRevenue - dailyExpenses

  // Conservative: assume 20% lower revenue
  const conservativeRevenue = dailyRevenue * 0.8
  const conservativeNet = conservativeRevenue - dailyExpenses
  const conservativeDays = conservativeNet < 0
    ? Math.floor(currentBalance / Math.abs(conservativeNet))
    : Infinity

  // Expected: current trend
  const expectedDays = dailyNetCashFlow < 0
    ? Math.floor(currentBalance / Math.abs(dailyNetCashFlow))
    : Infinity

  // Optimistic: assume 10% higher revenue
  const optimisticRevenue = dailyRevenue * 1.1
  const optimisticNet = optimisticRevenue - dailyExpenses
  const optimisticDays = optimisticNet < 0
    ? Math.floor(currentBalance / Math.abs(optimisticNet))
    : Infinity

  return {
    conservative: conservativeDays,
    expected: expectedDays,
    optimistic: optimisticDays
  }
}

// ============================================================================
// Demand Forecast Calculations
// ============================================================================

/**
 * Calculate moving average
 */
export function calculateMovingAverage(values: number[], window: number): number {
  if (values.length === 0) return 0

  const relevantValues = values.slice(-window)
  return relevantValues.reduce((a, b) => a + b, 0) / relevantValues.length
}

/**
 * Simple linear regression for trend analysis
 */
export function linearRegression(values: number[]): { slope: number; intercept: number } {
  const n = values.length
  if (n === 0) return { slope: 0, intercept: 0 }

  let sumX = 0
  let sumY = 0
  let sumXY = 0
  let sumXX = 0

  for (let i = 0; i < n; i++) {
    sumX += i
    sumY += values[i]
    sumXY += i * values[i]
    sumXX += i * i
  }

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n

  return { slope, intercept }
}

/**
 * Calculate demand forecast with confidence interval
 */
export function calculateDemandForecast(
  salesData: number[],
  forecastDays: number,
  confidenceLevel: number = 0.1 // 10% confidence interval
): { expectedRevenue: number; confidenceInterval: { low: number; high: number } } {
  if (salesData.length === 0) {
    return {
      expectedRevenue: 0,
      confidenceInterval: { low: 0, high: 0 }
    }
  }

  const movingAvg = calculateMovingAverage(salesData, Math.min(7, salesData.length))
  const { slope } = linearRegression(salesData)

  // Forecast: moving average + trend adjustment
  const dailyForecast = movingAvg + (slope * forecastDays / 2)
  const expectedRevenue = dailyForecast * forecastDays

  // Confidence interval
  const low = expectedRevenue * (1 - confidenceLevel)
  const high = expectedRevenue * (1 + confidenceLevel)

  return {
    expectedRevenue: Math.max(0, expectedRevenue),
    confidenceInterval: {
      low: Math.max(0, low),
      high: Math.max(0, high)
    }
  }
}

/**
 * Determine trend direction
 */
export function getTrend(values: number[]): { trend: Trend; percentage: number } {
  if (values.length < 2) return { trend: 'STABLE', percentage: 0 }

  const { slope } = linearRegression(values)
  const average = values.reduce((a, b) => a + b, 0) / values.length

  if (average === 0) return { trend: 'STABLE', percentage: 0 }

  const trendPercentage = (slope / average) * 100

  if (trendPercentage > 5) return { trend: 'GROWING', percentage: trendPercentage }
  if (trendPercentage < -5) return { trend: 'DECLINING', percentage: trendPercentage }
  return { trend: 'STABLE', percentage: trendPercentage }
}

// ============================================================================
// Profitability Calculations
// ============================================================================

/**
 * Calculate profit margin
 */
export function calculateProfitMargin(revenue: number, expenses: number): number {
  if (revenue === 0) return 0
  const profit = revenue - expenses
  return (profit / revenue) * 100
}

/**
 * Compare period margins to determine trend
 */
export function comparePeriodMargins(
  periodMargins: { period: string; margin: number }[]
): Trend {
  if (periodMargins.length < 2) return 'STABLE'

  const recent = periodMargins[0].margin
  const previous = periodMargins[1].margin

  const change = recent - previous

  if (change > 2) return 'GROWING'
  if (change < -2) return 'DECLINING'
  return 'STABLE'
}
