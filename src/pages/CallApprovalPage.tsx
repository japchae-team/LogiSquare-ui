import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

interface WorkerStats {
  workerId: number
  name: string
}

interface Assignment {
  assignmentId: number
  taskId: number
  status: string
  taskType: string
  itemName: string
  quantity: number
  sourceLocationCode: string | null
  targetLocationCode: string | null
  calledAt: string
}

const TASK_TYPE_LABEL: Record<string, string> = {
  INBOUND: '입고',
  OUTBOUND: '출고',
}

const TASK_TYPE_STYLE: Record<string, string> = {
  INBOUND: 'bg-blue-100 text-blue-700',
  OUTBOUND: 'bg-purple-100 text-purple-700',
}

function TaskTypeBadge({ taskType }: { taskType: string }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${TASK_TYPE_STYLE[taskType] ?? 'bg-slate-100 text-slate-700'}`}>
      {TASK_TYPE_LABEL[taskType] ?? taskType}
    </span>
  )
}

function locationOf(a: Assignment) {
  return a.targetLocationCode ?? a.sourceLocationCode ?? '-'
}

export default function CallApprovalPage() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const [workerId, setWorkerId] = useState<number | null>(null)
  const [assignments, setAssignments] = useState<Assignment[]>([])

  const loadAssignments = useCallback(async (id: number) => {
    const res = await fetch(`/api/tasks/my-calls?workerId=${id}`)
    if (res.ok) setAssignments(await res.json())
  }, [])

  useEffect(() => {
    if (!user) return
    fetch('/api/attendance/workers/stats')
      .then((res) => (res.ok ? (res.json() as Promise<WorkerStats[]>) : []))
      .then((workers) => {
        const self = workers.find((w) => w.name === user.name)
        if (self) setWorkerId(self.workerId)
      })
  }, [user])

  useEffect(() => {
    if (workerId !== null) loadAssignments(workerId)
  }, [workerId, loadAssignments])

  const pending = assignments.filter((a) => a.status === 'CALLED')
  const inProgress = assignments.filter((a) => a.status === 'ACCEPTED')
  const completed = assignments.filter((a) => a.status === 'COMPLETED')

  async function handleAccept(assignmentId: number) {
    const res = await fetch(`/api/task-assignments/${assignmentId}/accept`, { method: 'PATCH' })
    if (!res.ok) {
      showToast('승인 처리에 실패했습니다', 'alert')
      return
    }
    showToast('호출을 승인했습니다')
    if (workerId !== null) loadAssignments(workerId)
  }

  async function handleReject(assignmentId: number) {
    const res = await fetch(`/api/task-assignments/${assignmentId}/reject`, { method: 'PATCH' })
    if (!res.ok) {
      showToast('거절 처리에 실패했습니다', 'alert')
      return
    }
    showToast('호출을 거절했습니다')
    if (workerId !== null) loadAssignments(workerId)
  }

  async function handleComplete(taskId: number) {
    const res = await fetch(`/api/tasks/${taskId}/complete`, { method: 'PATCH' })
    if (!res.ok) {
      showToast('처리완료 등록에 실패했습니다', 'alert')
      return
    }
    showToast('작업 처리완료로 등록했습니다')
    if (workerId !== null) loadAssignments(workerId)
  }

  return (
    <div>
      <h2 className="mb-1 text-2xl font-bold text-slate-900">호출 승인</h2>
      <p className="mb-6 text-sm text-slate-500">배정된 호출 요청을 확인하고 승인·처리완료를 입력하세요</p>

      <h3 className="mb-3 text-sm font-semibold text-slate-700">대기 중인 호출 ({pending.length})</h3>
      <div className="mb-8 space-y-3">
        {pending.length === 0 && <p className="text-sm text-slate-400">대기 중인 호출이 없습니다</p>}
        {pending.map((a) => (
          <div
            key={a.assignmentId}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4"
          >
            <div>
              <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <TaskTypeBadge taskType={a.taskType} />
                {a.itemName} · {a.quantity}개
              </p>
              <p className="text-xs text-slate-500">위치 {locationOf(a)}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleReject(a.assignmentId)}
                className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-600 ring-1 ring-slate-300 hover:bg-slate-50"
              >
                거절
              </button>
              <button
                onClick={() => handleAccept(a.assignmentId)}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                승인
              </button>
            </div>
          </div>
        ))}
      </div>

      <h3 className="mb-3 text-sm font-semibold text-slate-700">진행 중인 작업 ({inProgress.length})</h3>
      <div className="mb-8 space-y-3">
        {inProgress.length === 0 && <p className="text-sm text-slate-400">진행 중인 작업이 없습니다</p>}
        {inProgress.map((a) => (
          <div
            key={a.assignmentId}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4"
          >
            <div>
              <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <TaskTypeBadge taskType={a.taskType} />
                {a.itemName} · {a.quantity}개
              </p>
              <p className="text-xs text-slate-500">위치 {locationOf(a)}</p>
            </div>
            <button
              onClick={() => handleComplete(a.taskId)}
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
        {completed.map((a) => (
          <div key={a.assignmentId} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4">
            <div>
              <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <TaskTypeBadge taskType={a.taskType} />
                {a.itemName} · {a.quantity}개
              </p>
              <p className="text-xs text-slate-500">위치 {locationOf(a)}</p>
            </div>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">처리완료</span>
          </div>
        ))}
      </div>
    </div>
  )
}
