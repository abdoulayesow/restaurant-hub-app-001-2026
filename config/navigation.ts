import {
  LayoutDashboard,
  TrendingUp,
  Target,
  ChefHat,
  Utensils,
  Package,
  Wallet,
  Receipt,
  Building2,
  type LucideIcon,
} from 'lucide-react'

export type FeatureFlag = 'inventory' | 'production'

export interface NavSubItem {
  id: string
  label: string
  labelFr: string
  icon: LucideIcon
  href: string
  requiresFeature?: FeatureFlag
}

export interface NavItemConfig {
  id: string
  label: string
  labelFr: string
  icon: LucideIcon
  subItems: NavSubItem[]
}

export const navigationItems: NavItemConfig[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    labelFr: 'Tableau',
    icon: LayoutDashboard,
    subItems: [
      { id: 'current', label: 'Current', labelFr: 'Actuel', icon: TrendingUp, href: '/dashboard' },
      { id: 'projection', label: 'Projection', labelFr: 'Projection', icon: Target, href: '/dashboard/projection' },
    ],
  },
  {
    id: 'baking',
    label: 'Baking',
    labelFr: 'Boulangerie',
    icon: ChefHat,
    subItems: [
      {
        id: 'production',
        label: 'Production',
        labelFr: 'Production',
        icon: Utensils,
        href: '/baking/production',
        requiresFeature: 'production',
      },
      {
        id: 'inventory',
        label: 'Inventory',
        labelFr: 'Inventaire',
        icon: Package,
        href: '/baking/inventory',
        requiresFeature: 'inventory',
      },
    ],
  },
  {
    id: 'finances',
    label: 'Finances',
    labelFr: 'Finances',
    icon: Wallet,
    subItems: [
      { id: 'sales', label: 'Sales', labelFr: 'Ventes', icon: TrendingUp, href: '/finances/sales' },
      { id: 'expenses', label: 'Expenses', labelFr: 'Dépenses', icon: Receipt, href: '/finances/expenses' },
      { id: 'bank', label: 'Bank', labelFr: 'Banque', icon: Building2, href: '/finances/bank' },
    ],
  },
]

// Map routes to sub-item IDs for active state
export const routeToSubItem: Record<string, string> = {
  '/dashboard': 'current',
  '/dashboard/projection': 'projection',
  '/baking': 'production',
  '/baking/production': 'production',
  '/baking/inventory': 'inventory',
  '/inventory': 'inventory',
  '/production': 'production',
  '/finances/sales': 'sales',
  '/finances/expenses': 'expenses',
  '/finances/bank': 'bank',
  '/sales': 'sales',
  '/expenses': 'expenses',
  '/bank': 'bank',
}
