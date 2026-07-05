import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function LogisticsPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  return (
    <div>
      <h2 className="mb-1 text-2xl font-bold text-slate-900">물류 관리</h2>
      <p className="mb-6 text-sm text-slate-500">
        {isAdmin ? '입고 배치와 창고 현황을 관리합니다' : '창고 배치 현황을 확인합니다'}
      </p>

      <div className="mb-6 flex gap-2 border-b border-slate-200">
        {isAdmin && (
          <NavLink
            to="inbound"
            className={({ isActive }) =>
              `-mb-px border-b-2 px-4 py-2.5 text-sm font-semibold ${
                isActive ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`
            }
          >
            입고 및 배치
          </NavLink>
        )}
        <NavLink
          to="status"
          className={({ isActive }) =>
            `-mb-px border-b-2 px-4 py-2.5 text-sm font-semibold ${
              isActive ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`
          }
        >
          배치 현황
        </NavLink>
        {!isAdmin && (
          <NavLink
            to="outbound"
            className={({ isActive }) =>
              `-mb-px border-b-2 px-4 py-2.5 text-sm font-semibold ${
                isActive ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`
            }
          >
            출고
          </NavLink>
        )}
      </div>

      <Outlet />
    </div>
  )
}
