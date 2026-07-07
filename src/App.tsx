import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import { CallProvider } from './context/CallContext'
import { SafetyProvider } from './context/SafetyContext'
import RequireAuth from './components/RequireAuth'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import HomePage from './pages/HomePage'
import SafetyPage from './pages/SafetyPage'
import AttendancePage from './pages/AttendancePage'
import CallApprovalPage from './pages/CallApprovalPage'
import LogisticsPage from './pages/logistics/LogisticsPage'
import InboundPage from './pages/logistics/InboundPage'
import PlacementStatusPage from './pages/logistics/PlacementStatusPage'
import OutboundPage from './pages/logistics/OutboundPage'

function RequireAdmin() {
  const { user } = useAuth()
  if (user?.role !== 'admin') return <Navigate to="/logistics/status" replace />
  return <Outlet />
}

function RequireWorker() {
  const { user } = useAuth()
  if (user?.role !== 'worker') return <Navigate to="/logistics/status" replace />
  return <Outlet />
}

function LogisticsIndex() {
  const { user } = useAuth()
  return <Navigate to={user?.role === 'admin' ? 'inbound' : 'status'} replace />
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <CallProvider>
          <SafetyProvider>
            <Routes>
              <Route path="/" element={<LoginPage />} />
              <Route element={<RequireAuth />}>
                <Route element={<Layout />}>
                  <Route path="/home" element={<HomePage />} />
                  <Route path="/safety" element={<SafetyPage />} />
                  <Route path="/attendance" element={<AttendancePage />} />
                  <Route path="/calls" element={<CallApprovalPage />} />
                  <Route path="/logistics" element={<LogisticsPage />}>
                    <Route index element={<LogisticsIndex />} />
                    <Route element={<RequireAdmin />}>
                      <Route path="inbound" element={<InboundPage />} />
                    </Route>
                    <Route path="status" element={<PlacementStatusPage />} />
                    <Route element={<RequireWorker />}>
                      <Route path="outbound" element={<OutboundPage />} />
                    </Route>
                  </Route>
                </Route>
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </SafetyProvider>
        </CallProvider>
      </ToastProvider>
    </AuthProvider>
  )
}
