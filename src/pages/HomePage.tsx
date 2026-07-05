import { useState, type ReactNode } from 'react'
import StatCard from '../components/StatCard'
import { useAuth } from '../context/AuthContext'
import { useCalls } from '../context/CallContext'
import { useSafety } from '../context/SafetyContext'
import { pendingInbound, workers } from '../data/mockData'

type CardKey = 'progress' | 'workers' | 'safety' | 'inbound' | 'calls'

export default function HomePage() {
  const { user } = useAuth()
  const { calls } = useCalls()
  const { logs } = useSafety()
  const [openCard, setOpenCard] = useState<CardKey | null>(null)
  const isAdmin = user?.role === 'admin'

  const availableWorkers = workers.filter((w) => w.status === '가용')
  const busyWorkers = workers.filter((w) => w.status === '작업중')
  const acceptedCalls = calls.filter((c) => c.status === '승인')
  const pendingCalls = calls.filter((c) => c.status === '대기')
  const activeViolations = logs.filter((v) => v.active)

  const inProgressCount = busyWorkers.length + acceptedCalls.length

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
          value={inProgressCount}
          accent="text-blue-600"
          active={openCard === 'progress'}
          onClick={() => toggle('progress')}
        />
        <StatCard
          label="가용 작업자 수"
          value={availableWorkers.length}
          unit="명"
          accent="text-emerald-600"
          active={openCard === 'workers'}
          onClick={() => toggle('workers')}
        />
        <StatCard
          label="안전 위반 건수"
          value={activeViolations.length}
          accent="text-red-600"
          active={openCard === 'safety'}
          onClick={() => toggle('safety')}
        />
        {isAdmin ? (
          <StatCard
            label="입고 대기 건수"
            value={pendingInbound.length}
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
              {busyWorkers.length === 0 && acceptedCalls.length === 0 && <EmptyRow text="진행 중인 작업이 없습니다" />}
              {busyWorkers.map((w) => (
                <Row key={w.id} left={w.name} right="작업중" tone="blue" />
              ))}
              {acceptedCalls.map((c) => (
                <Row key={c.id} left={`[${c.taskType}] ${c.itemName} · ${c.workerName}`} right={c.location} tone="blue" />
              ))}
            </SummaryBlock>
          )}

          {openCard === 'workers' && (
            <SummaryBlock title="가용 작업자 현황">
              {availableWorkers.length === 0 && <EmptyRow text="가용한 작업자가 없습니다" />}
              {availableWorkers.map((w) => (
                <Row key={w.id} left={w.name} right={`출근 ${w.checkIn}`} tone="emerald" />
              ))}
            </SummaryBlock>
          )}

          {openCard === 'safety' && (
            <SummaryBlock title="현재 발생 중인 안전 위반">
              {activeViolations.length === 0 && <EmptyRow text="현재 발생 중인 위반이 없습니다" />}
              {activeViolations.map((v) => (
                <Row key={v.id} left={`${v.type} · ${v.zone}`} right={v.time} tone="red" />
              ))}
            </SummaryBlock>
          )}

          {openCard === 'inbound' && (
            <SummaryBlock title="입고 대기 품목">
              {pendingInbound.length === 0 && <EmptyRow text="입고 대기 품목이 없습니다" />}
              {pendingInbound.map((it) => (
                <Row key={it.id} left={`${it.name} · ${it.qty}개`} right={it.requestedAt} tone="amber" />
              ))}
            </SummaryBlock>
          )}

          {openCard === 'calls' && (
            <SummaryBlock title="대기 중인 호출">
              {pendingCalls.length === 0 && <EmptyRow text="대기 중인 호출이 없습니다" />}
              {pendingCalls.map((c) => (
                <Row key={c.id} left={`[${c.taskType}] ${c.itemName} · ${c.location}`} right={c.requestedAt} tone="amber" />
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
