import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const [id, setId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  const canSubmit = id.trim() !== '' && password.trim() !== ''

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    const ok = login(id.trim(), password)
    if (!ok) {
      setError('아이디 또는 비밀번호를 확인하세요')
      return
    }
    setError('')
    navigate('/home')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="mb-1 text-xl font-bold text-slate-900">LogiSquare</h1>
        <p className="mb-6 text-sm text-slate-500">계정 정보를 입력해 로그인하세요</p>

        <label className="mb-1 block text-sm font-medium text-slate-700">아이디</label>
        <input
          value={id}
          onChange={(e) => setId(e.target.value)}
          placeholder="admin / worker"
          className="mb-4 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
        />

        <label className="mb-1 block text-sm font-medium text-slate-700">비밀번호</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className="mb-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
        />

        {error && <p className="mb-2 text-sm font-medium text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={!canSubmit}
          className="mt-4 w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          로그인
        </button>

        <p className="mt-4 text-center text-xs text-slate-400">
          테스트 계정 — 관리자: admin / admin123 · 작업자: worker / worker123
        </p>
      </form>
    </div>
  )
}
