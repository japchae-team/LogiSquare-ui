import { createContext, useContext, useState, type ReactNode } from 'react'
import { gradeForQty, items as initialItems, slots as initialSlots } from '../data/mockData'
import type { Grade, InventoryItem, Slot } from '../types'

interface PlaceResult {
  ok: boolean
  grade: Grade
  slot: Slot | null
}

interface ShipOutResult {
  ok: boolean
  removed: boolean
  reason?: string
}

interface InventoryContextValue {
  items: InventoryItem[]
  slots: Slot[]
  previewPlacement: (qty: number) => { grade: Grade; slot: Slot | null }
  placeItem: (name: string, qty: number) => PlaceResult
  shipOut: (itemId: string, qty: number) => ShipOutResult
}

const InventoryContext = createContext<InventoryContextValue | null>(null)

let idCounter = initialItems.length

export function InventoryProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<InventoryItem[]>(initialItems)
  const [slots, setSlots] = useState<Slot[]>(initialSlots)

  function previewPlacement(qty: number) {
    const grade = gradeForQty(qty)
    const slot = slots.find((s) => s.grade === grade && s.itemId === null) ?? null
    return { grade, slot }
  }

  function placeItem(name: string, qty: number): PlaceResult {
    const grade = gradeForQty(qty)
    const slot = slots.find((s) => s.grade === grade && s.itemId === null) ?? null
    if (!slot) return { ok: false, grade, slot: null }

    const newItem: InventoryItem = { id: `item-${++idCounter}`, name, qty, grade, slotId: slot.id }
    setItems((prev) => [...prev, newItem])
    setSlots((prev) => prev.map((s) => (s.id === slot.id ? { ...s, itemId: newItem.id } : s)))
    return { ok: true, grade, slot }
  }

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
    <InventoryContext.Provider value={{ items, slots, previewPlacement, placeItem, shipOut }}>
      {children}
    </InventoryContext.Provider>
  )
}

export function useInventory() {
  const ctx = useContext(InventoryContext)
  if (!ctx) throw new Error('useInventory must be used within InventoryProvider')
  return ctx
}
