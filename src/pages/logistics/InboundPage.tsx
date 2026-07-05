import { useState, type FormEvent } from 'react'
import { GRADE_COLOR } from '../../data/mockData'
import { useInventory } from '../../context/InventoryContext'
import { useCalls } from '../../context/CallContext'
import { useToast } from '../../context/ToastContext'
import ConfirmDialog from '../../components/ConfirmDialog'
import type { Grade, Slot } from '../../types'

function slotLabel(slot: Slot) {
  return `${slot.grade}구역 ${slot.row + 1}행 ${slot.col + 1}열 (${slot.id})`
}

export default function InboundPage() {
  const [name, setName] = useState('')
  const [qty, setQty] = useState('')
  const [suggestion, setSuggestion] = useState<{ grade: Grade; slot: Slot | null } | null>(null)
  const [saved, setSaved] = useState<{ name: string; slot: Slot } | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const { previewPlacement, placeItem } = useInventory()
  const { sendCall } = useCalls()
  const { showToast } = useToast()

  const canCheck = name.trim() !== '' && Number(qty) > 0

  function handleCheck(e: FormEvent) {
    e.preventDefault()
    if (!canCheck) return
    setSuggestion(previewPlacement(Number(qty)))
    setSaved(null)
  }

  function handleSave() {
    if (!canCheck) return
    const result = placeItem(name.trim(), Number(qty))
    if (!result.ok || !result.slot) {
      showToast('해당 등급의 빈 슬롯이 없습니다', 'alert')
      return
    }
    showToast('배치 완료')
    setSaved({ name: name.trim(), slot: result.slot })
    setName('')
    setQty('')
    setSuggestion(null)
  }

  function handleCallWorker() {
    setConfirmOpen(false)
    if (!saved) return
    const call = sendCall(saved.name, slotLabel(saved.slot), '입고')
    if (call) {
      showToast(`${call.workerName} 작업자에게 입고 호출을 전송했습니다`)
    } else {
      showToast('현재 가용한 작업자가 없습니다', 'alert')
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <form onSubmit={handleCheck} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-base font-semibold text-slate-900">신규 입고 품목</h3>

        <label className="mb-1 block text-sm font-medium text-slate-700">품목명</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="예: 무선 키보드"
          className="mb-4 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
        />

        <label className="mb-1 block text-sm font-medium text-slate-700">수량</label>
        <input
          type="number"
          min={1}
          value={qty}
          onChange={(e) => setQty(e.target.value)}
          placeholder="예: 120"
          className="mb-4 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
        />

        <button
          type="submit"
          disabled={!canCheck}
          className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          배치 위치 확인
        </button>

        {suggestion && (
          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-2 flex items-center gap-2">
              <span className={`rounded px-2 py-0.5 text-xs font-bold text-white ${GRADE_COLOR[suggestion.grade].bg}`}>
                {suggestion.grade}등급
              </span>
              <span className="text-sm text-slate-600">{GRADE_COLOR[suggestion.grade].label}</span>
            </div>
            {suggestion.slot ? (
              <p className="text-sm text-slate-700">
                권장 배치 위치: <span className="font-semibold">{slotLabel(suggestion.slot)}</span>
              </p>
            ) : (
              <p className="text-sm font-medium text-red-600">해당 등급 구역에 빈 슬롯이 없습니다</p>
            )}
            <button
              onClick={handleSave}
              disabled={!suggestion.slot}
              className="mt-4 w-full rounded-lg bg-emerald-600 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              저장
            </button>
          </div>
        )}

        {saved && (
          <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-sm text-emerald-800">
              <span className="font-semibold">{saved.name}</span> → {slotLabel(saved.slot)} 배치 완료
            </p>
            <button
              onClick={() => setConfirmOpen(true)}
              className="mt-3 w-full rounded-lg bg-blue-600 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              작업자 호출 (입고 지시)
            </button>
          </div>
        )}
      </form>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-base font-semibold text-slate-900">등급 안내</h3>
        <ul className="space-y-3 text-sm text-slate-600">
          <li>수량 150개 이상 → <b className="text-rose-600">A등급</b> (입구 인접, 고회전 구역)</li>
          <li>수량 50~149개 → <b className="text-amber-600">B등급</b> (중간 구역)</li>
          <li>수량 49개 이하 → <b className="text-emerald-600">C등급</b> (안쪽, 저회전 구역)</li>
        </ul>
      </div>

      {confirmOpen && (
        <ConfirmDialog
          message="작업자를 호출하여 입고 배치를 지시하시겠습니까?"
          onConfirm={handleCallWorker}
          onCancel={() => setConfirmOpen(false)}
        />
      )}
    </div>
  )
}
