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

export type Period = '일' | '주' | '월' | '년'
