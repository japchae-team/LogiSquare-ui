import type { Grade, InventoryItem, Slot, ViolationLog, WorkerRecord } from '../types'

export const WAREHOUSE_ROWS = 4
export const WAREHOUSE_COLS = 8

export const GRADE_COLOR: Record<Grade, { bg: string; text: string; label: string }> = {
  A: { bg: 'bg-rose-400', text: 'text-rose-700', label: 'A등급 (고회전)' },
  B: { bg: 'bg-amber-400', text: 'text-amber-700', label: 'B등급 (중회전)' },
  C: { bg: 'bg-emerald-400', text: 'text-emerald-700', label: 'C등급 (저회전)' },
}

// 출입구가 왼쪽(0열)에 있어, 입구에 가까운 열일수록 회전율이 높은 등급을 배치한다.
function gradeForCol(col: number): Grade {
  if (col <= 1) return 'A'
  if (col <= 5) return 'B'
  return 'C'
}

const initialItems: Array<{ name: string; qty: number; row: number; col: number }> = [
  { name: '스마트폰 케이스', qty: 320, row: 0, col: 0 },
  { name: '무선 이어폰', qty: 210, row: 1, col: 0 },
  { name: 'USB-C 케이블', qty: 150, row: 2, col: 0 },
  { name: '보조 배터리', qty: 180, row: 3, col: 0 },
  { name: '블루투스 스피커', qty: 95, row: 0, col: 1 },
  { name: '노트북 파우치', qty: 60, row: 0, col: 2 },
  { name: '키보드', qty: 70, row: 1, col: 2 },
  { name: '마우스', qty: 55, row: 0, col: 3 },
  { name: '모니터 받침대', qty: 40, row: 1, col: 3 },
  { name: 'HDMI 케이블', qty: 65, row: 0, col: 4 },
  { name: '사무용 의자', qty: 12, row: 0, col: 6 },
  { name: '문서 파쇄기', qty: 8, row: 1, col: 6 },
  { name: '화이트보드', qty: 5, row: 0, col: 7 },
]

export const slots: Slot[] = []
for (let row = 0; row < WAREHOUSE_ROWS; row++) {
  for (let col = 0; col < WAREHOUSE_COLS; col++) {
    slots.push({ id: `r${row}-c${col}`, row, col, grade: gradeForCol(col), itemId: null })
  }
}

export const items: InventoryItem[] = initialItems.map((it, idx) => {
  const slotId = `r${it.row}-c${it.col}`
  const grade = gradeForCol(it.col)
  const slot = slots.find((s) => s.id === slotId)
  if (slot) slot.itemId = `item-${idx}`
  return { id: `item-${idx}`, name: it.name, qty: it.qty, grade, slotId }
})

export function gradeForQty(qty: number): Grade {
  if (qty >= 150) return 'A'
  if (qty >= 50) return 'B'
  return 'C'
}

export function findEmptySlotForGrade(grade: Grade): Slot | null {
  return slots.find((s) => s.grade === grade && s.itemId === null) ?? null
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
