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
  DollarSign,
  Users,
  ShoppingBag,
} from 'lucide-react'

// Navigation configuration types
export interface NavSubItem {
  id: string
  label: string
  labelFr: string
  icon: React.ElementType
  href: string
}

export interface NavItemConfig {
  id: string
  label: string
  labelFr: string
  icon: React.ElementType
  subItems: NavSubItem[]
}

// Main navigation items configuration
export const navigationItems: NavItemConfig[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    labelFr: 'Tableau',
    icon: LayoutDashboard,
    subItems: [
      { id: 'current', label: 'Current', labelFr: 'Actuel', icon: TrendingUp, href: '/dashboard' },
      { id: 'projection', label: 'Projection', labelFr: 'Projection', icon: Target, href: '/dashboard/projection' },
    ]
  },
  {
    id: 'baking',
    label: 'Baking',
    labelFr: 'Boulangerie',
    icon: ChefHat,
    subItems: [
      { id: 'production', label: 'Production', labelFr: 'Production', icon: Utensils, href: '/baking/production' },
      { id: 'products', label: 'Products', labelFr: 'Produits', icon: ShoppingBag, href: '/baking/products' },
      { id: 'inventory', label: 'Inventory', labelFr: 'Inventaire', icon: Package, href: '/baking/inventory' },
    ]
  },
  {
    id: 'finances',
    label: 'Finances',
    labelFr: 'Finances',
    icon: Wallet,
    subItems: [
      { id: 'sales', label: 'Sales', labelFr: 'Ventes', icon: TrendingUp, href: '/finances/sales' },
      { id: 'clients', label: 'Clients', labelFr: 'Clients', icon: Users, href: '/finances/clients' },
      { id: 'debts', label: 'Debts', labelFr: 'Dettes', icon: DollarSign, href: '/finances/debts' },
      { id: 'expenses', label: 'Expenses', labelFr: 'Dépenses', icon: Receipt, href: '/finances/expenses' },
      { id: 'bank', label: 'Bank', labelFr: 'Banque', icon: Building2, href: '/finances/bank' },
    ]
  },
]

// Map routes to sub-item IDs for active state detection
export const routeToSubItem: Record<string, string> = {
  '/dashboard': 'current',
  '/dashboard/projection': 'projection',
  '/baking': 'production',
  '/baking/production': 'production',
  '/baking/products': 'products',
  '/baking/inventory': 'inventory',
  '/inventory': 'inventory',
  '/production': 'production',
  '/finances/sales': 'sales',
  '/finances/clients': 'clients',
  '/finances/debts': 'debts',
  '/finances/expenses': 'expenses',
  '/finances/bank': 'bank',
  '/sales': 'sales',
  '/clients': 'clients',
  '/debts': 'debts',
  '/expenses': 'expenses',
  '/bank': 'bank',
}
