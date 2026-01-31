'use client'

interface ProductionDetailProps {
  production: unknown
  canEdit: boolean
}

// Stub component - full implementation pending
export default function ProductionDetail({ production: _production, canEdit: _canEdit }: ProductionDetailProps) {
  return (
    <div className="p-6 text-center text-gray-500 dark:text-stone-400">
      Production detail view coming soon
    </div>
  )
}
