import { useMemo, useState } from 'react'
import { useSafety } from '../context/SafetyContext'
import type { ViolationLog, ViolationType } from '../types'

const TYPE_STYLE: Record<ViolationType, { bg: string; text: string; icon: string }> = {
  '보호장비 미착용': { bg: 'bg-orange-500', text: 'text-orange-700', icon: '⛑️' },
  '위험구역 침입': { bg: 'bg-red-600', text: 'text-red-700', icon: '🚧' },
}

export default function SafetyPage() {
  const { logs, liveAlerts, triggerViolation, resolveViolation } = useSafety()
  const [ppeSearch, setPpeSearch] = useState('')
  const [zoneSearch, setZoneSearch] = useState('')

  const activeViolations = logs.filter((l) => l.active)

  const ppeLogs = useMemo(
    () =>
      logs.filter(
        (l) => l.type === '보호장비 미착용' && (ppeSearch.trim() === '' || l.zone.toLowerCase().includes(ppeSearch.trim().toLowerCase())),
      ),
    [logs, ppeSearch],
  )

  const zoneLogs = useMemo(
    () =>
      logs.filter(
        (l) => l.type === '위험구역 침입' && (zoneSearch.trim() === '' || l.zone.toLowerCase().includes(zoneSearch.trim().toLowerCase())),
      ),
    [logs, zoneSearch],
  )

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">안전 관리</h2>
          <p className="text-sm text-slate-500">실시간 위반 현황과 이력을 관리합니다</p>
        </div>
        <button
          onClick={triggerViolation}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
        >
          새 위반 시뮬레이션
        </button>
      </div>

      <h3 className="mb-3 text-sm font-semibold text-slate-700">현재 발생 중인 위반 ({activeViolations.length})</h3>
      <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {activeViolations.length === 0 && (
          <p className="col-span-full text-sm text-slate-400">현재 발생 중인 위반이 없습니다</p>
        )}
        {activeViolations.map((v) => {
          const style = TYPE_STYLE[v.type]
          return (
            <div key={v.id} className={`animate-pulse rounded-xl border-2 border-red-300 bg-red-50 p-4`}>
              <div className="flex items-center gap-2">
                <span className={`flex h-8 w-8 items-center justify-center rounded-full text-white ${style.bg}`}>
                  {style.icon}
                </span>
                <div>
                  <p className={`text-sm font-bold ${style.text}`}>{v.type}</p>
                  <p className="text-xs text-slate-500">{v.zone}</p>
                </div>
              </div>
              <p className="mt-2 text-xs text-slate-400">{v.time}</p>
              <button
                onClick={() => resolveViolation(v.id)}
                className="mt-3 w-full rounded-lg bg-white py-1.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-300 hover:bg-slate-50"
              >
                조치 완료 처리
              </button>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ViolationLogTable
          title="보호장비 미착용"
          logs={ppeLogs}
          search={ppeSearch}
          onSearchChange={setPpeSearch}
        />
        <ViolationLogTable
          title="위험구역 침입"
          logs={zoneLogs}
          search={zoneSearch}
          onSearchChange={setZoneSearch}
        />
      </div>

      <div className="pointer-events-none fixed inset-x-4 top-4 z-50 flex flex-col gap-2 sm:inset-x-auto sm:right-6 sm:top-6 sm:w-80">
        {liveAlerts.map((v) => {
          const style = TYPE_STYLE[v.type]
          return (
            <div
              key={v.id}
              className="pointer-events-auto flex items-center gap-3 rounded-xl border-2 border-red-400 bg-white p-3 shadow-xl"
            >
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white ${style.bg}`}>
                {style.icon}
              </span>
              <div>
                <p className="text-sm font-bold text-red-600">위반 감지: {v.type}</p>
                <p className="text-xs text-slate-500">{v.zone} · {v.time}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ViolationLogTable({
  title,
  logs,
  search,
  onSearchChange,
}: {
  title: string
  logs: ViolationLog[]
  search: string
  onSearchChange: (value: string) => void
}) {
  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-slate-700">
          {title} ({logs.length})
        </h3>
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="구역 검색"
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none"
        />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[480px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">캡처 이미지</th>
              <th className="px-4 py-3">발생 시각</th>
              <th className="px-4 py-3">구역</th>
              <th className="px-4 py-3">상태</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((v) => {
              const style = TYPE_STYLE[v.type]
              return (
                <tr key={v.id} className="border-t border-slate-100">
                  <td className="px-4 py-3">
                    <div className={`flex h-10 w-14 items-center justify-center rounded-md text-white ${style.bg}`}>
                      {style.icon}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{v.time}</td>
                  <td className="px-4 py-3 text-slate-600">{v.zone}</td>
                  <td className="px-4 py-3">
                    {v.active ? (
                      <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">진행 중</span>
                    ) : (
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">조치 완료</span>
                    )}
                  </td>
                </tr>
              )
            })}
            {logs.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-400">
                  검색 결과가 없습니다
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
