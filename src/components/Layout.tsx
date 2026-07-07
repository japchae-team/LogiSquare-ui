import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const ADMIN_MENU = [
  { to: '/home', label: '홈' },
  { to: '/logistics', label: '물류' },
  { to: '/safety', label: '안전' },
  { to: '/attendance', label: '근태' },
]

const WORKER_MENU = [
  { to: '/home', label: '홈' },
  { to: '/logistics', label: '물류' },
  { to: '/calls', label: '호출 승인' },
  { to: '/safety', label: '안전' },
  { to: '/attendance', label: '근태' },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const menu = user?.role === 'admin' ? ADMIN_MENU : WORKER_MENU

  function handleLogout() {
    logout()
    navigate('/')
  }

  function handleNavClick() {
    setMenuOpen(false)
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 md:flex-row">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 md:hidden">
        <h1 className="text-lg font-bold text-slate-900">LogiSquare</h1>
        <button
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="메뉴 열기"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600"
        >
          {menuOpen ? '✕' : '☰'}
        </button>
      </header>

      {menuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 md:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 -translate-x-full flex-col border-r border-slate-200 bg-white transition-transform duration-200 md:static md:z-auto md:w-56 md:translate-x-0 ${
          menuOpen ? 'translate-x-0' : ''
        }`}
      >
        <div className="px-5 py-6">
          <h1 className="text-lg font-bold text-slate-900">LogiSquare</h1>
          <p className="mt-1 text-xs text-slate-500">
            {user?.name} · {user?.role === 'admin' ? '관리자' : '작업자'}
          </p>
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-3">
          {menu.map((m) => (
            <NavLink
              key={m.to}
              to={m.to}
              onClick={handleNavClick}
              className={({ isActive }) =>
                `rounded-lg px-4 py-2.5 text-sm font-medium transition ${
                  isActive ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`
              }
            >
              {m.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3">
          <button
            onClick={handleLogout}
            className="w-full rounded-lg px-4 py-2.5 text-left text-sm font-medium text-slate-500 hover:bg-slate-100"
          >
            로그아웃
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <Outlet />
      </main>
    </div>
  )
}
