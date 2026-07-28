import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { listAuditLogs } from '../../api/audit'
import { HugeiconsIcon } from '@hugeicons/react'
import { GlobeIcon, ClockIcon, ComputerIcon, MobileProgrammingIcon } from '@hugeicons/core-free-icons'
import { AdminLayout } from '../../components/admin/AdminLayout'
import { DataTable } from '../../components/DataTable'
import type { Column } from '../../components/DataTable'

interface AuditLog {
  id: string
  user_id: string
  action: string
  metadata: Record<string, unknown> | null
  ip_address: string | null
  user_agent: string | null
  created_at: string
}

function getDeviceIcon(userAgent: string) {
  if (userAgent.includes('iPhone') || userAgent.includes('Android'))
    return <HugeiconsIcon icon={MobileProgrammingIcon} className="h-4 w-4" />
  return <HugeiconsIcon icon={ComputerIcon} className="h-4 w-4" />
}

function getBrowserInfo(userAgent: string) {
  if (userAgent.includes('Chrome')) return 'Chrome'
  if (userAgent.includes('Firefox')) return 'Firefox'
  if (userAgent.includes('Safari')) return 'Safari'
  if (userAgent.includes('Edge')) return 'Edge'
  return 'Unknown'
}

function formatActionLabel(action: string) {
  const actionMap: Record<string, string> = {
    'auth.login': 'Signed in',
    'auth.register': 'Account created',
    'auth.logout': 'Signed out',
    'user.update_profile': 'Profile updated',
    'session.revoke': 'Session revoked',
    'server.create': 'Server created',
    'server.delete': 'Server deleted',
    'server.start': 'Server started',
    'server.stop': 'Server stopped',
  }
  return actionMap[action] || action.replace(/[.:]/g, ' · ')
}

function formatTimestamp(timestamp: string) {
  const date = new Date(timestamp)
  const diffMs = Date.now() - date.getTime()
  const diffSeconds = Math.floor(diffMs / 1000)
  if (diffSeconds < 45) return 'just now'
  if (diffSeconds < 90) return '1 min ago'
  const diffMinutes = Math.floor(diffSeconds / 60)
  if (diffMinutes < 60) return `${diffMinutes}m ago`
  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

export default function AdminActivityPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const limit = 20

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'activity', page],
    queryFn: () => listAuditLogs(page, limit),
  })

  const logs: AuditLog[] = data?.items || []
  const total = data?.meta?.total || 0
  const totalPages = Math.ceil(total / limit)

  const filtered = search
    ? logs.filter((l) =>
        formatActionLabel(l.action).toLowerCase().includes(search.toLowerCase()) ||
        (l.ip_address || '').includes(search)
      )
    : logs

  const columns: Column<AuditLog>[] = [
    {
      label: 'Action',
      width: 'flex-1 min-w-0',
      render: (log) => (
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-[var(--bg-elevated)] flex items-center justify-center text-[var(--fg-muted)]">
            {getDeviceIcon(log.user_agent || '')}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-[var(--fg)]">{formatActionLabel(log.action)}</p>
            {log.metadata && typeof log.metadata === 'object' && (
              <p className="text-xs text-[var(--fg-muted)] truncate max-w-xs">
                {JSON.stringify(log.metadata)}
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      label: 'IP Address',
      width: 'w-36',
      render: (log) => (
        <span className="flex items-center gap-1.5 text-sm text-[var(--fg-secondary)]">
          <HugeiconsIcon icon={GlobeIcon} className="h-3.5 w-3.5" />
          {log.ip_address || '—'}
        </span>
      ),
    },
    {
      label: 'Browser',
      width: 'w-24',
      render: (log) => (
        <span className="text-sm text-[var(--fg-secondary)]">
          {log.user_agent ? getBrowserInfo(log.user_agent) : '—'}
        </span>
      ),
    },
    {
      label: 'Time',
      width: 'w-28 text-right',
      render: (log) => (
        <span className="flex items-center justify-end gap-1.5 text-xs text-[var(--fg-muted)]">
          <HugeiconsIcon icon={ClockIcon} className="h-3.5 w-3.5" />
          {formatTimestamp(log.created_at)}
        </span>
      ),
    },
  ]

  return (
    <AdminLayout title="Activity Log" description="Monitor all user activity across the platform.">
      <DataTable
        data={filtered}
        columns={columns}
        searchValue={search}
        onSearch={(v) => { setSearch(v); setPage(1) }}
        loading={isLoading}
        emptyMessage="No activity recorded yet"
        entityName="event"
        pagination={{
          currentPage: page,
          totalPages: Math.max(1, totalPages),
          total,
          onPageChange: setPage,
        }}
      />
    </AdminLayout>
  )
}
