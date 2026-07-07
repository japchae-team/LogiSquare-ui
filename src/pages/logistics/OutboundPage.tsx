import { useEffect, useMemo, useState } from 'react'
import { GRADE_COLOR } from '../../data/mockData'
import { useToast } from '../../context/ToastContext'
import type { InventoryItemRecord } from '../../types'

export default function OutboundPage() {
  const { showToast } = useToast()
  const [items, setItems] = useState<InventoryItemRecord[]>([])
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [qty, setQty] = useState('')

  useEffect(() => {
    fetch('/api/inventories/layout')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setItems(data?.inventoryItems ?? []))
      .catch(() => setItems([]))
  }, [])

  const filteredItems = useMemo(() => {
    const list = query.trim()
      ? items.filter((i) => i.itemName.toLowerCase().includes(query.trim().toLowerCase()))
      : items
    return [...list].sort((a, b) => a.itemName.localeCompare(b.itemName, 'ko'))
  }, [items, query])

  const selected = items.find((i) => i.inventoryId === selectedId) ?? null

  const qtyNum = Number(qty)
  const canShip = !!selected && qtyNum > 0 && qtyNum <= selected.quantity

  function selectItem(id: number) {
    setSelectedId(id)
    setQty('')
  }

  function handleShipOut() {
    if (!selected || !canShip) return
    // 출고 처리 API가 아직 없어서 실제로 반영되지는 않음
    showToast('출고 처리 API가 아직 백엔드에 없어 처리할 수 없습니다', 'alert')
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
              {filteredItems.map((item) => (
                <tr
                  key={item.inventoryId}
                  onClick={() => selectItem(item.inventoryId)}
                  className={`cursor-pointer border-t border-slate-100 hover:bg-slate-50 ${
                    selectedId === item.inventoryId ? 'bg-blue-50' : ''
                  }`}
                >
                  <td className="px-4 py-2.5 font-medium text-slate-800">{item.itemName}</td>
                  <td className="px-4 py-2.5 text-slate-600">{item.quantity}개</td>
                  <td className="px-4 py-2.5">
                    <span className={`rounded px-2 py-0.5 text-xs font-bold text-white ${GRADE_COLOR[item.locationGrade].bg}`}>
                      {item.locationGrade}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-slate-600">{item.locationLabel}</td>
                </tr>
              ))}
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
        {selected && (
          <div className="space-y-3 text-sm text-slate-700">
            <p>
              품목: <span className="font-semibold">{selected.itemName}</span>
            </p>
            <p>
              현재 재고: <span className="font-semibold">{selected.quantity}개</span>
            </p>
            <p>
              보관 위치: <span className="font-semibold">{selected.locationLabel}</span>
            </p>

            <label className="mb-1 block text-sm font-medium text-slate-700">출고 수량</label>
            <input
              type="number"
              min={1}
              max={selected.quantity}
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              placeholder={`최대 ${selected.quantity}개`}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
            {qty !== '' && qtyNum > selected.quantity && (
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
