import { useEffect, useState } from 'react'
import WarehouseMap from '../../components/WarehouseMap'
import ConfirmDialog from '../../components/ConfirmDialog'
import { GRADE_COLOR } from '../../data/mockData'
import { useToast } from '../../context/ToastContext'
import { useAuth } from '../../context/AuthContext'
import type { InventoryItemRecord, InventorySlot } from '../../types'

interface InventoryResponse {
  inventoryItems: InventoryItemRecord[]
  slots: InventorySlot[]
  selectedResult?: InventoryItemRecord | null
}

interface TaskCallResult {
  workerName: string
}

export default function PlacementStatusPage() {
  const [query, setQuery] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [data, setData] = useState<InventoryResponse | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [requestedInventoryIds, setRequestedInventoryIds] = useState<Set<number>>(new Set())
  const [pendingOutboundTaskIds, setPendingOutboundTaskIds] = useState<Map<number, number>>(new Map())
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

  const alreadyRequested = matched ? requestedInventoryIds.has(matched.inventoryId) : false

  async function handleCallWorker() {
    setConfirmOpen(false)
    if (!matched || alreadyRequested || submitting) return

    setSubmitting(true)
    try {
      // 같은 재고에 이미 만들어둔 출고 작업이 있으면(직전 호출이 가용 작업자 없음으로 실패한 경우) 새로 만들지 않고 그 작업으로 재시도한다
      let taskId = pendingOutboundTaskIds.get(matched.inventoryId)
      if (taskId === undefined) {
        const outboundRes = await fetch('/api/outbound', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ inventoryId: matched.inventoryId, quantity: matched.quantity }),
        })
        if (!outboundRes.ok) {
          const body = await outboundRes.json().catch(() => null)
          showToast(body?.message ?? '출고 등록에 실패했습니다', 'alert')
          return
        }
        const outbound = await outboundRes.json()
        taskId = outbound.taskId as number
        setPendingOutboundTaskIds((prev) => new Map(prev).set(matched.inventoryId, taskId as number))
      }

      const callRes = await fetch(`/api/tasks/${taskId}/outbound-call`, { method: 'POST' })
      if (!callRes.ok) {
        showToast('현재 가용한 작업자가 없습니다. 잠시 후 다시 시도해주세요', 'alert')
        return
      }
      const call = (await callRes.json()) as TaskCallResult
      showToast(`${call.workerName} 작업자에게 출고 호출을 전송했습니다`)
      // 호출까지 실제로 성공했을 때만 이 재고를 세션 내에서 다시 요청 못 하게 막는다 (재고가 이미 빠져나가 완료 불가능한 중복 작업 방지)
      setRequestedInventoryIds((prev) => new Set(prev).add(matched.inventoryId))
      setPendingOutboundTaskIds((prev) => {
        const next = new Map(prev)
        next.delete(matched.inventoryId)
        return next
      })
    } finally {
      setSubmitting(false)
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
                  disabled={alreadyRequested || submitting}
                  className="mt-3 w-full rounded-lg bg-blue-600 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {alreadyRequested ? '이미 출고 요청됨' : '작업자 호출 (출고 지시)'}
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
