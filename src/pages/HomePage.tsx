import { useEffect, useState, type ReactNode } from 'react'
import StatCard from '../components/StatCard'
import { useAuth } from '../context/AuthContext'

type CardKey = 'progress' | 'workers' | 'safety' | 'inbound' | 'calls'

interface DashboardTaskItem {
  taskId: number
  itemName: string
  quantity: number
  status: string
}

interface DashboardWorkerItem {
  workerId: number
  employeeNo: string
  name: string
  status: string
}

interface DashboardSafetyItem {
  safetyEventId: number
  eventType: string
  locationCode: string
  workerName: string
  occurredAt: string
}

interface DashboardInboundItem {
  taskId: number
  itemId: number
  itemName: string
  quantity: number
  targetLocationCode: string
  requestedAt: string
}

interface DashboardSummary {
  inProgressTaskCount: number
  availableWorkerCount: number
  safetyViolationCount: number
  pendingInboundCount: number
  inProgressTasks: DashboardTaskItem[]
  availableWorkers: DashboardWorkerItem[]
  safetyViolations: DashboardSafetyItem[]
  pendingInbounds: DashboardInboundItem[]
}

interface WorkerStats {
  workerId: number
  name: string
}

interface MyCall {
  assignmentId: number
  status: string
  taskType: string
  itemName: string
  quantity: number
  sourceLocationCode: string | null
  targetLocationCode: string | null
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
}

export default function HomePage() {
  const { user } = useAuth()
  const [openCard, setOpenCard] = useState<CardKey | null>(null)
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [myCalls, setMyCalls] = useState<MyCall[]>([])
  const isAdmin = user?.role === 'admin'

  useEffect(() => {
    fetch('/api/dashboard/summary')
      .then((res) => (res.ok ? (res.json() as Promise<DashboardSummary>) : null))
      .then(setSummary)
      .catch(() => setSummary(null))
  }, [])

  useEffect(() => {
    if (isAdmin || !user) return
    fetch('/api/attendance/workers/stats')
      .then((res) => (res.ok ? (res.json() as Promise<WorkerStats[]>) : []))
      .then((workers) => {
        const self = workers.find((w) => w.name === user.name)
        if (!self) return
        return fetch(`/api/tasks/my-calls?workerId=${self.workerId}`)
          .then((res) => (res.ok ? (res.json() as Promise<MyCall[]>) : []))
          .then(setMyCalls)
      })
      .catch(() => setMyCalls([]))
  }, [isAdmin, user])

  const pendingCalls = myCalls.filter((c) => c.status === 'CALLED')

  function toggle(key: CardKey) {
    setOpenCard((prev) => (prev === key ? null : key))
  }

  return (
    <div>
      <h2 className="mb-1 text-2xl font-bold text-slate-900">메인 홈</h2>
      <p className="mb-6 text-sm text-slate-500">전체 현황을 한눈에 확인하세요</p>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="진행 중 작업 수"
          value={summary?.inProgressTaskCount ?? 0}
          accent="text-blue-600"
          active={openCard === 'progress'}
          onClick={() => toggle('progress')}
        />
        <StatCard
          label="가용 작업자 수"
          value={summary?.availableWorkerCount ?? 0}
          unit="명"
          accent="text-emerald-600"
          active={openCard === 'workers'}
          onClick={() => toggle('workers')}
        />
        <StatCard
          label="안전 위반 건수"
          value={summary?.safetyViolationCount ?? 0}
          accent="text-red-600"
          active={openCard === 'safety'}
          onClick={() => toggle('safety')}
        />
        {isAdmin ? (
          <StatCard
            label="입고 대기 건수"
            value={summary?.pendingInboundCount ?? 0}
            accent="text-amber-600"
            active={openCard === 'inbound'}
            onClick={() => toggle('inbound')}
          />
        ) : (
          <StatCard
            label="대기 중인 호출"
            value={pendingCalls.length}
            accent="text-amber-600"
            active={openCard === 'calls'}
            onClick={() => toggle('calls')}
          />
        )}
      </div>

      {openCard && (
        <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          {openCard === 'progress' && (
            <SummaryBlock title="진행 중인 작업 현황">
              {(summary?.inProgressTasks.length ?? 0) === 0 && <EmptyRow text="진행 중인 작업이 없습니다" />}
              {summary?.inProgressTasks.map((t) => (
                <Row key={t.taskId} left={`${t.itemName} · ${t.quantity}개`} right={t.status} tone="blue" />
              ))}
              <MoreNote shown={summary?.inProgressTasks.length ?? 0} total={summary?.inProgressTaskCount ?? 0} />
            </SummaryBlock>
          )}

          {openCard === 'workers' && (
            <SummaryBlock title="가용 작업자 현황">
              {(summary?.availableWorkers.length ?? 0) === 0 && <EmptyRow text="가용한 작업자가 없습니다" />}
              {summary?.availableWorkers.map((w) => (
                <Row key={w.workerId} left={w.name} right="가용" tone="emerald" />
              ))}
              <MoreNote shown={summary?.availableWorkers.length ?? 0} total={summary?.availableWorkerCount ?? 0} />
            </SummaryBlock>
          )}

          {openCard === 'safety' && (
            <SummaryBlock title="현재 발생 중인 안전 위반">
              {(summary?.safetyViolations.length ?? 0) === 0 && <EmptyRow text="현재 발생 중인 위반이 없습니다" />}
              {summary?.safetyViolations.map((v) => (
                <Row
                  key={v.safetyEventId}
                  left={`${v.eventType} · ${v.locationCode}`}
                  right={formatTime(v.occurredAt)}
                  tone="red"
                />
              ))}
              <MoreNote shown={summary?.safetyViolations.length ?? 0} total={summary?.safetyViolationCount ?? 0} />
            </SummaryBlock>
          )}

          {openCard === 'inbound' && (
            <SummaryBlock title="입고 대기 품목">
              {(summary?.pendingInbounds.length ?? 0) === 0 && <EmptyRow text="입고 대기 품목이 없습니다" />}
              {summary?.pendingInbounds.map((it) => (
                <Row key={it.taskId} left={`${it.itemName} · ${it.quantity}개`} right={formatTime(it.requestedAt)} tone="amber" />
              ))}
              <MoreNote shown={summary?.pendingInbounds.length ?? 0} total={summary?.pendingInboundCount ?? 0} />
            </SummaryBlock>
          )}

          {openCard === 'calls' && (
            <SummaryBlock title="대기 중인 호출">
              {pendingCalls.length === 0 && <EmptyRow text="대기 중인 호출이 없습니다" />}
              {pendingCalls.map((c) => (
                <Row
                  key={c.assignmentId}
                  left={`[${c.taskType === 'INBOUND' ? '입고' : '출고'}] ${c.itemName} · ${c.quantity}개`}
                  right={c.targetLocationCode ?? c.sourceLocationCode ?? '-'}
                  tone="amber"
                />
              ))}
            </SummaryBlock>
          )}
        </div>
      )}
    </div>
  )
}

function SummaryBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold text-slate-700">{title}</h3>
      <div className="divide-y divide-slate-100">{children}</div>
    </div>
  )
}

function Row({ left, right, tone }: { left: string; right: string; tone: 'blue' | 'emerald' | 'red' | 'amber' }) {
  const toneClass = {
    blue: 'text-blue-600',
    emerald: 'text-emerald-600',
    red: 'text-red-600',
    amber: 'text-amber-600',
  }[tone]
  return (
    <div className="flex items-center justify-between py-2.5 text-sm">
      <span className="font-medium text-slate-700">{left}</span>
      <span className={`font-semibold ${toneClass}`}>{right}</span>
    </div>
  )
}

function EmptyRow({ text }: { text: string }) {
  return <p className="py-2.5 text-sm text-slate-400">{text}</p>
}

function MoreNote({ shown, total }: { shown: number; total: number }) {
  const remaining = total - shown
  if (remaining <= 0) return null
  return <p className="pt-2.5 text-xs text-slate-400">외 {remaining}건 더보기 (최근 {shown}건만 표시됩니다)</p>
}
