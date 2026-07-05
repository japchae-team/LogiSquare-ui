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
  const menu = user?.role === 'admin' ? ADMIN_MENU : WORKER_MENU

  function handleLogout() {
    logout()
    navigate('/')
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="flex w-56 shrink-0 flex-col border-r border-slate-200 bg-white">
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
      <main className="flex-1 overflow-y-auto p-8">
        <Outlet />
      </main>
    </div>
  )
}
