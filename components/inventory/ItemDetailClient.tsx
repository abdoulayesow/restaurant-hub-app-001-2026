'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ItemDetailHeader from './ItemDetailHeader'
import StockMovementHistory from './StockMovementHistory'
import { StockAdjustmentModal } from './StockAdjustmentModal'
import { Toast } from '@/components/ui/Toast'
import { useRestaurant } from '@/components/providers/RestaurantProvider'
import { MovementType } from '@prisma/client'

interface SerializedItem {
  id: string
  name: string
  nameFr: string | null
  category: string
  unit: string
  currentStock: number
  minStock: number
  unitCostGNF: number
  stockStatus: 'critical' | 'low' | 'ok'
  supplier: { id: string; name: string } | null
}

interface SerializedMovement {
  id: string
  type: MovementType
  quantity: number
  unitCost: number | null
  reason: string | null
  createdAt: string
  createdByName: string | null
  productionLogId: string | null
  expenseId: string | null
  productionLog: { id: string; productName: string } | null
  expense: { id: string; description: string } | null
}

interface Props {
  item: SerializedItem
  movements: SerializedMovement[]
  initialStock: number
}

export function ItemDetailClient({ item, movements, initialStock }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const router = useRouter()
  const { currentRestaurant } = useRestaurant()

  const handleAdjust = async (data: { type: string; quantity: number; reason?: string }) => {
    if (!currentRestaurant) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/inventory/${item.id}/adjust`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId: currentRestaurant.id,
          ...data
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to adjust stock')
      }

      // Success
      setToast({ message: 'Stock adjusted successfully', type: 'success' })
      setIsModalOpen(false)
      router.refresh() // Refresh server component data
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : 'Failed to adjust stock',
        type: 'error'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <ItemDetailHeader
        item={item}
        onAdjustStock={() => setIsModalOpen(true)}
      />

      <StockMovementHistory
        movements={movements}
        unit={item.unit}
        initialStock={initialStock}
      />

      <StockAdjustmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdjust={handleAdjust}
        item={item}
        isLoading={isLoading}
      />

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  )
}
