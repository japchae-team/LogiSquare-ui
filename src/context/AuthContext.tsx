import { createContext, useContext, useState, type ReactNode } from 'react'
import type { User } from '../types'

const SESSION_KEY = 'logisquare.user'

interface AuthContextValue {
  user: User | null
  login: (id: string, password: string) => Promise<boolean>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function readStoredUser(): User | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    return raw ? (JSON.parse(raw) as User) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(readStoredUser)

  async function login(id: string, password: string) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: id, password }),
    })
    if (!res.ok) return false

    const data = await res.json()
    const loggedInUser: User = {
      id: String(data.user.id),
      name: data.user.name,
      role: data.user.role === 'ADMIN' ? 'admin' : 'worker',
    }
    setUser(loggedInUser)
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(loggedInUser))
    return true
  }

  function logout() {
    setUser(null)
    sessionStorage.removeItem(SESSION_KEY)
  }

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
