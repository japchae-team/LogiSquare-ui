import { useEffect, useMemo, useState } from 'react'
import { GRADE_COLOR } from '../../data/mockData'
import { useToast } from '../../context/ToastContext'
import ConfirmDialog from '../../components/ConfirmDialog'
import type { InventoryItemRecord } from '../../types'

interface OutboundResult {
  taskId: number
  inventoryId: number
  itemName: string
  quantity: number
  sourceLocationCode: string
  sourceLocationName: string
}

interface TaskCallResult {
  workerName: string
}

export default function OutboundPage() {
  const { showToast } = useToast()
  const [items, setItems] = useState<InventoryItemRecord[]>([])
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [qty, setQty] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<OutboundResult | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [requestedInventoryIds, setRequestedInventoryIds] = useState<Set<number>>(new Set())

  useEffect(() => {
    loadItems()
  }, [])

  function loadItems() {
    fetch('/api/inventories/layout')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setItems(data?.inventoryItems ?? []))
      .catch(() => setItems([]))
  }

  const filteredItems = useMemo(() => {
    const list = query.trim()
      ? items.filter((i) => i.itemName.toLowerCase().includes(query.trim().toLowerCase()))
      : items
    return [...list].sort((a, b) => a.itemName.localeCompare(b.itemName, 'ko'))
  }, [items, query])

  const selected = items.find((i) => i.inventoryId === selectedId) ?? null
  const selectedAlreadyRequested = selected ? requestedInventoryIds.has(selected.inventoryId) : false

  const qtyNum = Number(qty)
  const canShip = !!selected && !selectedAlreadyRequested && qtyNum > 0 && qtyNum <= selected.quantity && !submitting

  function selectItem(id: number) {
    if (requestedInventoryIds.has(id)) return
    setSelectedId(id)
    setQty('')
    setResult(null)
  }

  async function handleShipOut() {
    if (!selected || !canShip) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/outbound', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inventoryId: selected.inventoryId, quantity: qtyNum }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        showToast(body?.message ?? '출고 처리에 실패했습니다', 'alert')
        return
      }
      const data = await res.json()
      setResult({
        taskId: data.taskId,
        inventoryId: selected.inventoryId,
        itemName: data.itemName,
        quantity: data.quantity,
        sourceLocationCode: data.sourceLocationCode,
        sourceLocationName: data.sourceLocationName,
      })
      showToast('출고 등록 완료')
      setSelectedId(null)
      setQty('')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleCallWorker() {
    setConfirmOpen(false)
    if (!result) return
    const res = await fetch(`/api/tasks/${result.taskId}/outbound-call`, { method: 'POST' })
    if (!res.ok) {
      showToast('현재 가용한 작업자가 없습니다. 잠시 후 다시 시도해주세요', 'alert')
      return
    }
    const call = (await res.json()) as TaskCallResult
    showToast(`${call.workerName} 작업자에게 출고 호출을 전송했습니다`)
    // 호출까지 실제로 성공했을 때만 이 재고를 세션 내에서 다시 선택 못 하게 막는다 (재고가 이미 빠져나가 완료 불가능한 중복 작업 방지)
    setRequestedInventoryIds((prev) => new Set(prev).add(result.inventoryId))
    setResult(null)
    loadItems()
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
                const alreadyRequested = requestedInventoryIds.has(item.inventoryId)
                return (
                  <tr
                    key={item.inventoryId}
                    onClick={() => selectItem(item.inventoryId)}
                    className={`border-t border-slate-100 ${
                      alreadyRequested
                        ? 'cursor-not-allowed text-slate-300'
                        : `cursor-pointer hover:bg-slate-50 ${selectedId === item.inventoryId ? 'bg-blue-50' : ''}`
                    }`}
                  >
                    <td className="px-4 py-2.5 font-medium">{item.itemName}</td>
                    <td className="px-4 py-2.5">{item.quantity}개</td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`rounded px-2 py-0.5 text-xs font-bold text-white ${
                          alreadyRequested ? 'bg-slate-300' : GRADE_COLOR[item.locationGrade].bg
                        }`}
                      >
                        {item.locationGrade}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">{alreadyRequested ? '출고 요청됨' : item.locationLabel}</td>
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
        {!selected && !result && <p className="text-sm text-slate-400">왼쪽 목록에서 출고할 품목을 선택하세요</p>}
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
              {submitting ? '처리 중...' : '출고 처리'}
            </button>
          </div>
        )}

        {result && (
          <div className="mt-5 rounded-xl border border-purple-200 bg-purple-50 p-4">
            <p className="text-sm text-purple-800">
              <span className="font-semibold">{result.itemName}</span> ({result.quantity}개) →{' '}
              <span className="font-semibold">
                {result.sourceLocationName} ({result.sourceLocationCode})
              </span>{' '}
              에서 출고 등록 완료
            </p>
            <button
              onClick={() => setConfirmOpen(true)}
              className="mt-3 w-full rounded-lg bg-blue-600 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              작업자 호출 (출고 지시)
            </button>
          </div>
        )}
      </div>

      {confirmOpen && (
        <ConfirmDialog
          message="작업자를 호출하여 출고를 지시하시겠습니까?"
          onConfirm={handleCallWorker}
          onCancel={() => setConfirmOpen(false)}
        />
      )}
    </div>
  )
}
