import { useEffect, useState } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { AuthReadyContext, useAuthState } from './context/AuthReadyContext'
import { Toaster } from 'sileo'
import AuthPage from './pages/auth/AuthPage'
import ResetPasswordPage from './pages/auth/ResetPasswordPage'
import DashboardPage from './pages/dashboard/DashboardPage'
import ServersPage from './pages/servers/ServersPage'
import { CreateServerDialog } from './pages/servers/CreateServerDialog'
import ServerConsolePage from './pages/servers/ServerConsolePage'
import ServerFilesPage from './pages/servers/ServerFilesPage'
import ServerBackupsPage from './pages/servers/ServerBackupsPage'
import ServerUsersPage from './pages/servers/ServerUsersPage'
import ServerSettingsPage from './pages/servers/ServerSettingsPage'
import ServerAllocationsPage from './pages/servers/ServerAllocationsPage'
import ServerFirewallPage from './pages/servers/ServerFirewallPage'
import ServerDatabasePage from './pages/servers/ServerDatabasePage'
import ServerStartupPage from './pages/servers/ServerStartupPage'
import ServerSchedulePage from './pages/servers/ServerSchedulePage'
import ServerActivityPage from './pages/servers/ServerActivityPage'
import ServerSoftwarePage from './pages/servers/ServerSoftwarePage'
import ServerLayout from './components/server/ServerLayout'
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
import { TooltipProvider } from './components/ui/Tooltip'
import { FrameLayout } from './components/layout/FrameLayout'
import { PageTransition } from './components/layout/PageTransition'
import { AdminPageLayout } from './components/admin/AdminPageLayout'
import LoadingScreen from './components/LoadingScreen'



function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const { isReady, showLoading } = useAuthState()
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
  const location = useLocation();
  /* Server detail pages own a full-bleed layout: the sidebar and console card
     connect straight to the app shell, so they skip the standard page padding. */
  const isServerDetail =
    /^\/servers\/[^/]/.test(location.pathname);

  if (isServerDetail) {
    return (
      <FrameLayout>
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
          <PageTransition>{children}</PageTransition>
        </div>
      </FrameLayout>
    );
  }

  return (
    <FrameLayout>
      <div className="flex-1 min-h-0 overflow-auto overscroll-contain grid grid-cols-[minmax(0,1fr)]">
        <div className="p-4 sm:p-6 flex flex-col min-w-0">
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

  // Replays the boot loading choreography when the user signs in from the
  // auth page: the overlay covers the app until isReady, then blurs away.
  function beginEntry() {
    setIsReady(false)
    setShowLoading(true)
    setTimeout(() => {
      setIsReady(true)
      // Wait for the blur/fade-out animation to finish before removing the overlay
      setTimeout(() => setShowLoading(false), 900)
    }, MIN_LOADING_MS)
  }

  return (
    <AuthReadyContext.Provider value={{ isReady, showLoading, beginEntry }}>
      {children}
    </AuthReadyContext.Provider>
  )
}

export default function App() {
  return (
    <AuthInitializer>
    <TooltipProvider>
    <Toaster
      position="bottom-center"
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
      <Route path="/servers/:id" element={<ProtectedRoute><AppLayout><ServerLayout /></AppLayout></ProtectedRoute>}>
        <Route index element={<ServerConsolePage />} />
        <Route path="files" element={<ServerFilesPage />} />
        <Route path="backups" element={<ServerBackupsPage />} />
        <Route path="users" element={<ServerUsersPage />} />
        <Route path="allocations" element={<ServerAllocationsPage />} />
        <Route path="firewall" element={<ServerFirewallPage />} />
        <Route path="database" element={<ServerDatabasePage />} />
        <Route path="startup" element={<ServerStartupPage />} />
        <Route path="schedule" element={<ServerSchedulePage />} />
        <Route path="activity" element={<ServerActivityPage />} />
        <Route path="software" element={<ServerSoftwarePage />} />
        <Route path="settings" element={<ServerSettingsPage />} />
      </Route>
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
      <Route path="/servers/new" element={<Navigate to="/servers" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    <CreateServerDialog />
    </TooltipProvider>
    </AuthInitializer>
  )
}
