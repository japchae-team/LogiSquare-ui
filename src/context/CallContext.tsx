import { createContext, useContext, useState, type ReactNode } from 'react'
import { workers } from '../data/mockData'
import type { CallRequest, CallTaskType } from '../types'

const initialCalls: CallRequest[] = [
  { id: 'call-1', itemName: '무선 이어폰', location: 'A구역 2행 1열 (r1-c0)', workerId: 'w1', workerName: '김도윤', requestedAt: '11:02', status: '대기', taskType: '출고' },
  { id: 'call-2', itemName: '키보드', location: 'B구역 2행 3열 (r1-c2)', workerId: 'w3', workerName: '박지호', requestedAt: '11:20', status: '대기', taskType: '출고' },
]

interface CallContextValue {
  calls: CallRequest[]
  sendCall: (itemName: string, location: string, taskType: CallTaskType) => CallRequest | null
  acceptCall: (id: string) => void
  completeCall: (id: string) => void
}

const CallContext = createContext<CallContextValue | null>(null)

let idCounter = initialCalls.length

export function CallProvider({ children }: { children: ReactNode }) {
  const [calls, setCalls] = useState<CallRequest[]>(initialCalls)

  function sendCall(itemName: string, location: string, taskType: CallTaskType): CallRequest | null {
    const nearestWorker = workers.find((w) => w.status === '가용')
    if (!nearestWorker) return null
    const call: CallRequest = {
      id: `call-${++idCounter}`,
      itemName,
      location,
      workerId: nearestWorker.id,
      workerName: nearestWorker.name,
      requestedAt: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
      status: '대기',
      taskType,
    }
    setCalls((prev) => [call, ...prev])
    return call
  }

  function acceptCall(id: string) {
    setCalls((prev) => prev.map((c) => (c.id === id ? { ...c, status: '승인' } : c)))
  }

  function completeCall(id: string) {
    setCalls((prev) => prev.map((c) => (c.id === id ? { ...c, status: '완료' } : c)))
  }

  return (
    <CallContext.Provider value={{ calls, sendCall, acceptCall, completeCall }}>{children}</CallContext.Provider>
  )
}

export function useCalls() {
  const ctx = useContext(CallContext)
  if (!ctx) throw new Error('useCalls must be used within CallProvider')
  return ctx
}
