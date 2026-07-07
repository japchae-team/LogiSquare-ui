import type { Grade, ViolationLog, WorkerRecord } from '../types'

export const GRADE_COLOR: Record<Grade, { bg: string; text: string; label: string }> = {
  A: { bg: 'bg-rose-400', text: 'text-rose-700', label: 'A등급 (고회전)' },
  B: { bg: 'bg-amber-400', text: 'text-amber-700', label: 'B등급 (중회전)' },
  C: { bg: 'bg-emerald-400', text: 'text-emerald-700', label: 'C등급 (저회전)' },
}

export const violationLogs: ViolationLog[] = [
  { id: 'v1', time: '2026-07-03 09:12', zone: 'B구역 2열', type: '보호장비 미착용', active: false },
  { id: 'v2', time: '2026-07-03 11:36', zone: 'D구역 지게차로', type: '위험구역 침입', active: true },
  { id: 'v3', time: '2026-07-02 15:20', zone: 'A구역 입고장', type: '보호장비 미착용', active: false },
  { id: 'v4', time: '2026-07-02 08:05', zone: 'C구역 3열', type: '위험구역 침입', active: false },
]

export const workers: WorkerRecord[] = [
  { id: 'w1', name: '김도윤', status: '가용', callAccepted: 18, tasksHandled: 42, checkIn: '08:58', checkOut: '18:02', violations: 0 },
  { id: 'w2', name: '이서준', status: '작업중', callAccepted: 22, tasksHandled: 51, checkIn: '09:01', checkOut: '-', violations: 1 },
  { id: 'w3', name: '박지호', status: '가용', callAccepted: 15, tasksHandled: 33, checkIn: '08:47', checkOut: '17:55', violations: 0 },
  { id: 'w4', name: '최민준', status: '휴식', callAccepted: 9, tasksHandled: 20, checkIn: '09:10', checkOut: '-', violations: 2 },
  { id: 'w5', name: '정하은', status: '가용', callAccepted: 27, tasksHandled: 60, checkIn: '08:52', checkOut: '18:10', violations: 0 },
]
