import { useState, type FormEvent } from 'react'
import { GRADE_COLOR } from '../../data/mockData'
import { useToast } from '../../context/ToastContext'
import ConfirmDialog from '../../components/ConfirmDialog'
import type { Grade } from '../../types'

interface InboundRecommendResult {
  taskId: number
  itemName: string
  quantity: number
  recommendedGrade: Grade
  locationCode: string
  locationName: string
}

interface TaskCallResult {
  workerName: string
}

export default function InboundPage() {
  const [name, setName] = useState('')
  const [qty, setQty] = useState('')
  const [result, setResult] = useState<InboundRecommendResult | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const { showToast } = useToast()

  const canSubmit = name.trim() !== '' && Number(qty) > 0 && !submitting

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/inbound/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemName: name.trim(), quantity: Number(qty) }),
      })
      if (!res.ok) {
        showToast('입고 등록에 실패했습니다', 'alert')
        return
      }
      const data = (await res.json()) as InboundRecommendResult
      setResult(data)
      showToast('입고 등록 완료')
      setName('')
      setQty('')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleCallWorker() {
    setConfirmOpen(false)
    if (!result) return
    const res = await fetch(`/api/tasks/${result.taskId}/inbound-call`, { method: 'POST' })
    if (!res.ok) {
      showToast('현재 가용한 작업자가 없습니다', 'alert')
      return
    }
    const calls = (await res.json()) as TaskCallResult[]
    if (calls.length === 0) {
      showToast('현재 가용한 작업자가 없습니다', 'alert')
      return
    }
    showToast(`${calls.map((c) => c.workerName).join(', ')} 작업자에게 입고 호출을 전송했습니다`)
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
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
          disabled={!canSubmit}
          className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {submitting ? '등록 중...' : '입고 등록'}
        </button>

        {result && (
          <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <div className="mb-2 flex items-center gap-2">
              <span className={`rounded px-2 py-0.5 text-xs font-bold text-white ${GRADE_COLOR[result.recommendedGrade].bg}`}>
                {result.recommendedGrade}등급
              </span>
              <span className="text-sm text-slate-600">{GRADE_COLOR[result.recommendedGrade].label}</span>
            </div>
            <p className="text-sm text-emerald-800">
              <span className="font-semibold">{result.itemName}</span> ({result.quantity}개) →{' '}
              <span className="font-semibold">
                {result.locationName} ({result.locationCode})
              </span>{' '}
              배치 완료
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
