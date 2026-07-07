import { createContext, useContext, useState, type ReactNode } from 'react'
import type { Role, User } from '../types'

interface Credential {
  id: string
  password: string
  name: string
  role: Role
  workerId?: string
}

// 작업자 로그인은 아직 백엔드 API가 없어 데모용 계정으로 남겨둠 (관리자만 실제 API 연동됨)
const WORKER_CREDENTIALS: Credential[] = [
  { id: 'worker', password: 'worker123', name: '작업자 김도윤', role: 'worker', workerId: 'w1' },
]

interface AuthContextValue {
  user: User | null
  login: (id: string, password: string) => Promise<boolean>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)

  async function login(id: string, password: string) {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: id, password }),
      })
      if (res.ok) {
        const data = await res.json()
        setUser({
          id: String(data.user.id),
          name: data.user.name,
          role: data.user.role === 'ADMIN' ? 'admin' : 'worker',
        })
        return true
      }
    } catch {
      // API 서버에 접속할 수 없는 경우 아래 데모 계정 로그인으로 대체
    }

    const match = WORKER_CREDENTIALS.find((c) => c.id === id && c.password === password)
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
