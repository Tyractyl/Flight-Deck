import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { queryKeys } from '../../api/queryKeys'
import { getBalance } from '../../api/coins'
import { listSessions, revokeSession, revokeAllSessions } from '../../api/sessions'
import type { UserSession } from '../../api/sessions'
import { listAuditLogs } from '../../api/audit'
import type { AuditLog } from '../../api/audit'
import api from '../../api/client'
import Button from '../../components/Button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/Tabs'
import { Skeleton } from 'parthenon-ui/components'
import { sileo } from 'sileo'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  UserCircleIcon, ShieldIcon, KeyIcon, ActivityIcon,
  DeleteIcon, ComputerIcon, GlobeIcon, ClockIcon
} from '@hugeicons/core-free-icons'
import Avatar from 'boring-avatars'
import { Input } from '../../components/ui/Input'

function ProfileSection() {
  const user = useAuthStore((s) => s.user)
  const updateUser = useAuthStore((s) => s.updateUser)
  const [username, setUsername] = useState(user?.username || '')
  const [email, setEmail] = useState(user?.email || '')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      const { data } = await api.patch('/users/me', { username, email })
      updateUser(data)
      sileo.success({ description: 'Profile updated', icon: false })
    } catch {
      sileo.error({ description: 'Failed to update profile', icon: false })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-[var(--bg-card)] rounded-xl p-6">
        <h3 className="text-lg font-semibold text-[var(--fg)] mb-1">Profile Information</h3>
        <p className="text-sm text-[var(--fg-muted)] mb-6">Update your username and email address.</p>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-[var(--fg-muted)] block mb-1.5">Username</label>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--fg-muted)] block mb-1.5">Email address</label>
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                placeholder="Enter your email"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button width={140} height={36} onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function SecuritySection() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [saving, setSaving] = useState(false)

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) return
    setSaving(true)
    try {
      await api.post('/auth/change-password', { current_password: currentPassword, new_password: newPassword })
      setCurrentPassword('')
      setNewPassword('')
      sileo.success({ description: 'Password changed', icon: false })
    } catch {
      sileo.error({ description: 'Failed to change password', icon: false })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="bg-[var(--bg-card)] rounded-xl p-6">
        <h3 className="text-lg font-semibold text-[var(--fg)] mb-1">Change Password</h3>
        <p className="text-sm text-[var(--fg-muted)] mb-6">Ensure your account is using a long, random password to stay secure.</p>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-[var(--fg-muted)] block mb-1.5">Current Password</label>
            <Input
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              type="password"
              placeholder="Enter your current password"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--fg-muted)] block mb-1.5">New Password</label>
            <Input
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              type="password"
              placeholder="Enter your new password"
            />
            <p className="mt-1 text-xs text-[var(--fg-muted)]">Password must be at least 8 characters long.</p>
          </div>
          <div className="flex justify-end">
            <Button width={140} height={36} onClick={handleChangePassword} disabled={saving || !currentPassword || !newPassword}>
              {saving ? 'Changing...' : 'Update Password'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function SessionsSection() {
  const queryClient = useQueryClient()

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: queryKeys.sessions.all,
    queryFn: listSessions,
  })

  const revokeMutation = useMutation({
    mutationFn: revokeSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions.all })
      sileo.success({ description: 'Session revoked', icon: false })
    },
    onError: () => {
      sileo.error({ description: 'Failed to revoke session', icon: false })
    },
  })

  const revokeAllMutation = useMutation({
    mutationFn: revokeAllSessions,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions.all })
      sileo.success({ description: 'Other sessions revoked', icon: false })
    },
    onError: () => {
      sileo.error({ description: 'Failed to revoke sessions', icon: false })
    },
  })

  const getDeviceIcon = (userAgent: string) => {
    if (userAgent.includes('iPhone') || userAgent.includes('Android')) return <HugeiconsIcon icon={ComputerIcon} className="h-4 w-4" />
    return <HugeiconsIcon icon={ComputerIcon} className="h-4 w-4" />
  }

  const getBrowserInfo = (userAgent: string) => {
    if (userAgent.includes('Chrome')) return 'Chrome'
    if (userAgent.includes('Firefox')) return 'Firefox'
    if (userAgent.includes('Safari')) return 'Safari'
    if (userAgent.includes('Edge')) return 'Edge'
    return 'Unknown Browser'
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return dateString
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-[var(--bg-card)] rounded-xl p-6">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-lg font-semibold text-[var(--fg)]">Active Sessions</h3>
          {sessions.length > 1 && (
            <Button
              width={140}
              height={28}
              onClick={() => revokeAllMutation.mutate()}
              disabled={revokeAllMutation.isPending}
              className="text-xs"
            >
              Revoke all others
            </Button>
          )}
        </div>
        <p className="text-sm text-[var(--fg-muted)] mb-6">Manage and monitor your active sessions across all devices.</p>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="p-4 rounded-lg bg-[var(--bg-input)] border border-theme">
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-3 w-48" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((session: UserSession) => (
              <div key={session.id} className="flex items-center justify-between p-4 rounded-lg bg-[var(--bg-input)] border border-theme">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-[var(--bg-elevated)] flex items-center justify-center text-[var(--fg-muted)]">
                    {getDeviceIcon(session.user_agent)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-[var(--fg)]">{getBrowserInfo(session.user_agent)}</p>
                      {session.is_current && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-green-500/10 text-green-500">
                          This session
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-[var(--fg-muted)]">
                      <span className="flex items-center gap-1"><HugeiconsIcon icon={GlobeIcon} className="h-3 w-3" />{session.ip_address}</span>
                      <span className="flex items-center gap-1"><HugeiconsIcon icon={ClockIcon} className="h-3 w-3" />{formatDate(session.created_at)}</span>
                    </div>
                  </div>
                </div>
                {!session.is_current && (
                  <Button
                    width={60}
                    height={28}
                    onClick={() => revokeMutation.mutate(session.id)}
                    disabled={revokeMutation.isPending}
                  >
                    Revoke
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function AuditSection() {
  const { data: auditData, isLoading } = useQuery({
    queryKey: queryKeys.audit.all,
    queryFn: () => listAuditLogs(1, 20),
  })

  const auditLogs = auditData?.items || []

  const formatActionLabel = (action: string) => {
    const actionMap: Record<string, string> = {
      'auth.login': 'Signed in',
      'auth.register': 'Account created',
      'auth.logout': 'Signed out',
      'user.update_profile': 'Profile updated',
      'session.revoke': 'Session revoked',
    }
    return actionMap[action] || action.replace(/[.:]/g, ' · ')
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const diffMs = Date.now() - date.getTime()
    const diffSeconds = Math.floor(diffMs / 1000)
    if (diffSeconds < 45) return 'just now'
    if (diffSeconds < 90) return '1 min ago'
    const diffMinutes = Math.floor(diffSeconds / 60)
    if (diffMinutes < 60) return `${diffMinutes} min${diffMinutes === 1 ? '' : 's'} ago`
    const diffHours = Math.floor(diffMinutes / 60)
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`
    const diffDays = Math.floor(diffHours / 24)
    if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`
    return date.toLocaleString()
  }

  return (
    <div className="space-y-4">
      <div className="bg-[var(--bg-card)] rounded-xl p-6">
        <h3 className="text-lg font-semibold text-[var(--fg)] mb-1">Recent Activity</h3>
        <p className="text-sm text-[var(--fg-muted)] mb-6">An activity log of recent actions.</p>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-3 rounded-lg bg-[var(--bg-input)]">
                <Skeleton className="h-4 w-32 mb-1" />
                <Skeleton className="h-3 w-24" />
              </div>
            ))}
          </div>
        ) : auditLogs.length > 0 ? (
          <div className="space-y-3">
            {auditLogs.map((log: AuditLog) => (
              <div key={log.id} className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-input)]">
                <div>
                  <p className="text-sm font-medium text-[var(--fg)]">{formatActionLabel(log.action)}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-[var(--fg-muted)]">
                    {log.ip_address && (
                      <span className="flex items-center gap-1"><HugeiconsIcon icon={GlobeIcon} className="h-3 w-3" />{log.ip_address}</span>
                    )}
                  </div>
                </div>
                <span className="text-xs text-[var(--fg-muted)]">{formatTimestamp(log.created_at)}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-sm text-[var(--fg-muted)]">No activity recorded yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}

function DeleteAccountModal({ open, onClose, username }: { open: boolean; onClose: () => void; username: string }) {
  const [confirmText, setConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)
  const navigate = useNavigate()
  const logout = useAuthStore((s) => s.logout)
  const inputRef = useRef<HTMLInputElement>(null)
  const canDelete = confirmText === username

  useEffect(() => {
    if (open) {
      setConfirmText('')
      setTimeout(() => inputRef.current?.focus(), 100)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (open) window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [open, onClose])

  const handleDelete = async () => {
    if (!canDelete) return
    setDeleting(true)
    try {
      await api.delete('/users/me')
      sileo.success({ description: 'Account deleted' })
      logout()
      navigate('/auth')
    } catch {
      sileo.error({ description: 'Failed to delete account' })
    } finally {
      setDeleting(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Dark blur backdrop with thin diagonal lines covering full screen */}
      <div
        className="absolute inset-0 backdrop-blur-sm"
        style={{
          zIndex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backgroundImage: `repeating-linear-gradient(-45deg, transparent, transparent 20px, rgba(239, 68, 68, 0.04) 20px, rgba(239, 68, 68, 0.04) 21px)`,
        }}
        onClick={onClose}
      />
      {/* Modal content */}
      <div
        className="relative w-full max-w-md mx-4 rounded-xl bg-[var(--bg-card)] shadow-2xl overflow-hidden"
        style={{ zIndex: 10, border: '1px solid rgba(239, 68, 68, 0.25)' }}
      >
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
              <HugeiconsIcon icon={DeleteIcon} className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[var(--fg)]">Delete Account</h2>
              <p className="text-xs text-[var(--fg-muted)]">This action cannot be undone</p>
            </div>
          </div>
          <p className="text-sm text-[var(--fg-secondary)] mb-5">
            This will permanently delete your account <span className="text-[var(--fg)] font-medium">{username}</span> and all associated data including servers, coins, and settings.
          </p>
          <div className="mb-5">
            <label className="text-xs font-medium text-[var(--fg-muted)] block mb-1.5">
              Type <span className="text-red-400 font-semibold">{username}</span> to confirm
            </label>
            <Input
              ref={inputRef}
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Enter your username"
              autoComplete="off"
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" width={100} height={36} onClick={onClose}>
              Cancel
            </Button>
            <Button variant="danger" width={140} height={36} onClick={handleDelete} disabled={!canDelete || deleting} loading={deleting}>
              {deleting ? 'Deleting...' : 'Delete Account'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function DangerZoneSection() {
  const user = useAuthStore((s) => s.user)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  return (
    <>
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-[var(--fg)]">Delete account</h3>
          <p className="text-sm text-[var(--fg-muted)]">Delete your account and all of its resources</p>
        </div>
        <div
          className="space-y-4 rounded-xl p-5"
          style={{
            background: 'linear-gradient(180deg, rgba(185, 28, 28, 0.3) 0%, rgba(127, 29, 29, 0.15) 100%)',
            border: '1.5px solid rgba(239, 68, 68, 0.6)',
          }}
        >
          <div className="space-y-1">
            <p className="text-sm font-semibold text-red-400">Warning</p>
            <p className="text-sm text-red-400/80">
              Please proceed with caution, this cannot be undone.
            </p>
          </div>
          <Button variant="danger" width={160} height={36} onClick={() => setShowDeleteModal(true)}>
            Delete account
          </Button>
        </div>
      </div>
      <DeleteAccountModal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        username={user?.username || ''}
      />
    </>
  )
}

export default function AccountPage() {
  const user = useAuthStore((s) => s.user)

  const { data: balanceData, isLoading } = useQuery({
    queryKey: queryKeys.coins.balance,
    queryFn: getBalance,
  })

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 rounded-2xl overflow-hidden">
          <Avatar
            size={64}
            name={user?.username || 'user'}
            variant="beam"
            colors={['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981']}
          />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-[var(--fg)]">{user?.username || 'User'}</h1>
          <p className="text-base text-[var(--fg-muted)]">{user?.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Tabs defaultValue="profile">
            <TabsList className="mb-6">
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <HugeiconsIcon icon={UserCircleIcon} className="h-4 w-4" /> Profile
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center gap-2">
                <HugeiconsIcon icon={ShieldIcon} className="h-4 w-4" /> Security
              </TabsTrigger>
              <TabsTrigger value="sessions" className="flex items-center gap-2">
                <HugeiconsIcon icon={KeyIcon} className="h-4 w-4" /> Sessions
              </TabsTrigger>
              <TabsTrigger value="activity" className="flex items-center gap-2">
                <HugeiconsIcon icon={ActivityIcon} className="h-4 w-4" /> Activity
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <ProfileSection />
            </TabsContent>

            <TabsContent value="security">
              <SecuritySection />
            </TabsContent>

            <TabsContent value="sessions">
              <SessionsSection />
            </TabsContent>

            <TabsContent value="activity">
              <AuditSection />
            </TabsContent>
          </Tabs>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <div className="bg-[var(--bg-card)] rounded-xl p-6 space-y-4">
            <h3 className="text-base font-semibold text-[var(--fg)]">Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-[var(--fg-muted)]">Coins</span>
                {isLoading ? (
                  <Skeleton className="h-4 w-12" />
                ) : (
                  <span className="text-sm font-medium text-[var(--fg)]">{balanceData?.balance ?? 0}</span>
                )}
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[var(--fg-muted)]">Role</span>
                <span className="text-sm font-medium text-[var(--fg)]">{user?.is_admin ? 'Admin' : 'User'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[var(--fg-muted)]">Member since</span>
                <span className="text-sm font-medium text-[var(--fg)]">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}
                </span>
              </div>
            </div>
          </div>

          <DangerZoneSection />
        </div>
      </div>
    </div>
  )
}
