import { createContext, useContext, useState, type ReactNode } from 'react'
import { violationLogs as initialLogs } from '../data/mockData'
import type { ViolationLog, ViolationType } from '../types'
import { playAlertBeep } from '../utils/sound'

const ZONES = ['A구역 입고장', 'B구역 2열', 'C구역 3열', 'D구역 지게차로', 'E구역 출고장']
const TYPES: ViolationType[] = ['보호장비 미착용', '위험구역 침입']

interface SafetyContextValue {
  logs: ViolationLog[]
  liveAlerts: ViolationLog[]
  triggerViolation: () => void
  resolveViolation: (id: string) => void
}

const SafetyContext = createContext<SafetyContextValue | null>(null)

let idCounter = initialLogs.length
let cursor = 0

export function SafetyProvider({ children }: { children: ReactNode }) {
  const [logs, setLogs] = useState<ViolationLog[]>(initialLogs)
  const [liveAlerts, setLiveAlerts] = useState<ViolationLog[]>([])

  function triggerViolation() {
    const zone = ZONES[cursor % ZONES.length]
    const type = TYPES[cursor % TYPES.length]
    cursor += 1
    const now = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    const time = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`
    const log: ViolationLog = {
      id: `v-${++idCounter}`,
      time,
      zone,
      type,
      active: true,
    }
    setLogs((prev) => [log, ...prev])
    setLiveAlerts((prev) => [log, ...prev])
    playAlertBeep()
    setTimeout(() => {
      setLiveAlerts((prev) => prev.filter((l) => l.id !== log.id))
    }, 5000)
  }

  function resolveViolation(id: string) {
    setLogs((prev) => prev.map((l) => (l.id === id ? { ...l, active: false } : l)))
  }

  return (
    <SafetyContext.Provider value={{ logs, liveAlerts, triggerViolation, resolveViolation }}>
      {children}
    </SafetyContext.Provider>
  )
}

export function useSafety() {
  const ctx = useContext(SafetyContext)
  if (!ctx) throw new Error('useSafety must be used within SafetyProvider')
  return ctx
}
