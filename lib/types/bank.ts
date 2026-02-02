/**
 * Bank Transaction Types
 *
 * This file is the single source of truth for bank transaction type definitions.
 * All components and API routes should import from here to avoid duplication.
 */

// Transaction type (Deposit or Withdrawal)
export const TRANSACTION_TYPES = ['Deposit', 'Withdrawal'] as const
export type TransactionType = (typeof TRANSACTION_TYPES)[number]

// Transaction status
export const TRANSACTION_STATUSES = ['Pending', 'Confirmed'] as const
export type TransactionStatus = (typeof TRANSACTION_STATUSES)[number]

// Transaction reasons
export const TRANSACTION_REASONS = [
  'SalesDeposit',
  'DebtCollection',
  'ExpensePayment',
  'OwnerWithdrawal',
  'CapitalInjection',
  'Other',
] as const
export type TransactionReason = (typeof TRANSACTION_REASONS)[number]

// Deposit-specific reasons
export const DEPOSIT_REASONS: TransactionReason[] = [
  'SalesDeposit',
  'DebtCollection',
  'CapitalInjection',
  'Other',
]

// Withdrawal-specific reasons
export const WITHDRAWAL_REASONS: TransactionReason[] = [
  'ExpensePayment',
  'OwnerWithdrawal',
  'Other',
]

// Payment method (re-exported from payment-methods for convenience)
import { PaymentMethodValue } from '@/lib/constants/payment-methods'
export type { PaymentMethodValue as BankPaymentMethod }

/**
 * Base transaction interface with core fields.
 * Used for table displays and list views.
 */
export interface Transaction {
  id: string
  date: string
  amount: number
  type: TransactionType
  method: PaymentMethodValue
  reason: TransactionReason
  status: TransactionStatus
  description?: string | null
  comments?: string | null
  bankRef?: string | null
  confirmedAt?: string | null
  createdByName?: string | null
  createdAt?: string
  receiptUrl?: string | null
  // Related entities
  sale?: {
    id: string
    date: string
    totalGNF: number
  } | null
  debtPayment?: {
    id: string
    amount: number
    paymentDate: string
    debt?: {
      customer?: {
        name: string
      } | null
    } | null
  } | null
  expensePayment?: {
    id: string
    amount: number
    expense?: {
      id: string
      categoryName: string
      amountGNF: number
      supplierName?: string | null
    } | null
  } | null
}

/**
 * Transaction form data for creating/editing transactions.
 */
export interface TransactionFormData {
  date: string
  amount: number
  type: TransactionType
  method: PaymentMethodValue
  reason: TransactionReason
  description?: string
  comments?: string
  saleId?: string
}

/**
 * Validates if a string is a valid transaction type.
 */
export function isValidTransactionType(type: string): type is TransactionType {
  return TRANSACTION_TYPES.includes(type as TransactionType)
}

/**
 * Validates if a string is a valid transaction status.
 */
export function isValidTransactionStatus(status: string): status is TransactionStatus {
  return TRANSACTION_STATUSES.includes(status as TransactionStatus)
}

/**
 * Validates if a string is a valid transaction reason.
 */
export function isValidTransactionReason(reason: string): reason is TransactionReason {
  return TRANSACTION_REASONS.includes(reason as TransactionReason)
}

/**
 * Gets valid reasons based on transaction type.
 */
export function getReasonsForType(type: TransactionType): TransactionReason[] {
  return type === 'Deposit' ? DEPOSIT_REASONS : WITHDRAWAL_REASONS
}

/**
 * Checks if a transaction is manually created (not linked to sale, debt, or expense).
 */
export function isManualTransaction(txn: Transaction): boolean {
  return !txn.sale && !txn.expensePayment && !txn.debtPayment
}
