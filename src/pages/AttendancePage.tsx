import { useMemo, useState } from 'react'
import { workers } from '../data/mockData'
import { useAuth } from '../context/AuthContext'
import type { Period } from '../types'

const PERIODS: Period[] = ['일', '주', '월', '년']
const PERIOD_MULTIPLIER: Record<Period, number> = { 일: 1, 주: 5, 월: 20, 년: 240 }

type MetricKey = 'callAccepted' | 'tasksHandled' | 'violations'

const METRICS: Record<MetricKey, { label: string; bar: string; text: string }> = {
  callAccepted: { label: '호출 수락 횟수', bar: 'bg-blue-500', text: 'text-blue-600' },
  tasksHandled: { label: '처리 작업 건수', bar: 'bg-emerald-500', text: 'text-emerald-600' },
  violations: { label: '안전 위반 횟수', bar: 'bg-red-500', text: 'text-red-600' },
}

export default function AttendancePage() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [period, setPeriod] = useState<Period>('일')
  const [chartKey, setChartKey] = useState<MetricKey>('tasksHandled')

  const multiplier = PERIOD_MULTIPLIER[period]

  const rows = useMemo(() => {
    // 관리자 화면은 mock 작업자 목록으로 시연하고, 본인 화면은 실제 로그인 계정 이름만 표시한다
    // (근태/작업 실적을 계정별로 조회하는 백엔드 API가 아직 없어 수치는 임시로 0)
    if (!isAdmin) {
      return user ? [{ id: user.id, name: user.name, status: '가용' as const, callAccepted: 0, tasksHandled: 0, checkIn: '-', checkOut: '-', violations: 0 }] : []
    }
    const withPeriod = workers.map((w) => ({
      ...w,
      callAccepted: w.callAccepted * multiplier,
      tasksHandled: w.tasksHandled * multiplier,
      violations: period === '일' ? w.violations : Math.round((w.violations * multiplier) / 3),
    }))
    return withPeriod.sort((a, b) => a.name.localeCompare(b.name, 'ko'))
  }, [multiplier, period, isAdmin, user])

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
              <th className="px-4 py-3">출근</th>
              <th className="px-4 py-3">퇴근</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((w) => (
              <tr key={w.id} className="border-t border-slate-100">
                <td className="px-4 py-3 font-medium text-slate-800">{w.name}</td>
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
                <td className="px-4 py-3 text-slate-600">{w.checkIn}</td>
                <td className="px-4 py-3 text-slate-600">{w.checkOut}</td>
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
              <div key={w.id} className="flex items-center gap-3">
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
