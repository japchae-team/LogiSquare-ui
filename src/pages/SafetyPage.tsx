import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { playAlertBeep } from '../utils/sound'

const RESOLVED_STATUSES = new Set(['RESOLVED', 'CLEAR'])

interface SafetyEventSummary {
  eventId: number
  eventType: string
  eventTypeLabel: string
  status: string
  statusLabel: string
  storageLocationId: number | null
  storageLocationCode: string | null
  storageLocationName: string | null
  captureUrl: string | null
  workerId: number | null
  workerEmployeeNo: string | null
  workerName: string | null
  occurredAt: string
  resolvedAt: string | null
}

interface SafetyEventDetail extends SafetyEventSummary {
  sourceType: string | null
  confidenceScore: number | null
  helmetWorn: boolean | null
  vestWorn: boolean | null
  shoesWorn: boolean | null
  cameraCode: string | null
  assignedByName: string | null
  resolvedByName: string | null
  resolutionMemo: string | null
}

interface WorkerOption {
  workerId: number
  name: string
}

function formatDateTime(iso: string | null) {
  if (!iso) return '-'
  return new Date(iso).toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

// 백엔드 상태(발생/작업자 지정 등)는 화면에서 진행 중/조치 완료 2단계로만 보여준다
function displayStatus(status: string) {
  return RESOLVED_STATUSES.has(status) ? '조치 완료' : '진행 중'
}

export default function SafetyPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [events, setEvents] = useState<SafetyEventSummary[]>([])
  const [search, setSearch] = useState('')
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null)
  const [liveAlerts, setLiveAlerts] = useState<SafetyEventSummary[]>([])
  const seenIds = useRef<Set<number> | null>(null)

  // 위반자 이름은 관리자, 또는 본인이 위반자로 지정된 경우에만 보여준다
  function visibleWorkerName(name: string | null) {
    if (!name) return null
    return isAdmin || name === user?.name ? name : null
  }

  const loadEvents = useCallback(() => {
    fetch('/api/safety/events')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { events?: SafetyEventSummary[] } | null) => {
        if (!data) return
        const list = data.events ?? []
        setEvents(list)

        if (seenIds.current === null) {
          // 최초 로드에서는 기존 이벤트를 기준선으로만 기억하고 알림을 띄우지 않는다
          seenIds.current = new Set(list.map((e) => e.eventId))
          return
        }
        const newOnes = list.filter((e) => !seenIds.current!.has(e.eventId) && !RESOLVED_STATUSES.has(e.status))
        if (newOnes.length > 0) {
          playAlertBeep()
          setLiveAlerts((prev) => [...newOnes, ...prev])
          newOnes.forEach((e) => {
            setTimeout(() => {
              setLiveAlerts((prev) => prev.filter((a) => a.eventId !== e.eventId))
            }, 5000)
          })
        }
        list.forEach((e) => seenIds.current!.add(e.eventId))
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    loadEvents()
    const timer = setInterval(loadEvents, 15000)
    return () => clearInterval(timer)
  }, [loadEvents])

  const activeEvents = events.filter((e) => !RESOLVED_STATUSES.has(e.status))
  const filteredEvents = events.filter((e) => {
    if (!search.trim()) return true
    const q = search.trim().toLowerCase()
    return (e.storageLocationName ?? '').toLowerCase().includes(q) || (e.eventTypeLabel ?? '').toLowerCase().includes(q)
  })

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">안전 관리</h2>
        <p className="text-sm text-slate-500">실시간 위반 현황을 확인하고, 캡처 이미지를 보고 위반자를 지정·처리합니다</p>
      </div>

      <h3 className="mb-3 text-sm font-semibold text-slate-700">현재 발생 중인 위반 ({activeEvents.length})</h3>
      <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {activeEvents.length === 0 && (
          <p className="col-span-full text-sm text-slate-400">현재 발생 중인 위반이 없습니다</p>
        )}
        {activeEvents.map((e) => {
          const workerName = visibleWorkerName(e.workerName)
          return (
            <button
              key={e.eventId}
              onClick={() => setSelectedEventId(e.eventId)}
              className="animate-pulse rounded-xl border-2 border-red-300 bg-red-50 p-4 text-left"
            >
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-600 text-white">⚠️</span>
                <div>
                  <p className="text-sm font-bold text-red-700">{e.eventTypeLabel}</p>
                  <p className="text-xs text-slate-500">{e.storageLocationName ?? '-'}</p>
                </div>
              </div>
              <p className="mt-2 text-xs text-slate-400">{formatDateTime(e.occurredAt)}</p>
              <p className="mt-1 text-xs text-slate-500">{workerName ? `위반자: ${workerName}` : '위반자 미확인'}</p>
            </button>
          )
        })}
      </div>

      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-slate-700">전체 이력 ({filteredEvents.length})</h3>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="구역/유형 검색"
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none"
        />
      </div>

      <p className="mb-2 text-xs text-slate-400 sm:hidden">← 옆으로 스크롤하면 위반자·시각·상태를 볼 수 있어요</p>
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="whitespace-nowrap px-4 py-3">유형</th>
              <th className="whitespace-nowrap px-4 py-3">구역</th>
              <th className="whitespace-nowrap px-4 py-3">위반자</th>
              <th className="whitespace-nowrap px-4 py-3">발생 시각</th>
              <th className="whitespace-nowrap px-4 py-3">상태</th>
            </tr>
          </thead>
          <tbody>
            {filteredEvents.map((e) => (
              <tr
                key={e.eventId}
                onClick={() => setSelectedEventId(e.eventId)}
                className="cursor-pointer border-t border-slate-100 hover:bg-slate-50"
              >
                <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-800">{e.eventTypeLabel}</td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">{e.storageLocationName ?? '-'}</td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">{visibleWorkerName(e.workerName) ?? '-'}</td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDateTime(e.occurredAt)}</td>
                <td className="whitespace-nowrap px-4 py-3">
                  {RESOLVED_STATUSES.has(e.status) ? (
                    <span className="whitespace-nowrap rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">{displayStatus(e.status)}</span>
                  ) : (
                    <span className="whitespace-nowrap rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">{displayStatus(e.status)}</span>
                  )}
                </td>
              </tr>
            ))}
            {filteredEvents.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-400">
                  검색 결과가 없습니다
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="pointer-events-none fixed inset-x-4 top-20 z-50 flex flex-col gap-2 md:inset-x-auto md:right-6 md:top-6 md:w-80">
        {liveAlerts.map((e) => (
          <div
            key={e.eventId}
            className="pointer-events-auto flex items-center gap-3 rounded-xl border-2 border-red-400 bg-white p-3 shadow-xl"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-600 text-white">⚠️</span>
            <div>
              <p className="text-sm font-bold text-red-600">위반 감지: {e.eventTypeLabel}</p>
              <p className="text-xs text-slate-500">
                {e.storageLocationName ?? '-'} · {formatDateTime(e.occurredAt)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {selectedEventId !== null && (
        <SafetyEventModal eventId={selectedEventId} onClose={() => setSelectedEventId(null)} onChanged={loadEvents} />
      )}
    </div>
  )
}

function SafetyEventModal({ eventId, onClose, onChanged }: { eventId: number; onClose: () => void; onChanged: () => void }) {
  const { user } = useAuth()
  const { showToast } = useToast()
  const isAdmin = user?.role === 'admin'
  const [detail, setDetail] = useState<SafetyEventDetail | null>(null)
  const [workers, setWorkers] = useState<WorkerOption[]>([])
  const [selectedWorkerId, setSelectedWorkerId] = useState('')
  const [busy, setBusy] = useState(false)

  const loadDetail = useCallback(() => {
    fetch(`/api/safety/events/${eventId}`)
      .then((res) => (res.ok ? (res.json() as Promise<SafetyEventDetail>) : null))
      .then(setDetail)
      .catch(() => setDetail(null))
  }, [eventId])

  useEffect(() => {
    loadDetail()
    if (!isAdmin) return
    fetch('/api/attendance/workers/stats')
      .then((res) => (res.ok ? (res.json() as Promise<WorkerOption[]>) : []))
      .then(setWorkers)
      .catch(() => setWorkers([]))
  }, [loadDetail, isAdmin])

  const resolved = detail ? RESOLVED_STATUSES.has(detail.status) : false
  // 조치 완료는 관리자, 또는 이 사건의 위반자로 지정된 본인만 가능 (이름 매칭 — 로그인 응답에 workerId가 없어서)
  const canResolve = isAdmin || (!!detail?.workerName && detail.workerName === user?.name)

  async function handleAssign() {
    if (!selectedWorkerId) return
    setBusy(true)
    try {
      const res = await fetch(`/api/safety/events/${eventId}/assign-worker`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workerId: Number(selectedWorkerId), assignedByUserId: user ? Number(user.id) : undefined }),
      })
      if (!res.ok) {
        showToast('위반자 지정에 실패했습니다', 'alert')
        return
      }
      showToast('위반자를 지정했습니다')
      loadDetail()
      onChanged()
    } finally {
      setBusy(false)
    }
  }

  async function handleResolve() {
    setBusy(true)
    try {
      const res = await fetch(`/api/safety/events/${eventId}/resolve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolvedByUserId: user ? Number(user.id) : undefined }),
      })
      if (!res.ok) {
        showToast('조치 완료 처리에 실패했습니다', 'alert')
        return
      }
      showToast('조치 완료로 처리했습니다')
      loadDetail()
      onChanged()
    } finally {
      setBusy(false)
    }
  }

  async function handleNotifyNearby() {
    setBusy(true)
    try {
      const res = await fetch(`/api/safety/events/${eventId}/notify-nearby-workers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maxWorkers: 5 }),
      })
      if (!res.ok) {
        showToast('근처 작업자가 없거나 알림 전송에 실패했습니다', 'alert')
        return
      }
      const data = await res.json()
      const names = ((data.notifiedWorkers ?? []) as Array<{ name?: string; workerName?: string }>)
        .map((w) => w.name ?? w.workerName)
        .filter(Boolean)
        .join(', ')
      showToast(names ? `${names} 작업자에게 알림을 보냈습니다` : '알림을 받을 근처 작업자가 없습니다', names ? 'success' : 'alert')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {!detail ? (
          <p className="text-sm text-slate-400">불러오는 중...</p>
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">{detail.eventTypeLabel}</h3>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-600" aria-label="닫기">
                ✕
              </button>
            </div>

            {detail.captureUrl && (
              <img
                src={detail.captureUrl}
                alt="캡처 이미지"
                className="mb-4 w-full rounded-lg border border-slate-200 object-cover"
              />
            )}

            <div className="space-y-1.5 text-sm text-slate-700">
              <p>
                상태: <span className="font-semibold">{displayStatus(detail.status)}</span>
              </p>
              <p>
                위치: <span className="font-semibold">{detail.storageLocationName ?? '-'} ({detail.storageLocationCode ?? '-'})</span>
              </p>
              {detail.cameraCode && (
                <p>
                  카메라: <span className="font-semibold">{detail.cameraCode}</span>
                </p>
              )}
              <p>
                발생 시각: <span className="font-semibold">{formatDateTime(detail.occurredAt)}</span>
              </p>
              {(detail.helmetWorn !== null || detail.vestWorn !== null || detail.shoesWorn !== null) && (
                <p>
                  보호장비:{' '}
                  {detail.helmetWorn !== null && (
                    <span className={detail.helmetWorn ? 'text-emerald-600' : 'text-red-600'}>안전모 {detail.helmetWorn ? 'O' : 'X'} </span>
                  )}
                  {detail.vestWorn !== null && (
                    <span className={detail.vestWorn ? 'text-emerald-600' : 'text-red-600'}>조끼 {detail.vestWorn ? 'O' : 'X'} </span>
                  )}
                  {detail.shoesWorn !== null && (
                    <span className={detail.shoesWorn ? 'text-emerald-600' : 'text-red-600'}>안전화 {detail.shoesWorn ? 'O' : 'X'}</span>
                  )}
                </p>
              )}
              {detail.workerName && (isAdmin || detail.workerName === user?.name) && (
                <p>
                  위반자: <span className="font-semibold">{detail.workerName}</span>
                </p>
              )}
              {detail.resolutionMemo && (
                <p>
                  메모: <span className="font-semibold">{detail.resolutionMemo}</span>
                </p>
              )}
            </div>

            <div className="mt-5 space-y-2">
              {isAdmin && !detail.workerName && !resolved && (
                <div className="flex gap-2">
                  <select
                    value={selectedWorkerId}
                    onChange={(e) => setSelectedWorkerId(e.target.value)}
                    className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none"
                  >
                    <option value="">위반자 선택</option>
                    {workers.map((w) => (
                      <option key={w.workerId} value={w.workerId}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleAssign}
                    disabled={!selectedWorkerId || busy}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    지정
                  </button>
                </div>
              )}
              {isAdmin && (
                <button
                  onClick={handleNotifyNearby}
                  disabled={busy}
                  className="w-full rounded-lg bg-slate-700 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  근처 작업자에게 알림
                </button>
              )}
              {!resolved && canResolve && (
                <button
                  onClick={handleResolve}
                  disabled={busy}
                  className="w-full rounded-lg bg-emerald-600 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  조치 완료 처리
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
