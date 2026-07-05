export type Role = 'admin' | 'worker'

export interface User {
  id: string
  name: string
  role: Role
  workerId?: string
}

export type Grade = 'A' | 'B' | 'C'

export interface InventoryItem {
  id: string
  name: string
  qty: number
  grade: Grade
  slotId: string
}

export interface Slot {
  id: string
  row: number
  col: number
  grade: Grade
  itemId: string | null
}

export type ViolationType = '보호장비 미착용' | '위험구역 침입'

export interface ViolationLog {
  id: string
  time: string
  zone: string
  type: ViolationType
  active: boolean
}

export type WorkerStatus = '가용' | '작업중' | '휴식'

export interface WorkerRecord {
  id: string
  name: string
  status: WorkerStatus
  callAccepted: number
  tasksHandled: number
  checkIn: string
  checkOut: string
  violations: number
}

export type Period = '일' | '주' | '월' | '년'

export type CallStatus = '대기' | '승인' | '완료'
export type CallTaskType = '입고' | '출고'

export interface CallRequest {
  id: string
  itemName: string
  location: string
  workerId: string
  workerName: string
  requestedAt: string
  status: CallStatus
  taskType: CallTaskType
}
