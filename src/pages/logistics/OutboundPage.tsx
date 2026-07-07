import { useMemo, useState } from 'react'
import { GRADE_COLOR } from '../../data/mockData'
import { useInventory } from '../../context/InventoryContext'
import { useToast } from '../../context/ToastContext'
import type { Slot } from '../../types'

function slotLabel(slot: Slot) {
  return `${slot.grade}구역 ${slot.row + 1}행 ${slot.col + 1}열 (${slot.id})`
}

export default function OutboundPage() {
  const { items, slots, shipOut } = useInventory()
  const { showToast } = useToast()
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [qty, setQty] = useState('')

  const filteredItems = useMemo(() => {
    const list = query.trim()
      ? items.filter((i) => i.name.toLowerCase().includes(query.trim().toLowerCase()))
      : items
    return [...list].sort((a, b) => a.name.localeCompare(b.name, 'ko'))
  }, [items, query])

  const selected = items.find((i) => i.id === selectedId) ?? null
  const selectedSlot = selected ? slots.find((s) => s.id === selected.slotId) ?? null : null

  const qtyNum = Number(qty)
  const canShip = !!selected && qtyNum > 0 && qtyNum <= selected.qty

  function selectItem(id: string) {
    setSelectedId(id)
    setQty('')
  }

  function handleShipOut() {
    if (!selected || !canShip) return
    const result = shipOut(selected.id, qtyNum)
    if (!result.ok) {
      showToast(result.reason ?? '출고할 수 없습니다', 'alert')
      return
    }
    showToast(result.removed ? '전량 출고되어 슬롯이 비워졌습니다' : '출고 완료')
    setSelectedId(null)
    setQty('')
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-base font-semibold text-slate-900">출고할 품목 선택</h3>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="품목명으로 찾기"
            className="w-40 rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-blue-500 sm:w-48"
          />
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2.5">품목명</th>
                <th className="px-4 py-2.5">수량</th>
                <th className="px-4 py-2.5">등급</th>
                <th className="px-4 py-2.5">위치</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => {
                const slot = slots.find((s) => s.id === item.slotId)
                return (
                  <tr
                    key={item.id}
                    onClick={() => selectItem(item.id)}
                    className={`cursor-pointer border-t border-slate-100 hover:bg-slate-50 ${
                      selectedId === item.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <td className="px-4 py-2.5 font-medium text-slate-800">{item.name}</td>
                    <td className="px-4 py-2.5 text-slate-600">{item.qty}개</td>
                    <td className="px-4 py-2.5">
                      <span className={`rounded px-2 py-0.5 text-xs font-bold text-white ${GRADE_COLOR[item.grade].bg}`}>
                        {item.grade}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-slate-600">{slot ? slotLabel(slot) : '-'}</td>
                  </tr>
                )
              })}
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-400">
                    일치하는 품목이 없습니다
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-base font-semibold text-slate-900">출고 처리</h3>
        {!selected && <p className="text-sm text-slate-400">왼쪽 목록에서 출고할 품목을 선택하세요</p>}
        {selected && selectedSlot && (
          <div className="space-y-3 text-sm text-slate-700">
            <p>
              품목: <span className="font-semibold">{selected.name}</span>
            </p>
            <p>
              현재 재고: <span className="font-semibold">{selected.qty}개</span>
            </p>
            <p>
              보관 위치: <span className="font-semibold">{slotLabel(selectedSlot)}</span>
            </p>

            <label className="mb-1 block text-sm font-medium text-slate-700">출고 수량</label>
            <input
              type="number"
              min={1}
              max={selected.qty}
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              placeholder={`최대 ${selected.qty}개`}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
            {qty !== '' && qtyNum > selected.qty && (
              <p className="text-xs font-medium text-red-600">재고 수량을 초과할 수 없습니다</p>
            )}

            <button
              onClick={handleShipOut}
              disabled={!canShip}
              className="w-full rounded-lg bg-purple-600 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              출고 처리
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
