import { useEffect, useState } from 'react'
import WarehouseMap from '../../components/WarehouseMap'
import ConfirmDialog from '../../components/ConfirmDialog'
import { GRADE_COLOR } from '../../data/mockData'
import { useCalls } from '../../context/CallContext'
import { useToast } from '../../context/ToastContext'
import { useAuth } from '../../context/AuthContext'
import type { InventoryItemRecord, InventorySlot } from '../../types'

interface InventoryResponse {
  inventoryItems: InventoryItemRecord[]
  slots: InventorySlot[]
  selectedResult?: InventoryItemRecord | null
}

export default function PlacementStatusPage() {
  const [query, setQuery] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [data, setData] = useState<InventoryResponse | null>(null)
  const { sendCall } = useCalls()
  const { showToast } = useToast()
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  useEffect(() => {
    const trimmed = query.trim()
    const url = trimmed ? `/api/inventories/search?itemName=${encodeURIComponent(trimmed)}` : '/api/inventories/layout'
    const timer = setTimeout(() => {
      fetch(url)
        .then((res) => (res.ok ? (res.json() as Promise<InventoryResponse>) : null))
        .then(setData)
        .catch(() => setData(null))
    }, 250)
    return () => clearTimeout(timer)
  }, [query])

  const slots = data?.slots ?? []
  const items = data?.inventoryItems ?? []
  const matched = data?.selectedResult ?? null
  const matchedSlot = matched ? (slots.find((s) => s.locationId === matched.locationId) ?? null) : null

  function handleCallWorker() {
    setConfirmOpen(false)
    if (!matched) return
    const call = sendCall(matched.itemName, matched.locationLabel, '출고')
    if (call) {
      showToast(`${call.workerName} 작업자에게 출고 호출을 전송했습니다`)
    } else {
      showToast('현재 가용한 작업자가 없습니다', 'alert')
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-base font-semibold text-slate-900">창고 배치 지도</h3>
        <div className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2">
          <svg className="h-4 w-4 shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
          </svg>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="품목명으로 찾기"
            className="w-40 text-sm outline-none sm:w-48"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <WarehouseMap slots={slots} highlightLocationId={matchedSlot?.locationId ?? null} />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h4 className="mb-3 text-sm font-semibold text-slate-900">검색 결과</h4>
          {!query.trim() && <p className="text-sm text-slate-400">품목명을 입력해 위치를 확인하세요</p>}
          {query.trim() && !matched && <p className="text-sm text-red-500">일치하는 품목이 없습니다</p>}
          {matched && (
            <div className="space-y-2 text-sm text-slate-700">
              <p>
                품목: <span className="font-semibold">{matched.itemName}</span>
              </p>
              <p>
                재고 수량: <span className="font-semibold">{matched.quantity}개</span>
              </p>
              <p>
                등급: <span className="font-semibold">{matched.locationGrade}등급</span>
              </p>
              <p>
                보관 위치: <span className="font-semibold">{matched.locationLabel}</span>
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
        <h4 className="mb-4 text-sm font-semibold text-slate-900">전체 재고 목록 ({items.length})</h4>
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
              {items.map((item) => (
                <tr
                  key={item.inventoryId}
                  onClick={() => setQuery(item.itemName)}
                  className={`cursor-pointer border-t border-slate-100 hover:bg-slate-50 ${
                    matched?.inventoryId === item.inventoryId ? 'bg-blue-50' : ''
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
              {items.length === 0 && (
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
