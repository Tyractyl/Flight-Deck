import { useEffect, useState, createContext, useContext } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { Toaster } from 'sileo'
import AuthPage from './pages/auth/AuthPage'
import ResetPasswordPage from './pages/auth/ResetPasswordPage'
import DashboardPage from './pages/dashboard/DashboardPage'
import ServersPage from './pages/servers/ServersPage'
import ServerDetailPage from './pages/servers/ServerDetailPage'
import CreateServerPage from './pages/servers/CreateServerPage'
import StorePage from './pages/store/StorePage'
import AfkPage from './pages/afk/AfkPage'
import AccountPage from './pages/account/AccountPage'
import TenantsPage from './pages/tenants/TenantsPage'
import AdminDashboardPage from './pages/admin/AdminDashboardPage'
import AdminUsersPage from './pages/admin/AdminUsersPage'
import AdminServersPage from './pages/admin/AdminServersPage'
import AdminNodesPage from './pages/admin/AdminNodesPage'
import AdminCoinsPage from './pages/admin/AdminCoinsPage'
import AdminCargoPage from './pages/admin/AdminCargoPage'
import AdminActivityPage from './pages/admin/AdminActivityPage'
import AdminLocationsPage from './pages/admin/AdminLocationsPage'
import AdminBrandingPage from './pages/admin/AdminBrandingPage'
import axios from 'axios'
import { setAccessToken, getAccessToken } from './api/client'
import type { User } from './types/server'
import { FrameLayout } from './components/layout/FrameLayout'
import { PageTransition } from './components/layout/PageTransition'
import { AdminPageLayout } from './components/admin/AdminPageLayout'
import LoadingScreen from './components/LoadingScreen'

interface AuthState {
  isReady: boolean
  showLoading: boolean
}

const AuthReadyContext = createContext<AuthState>({ isReady: false, showLoading: true })
export const useAuthReady = () => useContext(AuthReadyContext).isReady

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const { isReady, showLoading } = useContext(AuthReadyContext)
  if (!isReady && !isAuthenticated) return <><LoadingScreen fadingOut={false} /></>
  if (!isAuthenticated) return <Navigate to="/auth" replace />
  return (
    <>
      {showLoading && <LoadingScreen fadingOut={isReady} />}
      {children}
    </>
  )
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user)
  if (!user?.is_admin) return <Navigate to="/" replace />
  return <>{children}</>
}

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <FrameLayout>
      <div className="flex-1 min-h-0 overflow-auto overscroll-contain grid">
        <div className="p-4 sm:p-6 flex flex-col">
          <PageTransition>{children}</PageTransition>
        </div>
      </div>
    </FrameLayout>
  )
}

const MIN_LOADING_MS = 2200

function AuthInitializer({ children }: { children: React.ReactNode }) {
  const setAuth = useAuthStore((s) => s.setAuth)
  const [isReady, setIsReady] = useState(false)
  const [showLoading, setShowLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const start = Date.now()

    function markReady() {
      const elapsed = Date.now() - start
      const remaining = Math.max(0, MIN_LOADING_MS - elapsed)
      setTimeout(() => {
        if (!cancelled) {
          setIsReady(true)
          // Wait for the blur/fade-out animation to finish before removing the overlay
          setTimeout(() => {
            if (!cancelled) setShowLoading(false)
          }, 900)
        }
      }, remaining)
    }

    // Handle Discord OAuth callback — extract access_token from URL
    const urlParams = new URLSearchParams(window.location.search)
    const discordToken = urlParams.get('access_token')
    if (discordToken) {
      setAccessToken(discordToken)
      window.history.replaceState({}, '', window.location.pathname)
      axios.get('/api/users/me', {
        headers: { Authorization: `Bearer ${discordToken}` }
      })
        .then(({ data }) => {
          if (!cancelled) {
            setAuth(data, discordToken)
            markReady()
          }
        })
        .catch(() => {
          if (!cancelled) markReady()
        })
      return () => { cancelled = true }
    }

    const cachedToken = getAccessToken()
    if (cachedToken) {
      setAccessToken(cachedToken)
      axios.get('/api/users/me', {
        headers: { Authorization: `Bearer ${cachedToken}` },
        timeout: 3000,
      })
        .then(({ data }) => {
          if (!cancelled) {
            setAuth(data, cachedToken)
            markReady()
          }
        })
        .catch(() => {
          if (!cancelled) attemptRefresh()
        })
    } else {
      attemptRefresh()
    }

    const DEMO_USER: User = {
      id: 'demo-user',
      email: 'demo@tyractyl.local',
      username: 'Demo User',
      is_admin: true,
      coins: 9999,
      afk_last_seen: null,
      created_at: new Date().toISOString(),
      avatar_url: null,
    }

    function enterDemoMode() {
      if (!cancelled) {
        setAuth(DEMO_USER, 'demo-token')
        markReady()
      }
    }

    function attemptRefresh() {
      axios.post('/api/auth/refresh', null, { withCredentials: true, timeout: 3000 })
        .then(({ data }) => {
          if (data.access_token && !cancelled) {
            setAccessToken(data.access_token)
            return axios.get('/api/users/me', {
              headers: { Authorization: `Bearer ${data.access_token}` }
            }).then(({ data: user }) => {
              if (!cancelled) setAuth(user, data.access_token)
            })
          }
        })
        .catch(() => enterDemoMode())
        .finally(() => {
          if (!cancelled) markReady()
        })
    }

    return () => { cancelled = true }
  }, [])

  return (
    <AuthReadyContext.Provider value={{ isReady, showLoading }}>
      {children}
    </AuthReadyContext.Provider>
  )
}

export default function App() {
  return (
    <AuthInitializer>
    <Toaster
      position="bottom-left"
      theme="dark"
    />
    <Routes>
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/forgot-password" element={<Navigate to="/auth?mode=forgot-password" replace />} />
      <Route path="/login" element={<Navigate to="/auth" replace />} />
      <Route path="/register" element={<Navigate to="/auth?mode=signup" replace />} />
      <Route path="/" element={<ProtectedRoute><AppLayout><DashboardPage /></AppLayout></ProtectedRoute>} />
      <Route path="/servers" element={<ProtectedRoute><AppLayout><ServersPage /></AppLayout></ProtectedRoute>} />
      <Route path="/servers/new" element={<ProtectedRoute><AppLayout><CreateServerPage /></AppLayout></ProtectedRoute>} />
      <Route path="/servers/:id" element={<ProtectedRoute><AppLayout><ServerDetailPage /></AppLayout></ProtectedRoute>} />
      <Route path="/store" element={<ProtectedRoute><AppLayout><StorePage /></AppLayout></ProtectedRoute>} />
      <Route path="/afk" element={<ProtectedRoute><AppLayout><AfkPage /></AppLayout></ProtectedRoute>} />
      <Route path="/account" element={<ProtectedRoute><AppLayout><AccountPage /></AppLayout></ProtectedRoute>} />
      <Route path="/tenants" element={<ProtectedRoute><AppLayout><TenantsPage /></AppLayout></ProtectedRoute>} />
      <Route path="/teams" element={<Navigate to="/tenants" replace />} />
      <Route path="/admin" element={<ProtectedRoute><AdminRoute><AdminPageLayout><AdminDashboardPage /></AdminPageLayout></AdminRoute></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute><AdminRoute><AdminPageLayout><AdminUsersPage /></AdminPageLayout></AdminRoute></ProtectedRoute>} />
      <Route path="/admin/servers" element={<ProtectedRoute><AdminRoute><AdminPageLayout><AdminServersPage /></AdminPageLayout></AdminRoute></ProtectedRoute>} />
      <Route path="/admin/nodes" element={<ProtectedRoute><AdminRoute><AdminPageLayout><AdminNodesPage /></AdminPageLayout></AdminRoute></ProtectedRoute>} />
      <Route path="/admin/coins" element={<ProtectedRoute><AdminRoute><AdminPageLayout><AdminCoinsPage /></AdminPageLayout></AdminRoute></ProtectedRoute>} />
      <Route path="/admin/cargo" element={<ProtectedRoute><AdminRoute><AdminPageLayout><AdminCargoPage /></AdminPageLayout></AdminRoute></ProtectedRoute>} />
      <Route path="/admin/activity" element={<ProtectedRoute><AdminRoute><AdminPageLayout><AdminActivityPage /></AdminPageLayout></AdminRoute></ProtectedRoute>} />
      <Route path="/admin/locations" element={<ProtectedRoute><AdminRoute><AdminPageLayout><AdminLocationsPage /></AdminPageLayout></AdminRoute></ProtectedRoute>} />
      <Route path="/admin/branding" element={<ProtectedRoute><AdminRoute><AdminPageLayout><AdminBrandingPage /></AdminPageLayout></AdminRoute></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </AuthInitializer>
  )
}
