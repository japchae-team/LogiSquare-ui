import { useMemo, useState } from 'react'
import WarehouseMap from '../../components/WarehouseMap'
import ConfirmDialog from '../../components/ConfirmDialog'
import { GRADE_COLOR } from '../../data/mockData'
import { useInventory } from '../../context/InventoryContext'
import { useCalls } from '../../context/CallContext'
import { useToast } from '../../context/ToastContext'
import { useAuth } from '../../context/AuthContext'
import type { Slot } from '../../types'

function slotLabel(slot: Slot) {
  return `${slot.grade}구역 ${slot.row + 1}행 ${slot.col + 1}열 (${slot.id})`
}

export default function PlacementStatusPage() {
  const [query, setQuery] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const { items, slots } = useInventory()
  const { sendCall } = useCalls()
  const { showToast } = useToast()
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  const matched = useMemo(() => {
    if (!query.trim()) return null
    return items.find((i) => i.name.toLowerCase().includes(query.trim().toLowerCase())) ?? undefined
  }, [query, items])

  const matchedSlot = matched ? slots.find((s) => s.id === matched.slotId) ?? null : null

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      const slotA = slots.find((s) => s.id === a.slotId)
      const slotB = slots.find((s) => s.id === b.slotId)
      if (!slotA || !slotB) return 0
      return slotA.row - slotB.row || slotA.col - slotB.col
    })
  }, [items, slots])

  function handleCallWorker() {
    setConfirmOpen(false)
    if (!matched || !matchedSlot) return
    const call = sendCall(matched.name, slotLabel(matchedSlot), '출고')
    if (call) {
      showToast(`${call.workerName} 작업자에게 출고 호출을 전송했습니다`)
    } else {
      showToast('현재 가용한 작업자가 없습니다', 'alert')
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-900">창고 배치 지도</h3>
        <div className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2">
          <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
          </svg>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="품목명으로 찾기"
            className="w-48 text-sm outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <WarehouseMap highlightSlotId={matchedSlot?.id ?? null} />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h4 className="mb-3 text-sm font-semibold text-slate-900">검색 결과</h4>
          {!query.trim() && <p className="text-sm text-slate-400">품목명을 입력해 위치를 확인하세요</p>}
          {query.trim() && matched === undefined && (
            <p className="text-sm text-red-500">일치하는 품목이 없습니다</p>
          )}
          {matched && matchedSlot && (
            <div className="space-y-2 text-sm text-slate-700">
              <p>
                품목: <span className="font-semibold">{matched.name}</span>
              </p>
              <p>
                재고 수량: <span className="font-semibold">{matched.qty}개</span>
              </p>
              <p>
                등급: <span className="font-semibold">{matched.grade}등급</span>
              </p>
              <p>
                보관 위치: <span className="font-semibold">{slotLabel(matchedSlot)}</span>
              </p>
              {isAdmin && (
                <button
                  onClick={() => setConfirmOpen(true)}
                  className="mt-3 w-full rounded-lg bg-blue-600 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  작업자 호출 (출고 지시)
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h4 className="mb-4 text-sm font-semibold text-slate-900">전체 재고 목록 ({sortedItems.length})</h4>
        <div className="overflow-hidden rounded-xl border border-slate-100">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2.5">품목명</th>
                <th className="px-4 py-2.5">수량</th>
                <th className="px-4 py-2.5">등급</th>
                <th className="px-4 py-2.5">위치</th>
              </tr>
            </thead>
            <tbody>
              {sortedItems.map((item) => {
                const slot = slots.find((s) => s.id === item.slotId)
                return (
                  <tr
                    key={item.id}
                    onClick={() => setQuery(item.name)}
                    className={`cursor-pointer border-t border-slate-100 hover:bg-slate-50 ${
                      matched?.id === item.id ? 'bg-blue-50' : ''
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
              {sortedItems.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-400">
                    배치된 재고가 없습니다
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {confirmOpen && (
        <ConfirmDialog
          message="작업자 호출을 시작하시겠습니까?"
          onConfirm={handleCallWorker}
          onCancel={() => setConfirmOpen(false)}
        />
      )}
    </div>
  )
}
