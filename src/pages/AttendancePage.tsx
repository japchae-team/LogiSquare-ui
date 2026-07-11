import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import type { Period } from '../types'

const PERIODS: Period[] = ['일', '주', '월', '년']

type MetricKey = 'callAccepted' | 'tasksHandled' | 'violations'

const METRICS: Record<MetricKey, { label: string; bar: string; text: string }> = {
  callAccepted: { label: '호출 수락 횟수', bar: 'bg-blue-500', text: 'text-blue-600' },
  tasksHandled: { label: '처리 작업 건수', bar: 'bg-emerald-500', text: 'text-emerald-600' },
  violations: { label: '안전 위반 횟수', bar: 'bg-red-500', text: 'text-red-600' },
}

// 백엔드 AttendanceService.PERIOD_DAYS와 동일한 값 — 상세 목록도 같은 기간 기준으로 걸러야 요약 숫자와 일치한다
const PERIOD_DAYS: Record<Period, number> = { 일: 1, 주: 7, 월: 30, 년: 365 }

function periodRange(period: Period) {
  const days = PERIOD_DAYS[period]
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  start.setDate(start.getDate() - (days - 1))
  const end = new Date()
  end.setHours(0, 0, 0, 0)
  end.setDate(end.getDate() + 1)
  return { start, end }
}

function isWithin(iso: string | null, start: Date, end: Date) {
  if (!iso) return false
  const t = new Date(iso).getTime()
  return t >= start.getTime() && t < end.getTime()
}

function formatDateTime(iso: string | null) {
  if (!iso) return '-'
  return new Date(iso).toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

interface WorkerStats {
  workerId: number
  name: string
  status: string
  callAccepted: number
  tasksHandled: number
  violations: number
}

interface AssignmentRecord {
  assignmentId: number
  taskId: number
  status: string
  taskType: string
  itemName: string | null
  quantity: number | null
  sourceLocationCode: string | null
  targetLocationCode: string | null
  calledAt: string
  respondedAt: string | null
  completedAt: string | null
}

interface SafetyEventRecord {
  eventId: number
  eventTypeLabel: string
  statusLabel: string
  storageLocationName: string | null
  workerId: number | null
  occurredAt: string
}

export default function AttendancePage() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [period, setPeriod] = useState<Period>('일')
  const [chartKey, setChartKey] = useState<MetricKey>('tasksHandled')
  const [stats, setStats] = useState<WorkerStats[]>([])
  const [detailMetric, setDetailMetric] = useState<MetricKey | null>(null)

  useEffect(() => {
    fetch(`/api/attendance/workers/stats?period=${encodeURIComponent(period)}`)
      .then((res) => (res.ok ? (res.json() as Promise<WorkerStats[]>) : []))
      .then(setStats)
      .catch(() => setStats([]))
  }, [period])

  const rows = useMemo(() => {
    // 작업자 본인 화면은 이름으로 매칭한다 (로그인 응답의 User.id와 근태 API의 workerId가 서로 다른 PK라 이름으로만 매칭 가능)
    const source = isAdmin ? stats : stats.filter((w) => w.name === user?.name)
    return [...source].sort((a, b) => a.name.localeCompare(b.name, 'ko'))
  }, [stats, isAdmin, user?.name])

  const chartMax = Math.max(...rows.map((r) => r[chartKey]), 1)
  const chartMeta = METRICS[chartKey]

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">근태 관리</h2>
          <p className="text-sm text-slate-500">
            {isAdmin
              ? '작업자별 호출·작업·근태·안전 기록을 확인합니다 (이름 가나다순) — 지표명을 클릭하면 아래 그래프로 확인할 수 있어요'
              : '본인의 호출·작업·근태·안전 기록을 확인합니다'}
          </p>
        </div>
        <div className="flex overflow-hidden rounded-lg border border-slate-300">
          {PERIODS.map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-1.5 text-sm font-medium ${
                period === p ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-8 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">이름</th>
              {isAdmin ? (
                <>
                  <MetricTh
                    label="호출 수락 횟수"
                    charted={chartKey === 'callAccepted'}
                    onClick={() => setChartKey('callAccepted')}
                  />
                  <MetricTh
                    label="처리 작업 건수"
                    charted={chartKey === 'tasksHandled'}
                    onClick={() => setChartKey('tasksHandled')}
                  />
                  <MetricTh
                    label="안전 위반 횟수"
                    charted={chartKey === 'violations'}
                    onClick={() => setChartKey('violations')}
                  />
                </>
              ) : (
                <>
                  <th className="px-4 py-3">호출 수락 횟수</th>
                  <th className="px-4 py-3">처리 작업 건수</th>
                  <th className="px-4 py-3">안전 위반 횟수</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((w) => (
              <tr key={w.workerId} className="border-t border-slate-100">
                <td className="px-4 py-3 font-medium text-slate-800">{w.name}</td>
                {isAdmin ? (
                  <>
                    <td className="px-4 py-3 text-slate-600">{w.callAccepted}</td>
                    <td className="px-4 py-3 text-slate-600">{w.tasksHandled}</td>
                    <td className="px-4 py-3">
                      {w.violations > 0 ? (
                        <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">
                          {w.violations}
                        </span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-4 py-3">
                      <button onClick={() => setDetailMetric('callAccepted')} className="text-blue-600 underline decoration-dotted hover:text-blue-700">
                        {w.callAccepted}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => setDetailMetric('tasksHandled')} className="text-blue-600 underline decoration-dotted hover:text-blue-700">
                        {w.tasksHandled}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setDetailMetric('violations')}
                        className={
                          w.violations > 0
                            ? 'rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700 hover:bg-red-200'
                            : 'text-slate-400 underline decoration-dotted hover:text-slate-600'
                        }
                      >
                        {w.violations}
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isAdmin && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-slate-900">
            작업자별 <span className={chartMeta.text}>{chartMeta.label}</span> ({period} 기준)
          </h3>
          <div className="space-y-3">
            {rows.map((w) => (
              <div key={w.workerId} className="flex items-center gap-3">
                <span className="w-16 shrink-0 text-sm text-slate-600">{w.name}</span>
                <div className="h-5 flex-1 rounded bg-slate-100">
                  <div
                    className={`h-5 rounded transition-all ${chartMeta.bar}`}
                    style={{ width: `${(w[chartKey] / chartMax) * 100}%` }}
                  />
                </div>
                <span className="w-12 shrink-0 text-right text-sm font-semibold text-slate-700">{w[chartKey]}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {detailMetric && rows[0] && (
        <MetricDetailModal
          metric={detailMetric}
          workerId={rows[0].workerId}
          period={period}
          onClose={() => setDetailMetric(null)}
        />
      )}
    </div>
  )
}

function MetricDetailModal({
  metric,
  workerId,
  period,
  onClose,
}: {
  metric: MetricKey
  workerId: number
  period: Period
  onClose: () => void
}) {
  const [loading, setLoading] = useState(true)
  const [assignments, setAssignments] = useState<AssignmentRecord[]>([])
  const [events, setEvents] = useState<SafetyEventRecord[]>([])

  useEffect(() => {
    setLoading(true)
    if (metric === 'violations') {
      fetch('/api/safety/events')
        .then((res) => (res.ok ? (res.json() as Promise<{ events?: SafetyEventRecord[] }>) : null))
        .then((data) => setEvents(data?.events ?? []))
        .catch(() => setEvents([]))
        .finally(() => setLoading(false))
    } else {
      fetch(`/api/workers/${workerId}/assignments`)
        .then((res) => (res.ok ? (res.json() as Promise<AssignmentRecord[]>) : []))
        .then(setAssignments)
        .catch(() => setAssignments([]))
        .finally(() => setLoading(false))
    }
  }, [metric, workerId])

  const { start, end } = periodRange(period)

  // 백엔드 AttendanceService와 동일하게: 호출 수락은 ACCEPTED 이상(거절 제외), 처리 작업은 COMPLETED만 집계
  const filteredAssignments = assignments.filter((a) => {
    if (metric === 'callAccepted') {
      return (a.status === 'ACCEPTED' || a.status === 'COMPLETED') && isWithin(a.respondedAt, start, end)
    }
    return a.status === 'COMPLETED' && isWithin(a.completedAt, start, end)
  })
  const filteredEvents = events.filter((e) => e.workerId === workerId && isWithin(e.occurredAt, start, end))

  const meta = METRICS[metric]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="max-h-[80vh] w-full max-w-md overflow-y-auto rounded-xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">
            <span className={meta.text}>{meta.label}</span> 상세 ({period} 기준)
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600" aria-label="닫기">
            ✕
          </button>
        </div>

        {loading && <p className="text-sm text-slate-400">불러오는 중...</p>}

        {!loading && metric !== 'violations' && (
          <ul className="space-y-2">
            {filteredAssignments.length === 0 && <p className="text-sm text-slate-400">해당 기간 내역이 없습니다</p>}
            {filteredAssignments.map((a) => (
              <li key={a.assignmentId} className="rounded-lg border border-slate-200 p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800">{a.itemName ?? '-'}</span>
                  <span className="text-xs text-slate-400">{a.taskType === 'INBOUND' ? '입고' : '출고'}</span>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {a.quantity}개 · {a.taskType === 'INBOUND' ? a.targetLocationCode : a.sourceLocationCode}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  {formatDateTime(metric === 'callAccepted' ? a.respondedAt : a.completedAt)}
                </p>
              </li>
            ))}
          </ul>
        )}

        {!loading && metric === 'violations' && (
          <ul className="space-y-2">
            {filteredEvents.length === 0 && <p className="text-sm text-slate-400">해당 기간 내역이 없습니다</p>}
            {filteredEvents.map((e) => (
              <li key={e.eventId} className="rounded-lg border border-slate-200 p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-red-700">{e.eventTypeLabel}</span>
                  <span className="text-xs text-slate-400">{e.statusLabel}</span>
                </div>
                <p className="mt-1 text-xs text-slate-500">{e.storageLocationName ?? '-'}</p>
                <p className="mt-1 text-xs text-slate-400">{formatDateTime(e.occurredAt)}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function MetricTh({ label, charted, onClick }: { label: string; charted: boolean; onClick: () => void }) {
  return (
    <th
      className={`cursor-pointer select-none px-4 py-3 hover:text-slate-700 ${charted ? 'bg-blue-50 text-blue-700' : ''}`}
      onClick={onClick}
    >
      <span className="inline-flex items-center gap-1">
        {charted && <span>📊</span>}
        {label}
      </span>
    </th>
  )
}
