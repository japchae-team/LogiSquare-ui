import { createContext, useContext, useState, type ReactNode } from 'react'
import { items as initialItems, slots as initialSlots } from '../data/mockData'
import type { InventoryItem, Slot } from '../types'

interface ShipOutResult {
  ok: boolean
  removed: boolean
  reason?: string
}

interface InventoryContextValue {
  items: InventoryItem[]
  slots: Slot[]
  shipOut: (itemId: string, qty: number) => ShipOutResult
}

const InventoryContext = createContext<InventoryContextValue | null>(null)

export function InventoryProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<InventoryItem[]>(initialItems)
  const [slots, setSlots] = useState<Slot[]>(initialSlots)

  function shipOut(itemId: string, qty: number): ShipOutResult {
    const item = items.find((i) => i.id === itemId)
    if (!item) return { ok: false, removed: false, reason: '품목을 찾을 수 없습니다' }
    if (qty <= 0 || qty > item.qty) {
      return { ok: false, removed: false, reason: '재고보다 많은 수량은 출고할 수 없습니다' }
    }

    const remaining = item.qty - qty
    if (remaining <= 0) {
      setItems((prev) => prev.filter((i) => i.id !== itemId))
      setSlots((prev) => prev.map((s) => (s.id === item.slotId ? { ...s, itemId: null } : s)))
      return { ok: true, removed: true }
    }

    setItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, qty: remaining } : i)))
    return { ok: true, removed: false }
  }

  return (
    <InventoryContext.Provider value={{ items, slots, shipOut }}>
      {children}
    </InventoryContext.Provider>
  )
}

export function useInventory() {
  const ctx = useContext(InventoryContext)
  if (!ctx) throw new Error('useInventory must be used within InventoryProvider')
  return ctx
}
