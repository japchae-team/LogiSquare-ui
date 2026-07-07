import { useCalls } from '../context/CallContext'
import { useToast } from '../context/ToastContext'
import type { CallTaskType } from '../types'

const TASK_TYPE_STYLE: Record<CallTaskType, string> = {
  입고: 'bg-blue-100 text-blue-700',
  출고: 'bg-purple-100 text-purple-700',
}

function TaskTypeBadge({ taskType }: { taskType: CallTaskType }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${TASK_TYPE_STYLE[taskType]}`}>{taskType}</span>
  )
}

export default function CallApprovalPage() {
  const { calls, acceptCall, completeCall } = useCalls()
  const { showToast } = useToast()

  const pending = calls.filter((c) => c.status === '대기')
  const inProgress = calls.filter((c) => c.status === '승인')
  const completed = calls.filter((c) => c.status === '완료')

  function handleAccept(id: string) {
    acceptCall(id)
    showToast('호출을 승인했습니다')
  }

  function handleComplete(id: string) {
    completeCall(id)
    showToast('작업 처리완료로 등록했습니다')
  }

  return (
    <div>
      <h2 className="mb-1 text-2xl font-bold text-slate-900">호출 승인</h2>
      <p className="mb-6 text-sm text-slate-500">배정된 호출 요청을 확인하고 승인·처리완료를 입력하세요</p>

      <h3 className="mb-3 text-sm font-semibold text-slate-700">대기 중인 호출 ({pending.length})</h3>
      <div className="mb-8 space-y-3">
        {pending.length === 0 && <p className="text-sm text-slate-400">대기 중인 호출이 없습니다</p>}
        {pending.map((c) => (
          <div
            key={c.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4"
          >
            <div>
              <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <TaskTypeBadge taskType={c.taskType} />
                {c.itemName}
              </p>
              <p className="text-xs text-slate-500">
                위치 {c.location} · 요청 시각 {c.requestedAt}
              </p>
            </div>
            <button
              onClick={() => handleAccept(c.id)}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              승인
            </button>
          </div>
        ))}
      </div>

      <h3 className="mb-3 text-sm font-semibold text-slate-700">진행 중인 작업 ({inProgress.length})</h3>
      <div className="mb-8 space-y-3">
        {inProgress.length === 0 && <p className="text-sm text-slate-400">진행 중인 작업이 없습니다</p>}
        {inProgress.map((c) => (
          <div
            key={c.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4"
          >
            <div>
              <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <TaskTypeBadge taskType={c.taskType} />
                {c.itemName}
              </p>
              <p className="text-xs text-slate-500">위치 {c.location}</p>
            </div>
            <button
              onClick={() => handleComplete(c.id)}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              처리완료
            </button>
          </div>
        ))}
      </div>

      <h3 className="mb-3 text-sm font-semibold text-slate-700">처리완료 ({completed.length})</h3>
      <div className="space-y-3">
        {completed.length === 0 && <p className="text-sm text-slate-400">처리완료된 작업이 없습니다</p>}
        {completed.map((c) => (
          <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4">
            <div>
              <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <TaskTypeBadge taskType={c.taskType} />
                {c.itemName}
              </p>
              <p className="text-xs text-slate-500">위치 {c.location}</p>
            </div>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">처리완료</span>
          </div>
        ))}
      </div>
    </div>
  )
}
