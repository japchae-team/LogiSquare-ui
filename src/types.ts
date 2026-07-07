export type Role = 'admin' | 'worker'

export interface User {
  id: string
  name: string
  role: Role
}

export type Grade = 'A' | 'B' | 'C'

export interface InventorySlot {
  locationId: number
  locationCode: string
  locationName: string
  areaCode: Grade
  locationGrade: Grade
  dangerArea: boolean
  rowIndex: number
  columnIndex: number
  capacity: number
  storedQuantity: number
  occupied: boolean
  matched: boolean
  itemNames: string[]
}

export interface InventoryItemRecord {
  inventoryId: number
  itemId: number
  sku: string
  itemName: string
  quantity: number
  locationId: number
  locationCode: string
  locationGrade: Grade
  locationLabel: string
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
