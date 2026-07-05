import { createContext, useContext, useState, type ReactNode } from 'react'
import type { Role, User } from '../types'

interface Credential {
  id: string
  password: string
  name: string
  role: Role
  workerId?: string
}

const CREDENTIALS: Credential[] = [
  { id: 'admin', password: 'admin123', name: '관리자 홍길동', role: 'admin' },
  { id: 'worker', password: 'worker123', name: '작업자 김도윤', role: 'worker', workerId: 'w1' },
]

interface AuthContextValue {
  user: User | null
  login: (id: string, password: string) => boolean
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)

  function login(id: string, password: string) {
    const match = CREDENTIALS.find((c) => c.id === id && c.password === password)
    if (!match) return false
    setUser({ id: match.id, name: match.name, role: match.role, workerId: match.workerId })
    return true
  }

  function logout() {
    setUser(null)
  }

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
