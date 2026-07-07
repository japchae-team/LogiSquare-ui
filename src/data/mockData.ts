import type { Grade, ViolationLog } from '../types'

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
