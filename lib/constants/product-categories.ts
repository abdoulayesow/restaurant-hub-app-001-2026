import { Croissant, Wheat, LucideIcon } from 'lucide-react'

/**
 * Standardized product categories for the Bakery Hub application.
 * Products are categorized as either Patisserie (pastry) or Boulangerie (bread).
 *
 * This file is the single source of truth for product category constants.
 * All components and API routes should import from here.
 */

// Product category values (matches ProductCategory enum in Prisma)
export const PRODUCT_CATEGORY_VALUES = ['Patisserie', 'Boulangerie'] as const
export type ProductCategoryValue = typeof PRODUCT_CATEGORY_VALUES[number]

// Translation keys for i18n
export const PRODUCT_CATEGORY_TRANSLATION_KEYS: Record<ProductCategoryValue, string> = {
  Patisserie: 'production.patisserie',
  Boulangerie: 'production.boulangerie',
}

// Icons for each category
export const PRODUCT_CATEGORY_ICONS: Record<ProductCategoryValue, LucideIcon> = {
  Patisserie: Croissant,
  Boulangerie: Wheat,
}

// Colors for each category (Tailwind classes)
export const PRODUCT_CATEGORY_COLORS: Record<ProductCategoryValue, { text: string; bg: string; hex: string }> = {
  Patisserie: {
    text: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    hex: '#D97706',
  },
  Boulangerie: {
    text: 'text-yellow-700 dark:text-yellow-400',
    bg: 'bg-yellow-100 dark:bg-yellow-900/30',
    hex: '#A16207',
  },
}

// Full category config for components
export interface ProductCategoryConfig {
  value: ProductCategoryValue
  icon: LucideIcon
  textColor: string
  bgColor: string
  hexColor: string
}

export const PRODUCT_CATEGORIES: ProductCategoryConfig[] = [
  {
    value: 'Patisserie',
    icon: Croissant,
    textColor: PRODUCT_CATEGORY_COLORS.Patisserie.text,
    bgColor: PRODUCT_CATEGORY_COLORS.Patisserie.bg,
    hexColor: PRODUCT_CATEGORY_COLORS.Patisserie.hex,
  },
  {
    value: 'Boulangerie',
    icon: Wheat,
    textColor: PRODUCT_CATEGORY_COLORS.Boulangerie.text,
    bgColor: PRODUCT_CATEGORY_COLORS.Boulangerie.bg,
    hexColor: PRODUCT_CATEGORY_COLORS.Boulangerie.hex,
  },
]

/**
 * Validates if a string is a valid product category.
 * Use this in API routes to validate incoming category values.
 *
 * @param category - The category string to validate
 * @returns true if the category is one of the 2 allowed categories
 */
export function isValidProductCategory(category: string): category is ProductCategoryValue {
  return PRODUCT_CATEGORY_VALUES.includes(category as ProductCategoryValue)
}

/**
 * Gets the category config by value.
 *
 * @param value - The ProductCategoryValue
 * @returns The full ProductCategoryConfig or undefined if not found
 */
export function getProductCategoryConfig(value: ProductCategoryValue): ProductCategoryConfig | undefined {
  return PRODUCT_CATEGORIES.find(cat => cat.value === value)
}

/**
 * Default products for seeding the database.
 * These are the standard products for a Guinean bakery.
 */
export const DEFAULT_PATISSERIE_PRODUCTS = [
  { name: 'Croissant', nameFr: 'Croissant', unit: 'piece', sortOrder: 1 },
  { name: 'Pain au chocolat', nameFr: 'Pain au chocolat', unit: 'piece', sortOrder: 2 },
  { name: 'Pain au raisin', nameFr: 'Pain au raisin', unit: 'piece', sortOrder: 3 },
  { name: 'Chicken Pastry', nameFr: 'Friand poulet', unit: 'piece', sortOrder: 4 },
  { name: 'Sandwich Loaf', nameFr: 'Pain de mie', unit: 'loaf', sortOrder: 5 },
] as const

export const DEFAULT_BOULANGERIE_PRODUCTS = [
  { name: 'Baguette', nameFr: 'Baguette', unit: 'piece', sortOrder: 1 },
  { name: 'Mini Baguette', nameFr: 'Mini Baguette', unit: 'piece', sortOrder: 2 },
  { name: 'Mini complet', nameFr: 'Mini complet', unit: 'piece', sortOrder: 3 },
  { name: 'Mini de 2500', nameFr: 'Mini de 2500', unit: 'piece', sortOrder: 4 },
  { name: 'Mini Mini', nameFr: 'Mini Mini', unit: 'piece', sortOrder: 5 },
] as const
