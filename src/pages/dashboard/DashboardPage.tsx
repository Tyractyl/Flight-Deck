import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listServers, startServer, stopServer, restartServer } from '../../api/servers'

import { queryKeys } from '../../api/queryKeys'
import api from '../../api/client'
import { useBrandingStore } from '../../store/brandingStore'
import { listNodeStatus, getUptime, type UptimePoint } from '../../api/nodes'
import { Skeleton } from 'parthenon-ui/components'
import { useAuthStore } from '../../store/authStore'
import { sileo } from 'sileo'
import Button from '../../components/Button'

import { DataTable } from '../../components/DataTable'
import { ResourceStats } from '../../components/dashboard/ResourceStats'
import { formatMemory } from '../../utils/formatMemory'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card'

const MEMBER_COLORS = ['bg-yellow-500', 'bg-blue-500', 'bg-green-500', 'bg-purple-500']
const MEMBER_TEXT_COLORS = ['text-yellow-800', 'text-blue-800', 'text-green-800', 'text-purple-800']
const PLACEHOLDER_COLOR = 'bg-neutral-400 dark:bg-neutral-600'

interface NodeStatus {
  id: string
  name: string
  is_online: boolean
}

interface HealthStatus {
  status: string
  version?: string
}

function UptimeCard() {
  const { data: uptime } = useQuery({
    queryKey: ['uptime'],
    queryFn: getUptime,
    refetchInterval: 60000,
  })

  const percentage = uptime?.percentage ?? 100
  const sparkline = uptime?.sparkline ?? []

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-[var(--fg-muted)]">Platform uptime</span>
        <span className="text-sm font-semibold text-[var(--fg)]">{percentage.toFixed(2)}%</span>
      </div>
      <div className="h-10 flex items-end gap-px">
        {sparkline.length === 0 ? (
          <span className="text-xs text-[var(--fg-muted)]">No data yet</span>
        ) : (
          sparkline.map((point: UptimePoint, index: number) => {
            const height = point.total === 0 ? 0 : (point.online / point.total) * 100
            return (
              <div
                key={index}
                className="flex-1 bg-green-500/80 rounded-sm transition-all"
                style={{          height: `${height}%` }}
                title={`${new Date(point.bucket).toLocaleTimeString()} — ${height.toFixed(0)}%`}
              />
            )
          })
        )}
      </div>
    </div>
  )
}

function StatusAndAnnouncements({ nodes, health }: { nodes: NodeStatus[]; health: { data?: HealthStatus; error: Error | null } }) {
  const settings = useBrandingStore((s) => s.settings)
  const onlineNodes = nodes.filter((n) => n.is_online).length
  const offlineNodes = nodes.length - onlineNodes
  const healthStatus = health?.data?.status
  const healthError = health?.error != null

  if (!settings.show_status_card && settings.announcement_enabled && settings.announcement_text) {
    return (
      <div className="rounded-lg border border-[var(--border-strong)] bg-[var(--bg-elevated)]/50 p-3">
        <p className="text-xs font-medium text-[var(--fg)] mb-1">Announcement</p>
        <p className="text-xs text-[var(--fg-muted)] whitespace-pre-wrap">{settings.announcement_text}</p>
      </div>
    )
  }

  if (!settings.show_status_card) return null

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs text-[var(--fg-muted)]">
        <span className="font-medium text-[var(--fg)]">Backend:</span>
        {healthStatus === 'ok' ? (
          <span className="inline-flex items-center gap-1 text-green-400">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
            Online
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-red-400">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
            {healthError ? 'Error' : 'Checking...'}
          </span>
        )}
      </div>
      {nodes.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-[var(--fg-muted)]">
          <span className="font-medium text-[var(--fg)]">Nodes:</span>
          <span className="inline-flex items-center gap-1 text-green-400">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
            {onlineNodes} online
          </span>
          {offlineNodes > 0 && (
            <span className="inline-flex items-center gap-1 text-red-400">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
              {offlineNodes} offline
            </span>
          )}
        </div>
      )}
      {settings.announcement_enabled && settings.announcement_text && (
        <div className="mt-2 pt-2 border-t border-[var(--border)]">
          <p className="text-xs text-[var(--fg-muted)] whitespace-pre-wrap">{settings.announcement_text}</p>
        </div>
      )}
    </div>
  )
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)

  const { data: servers, isLoading } = useQuery({
    queryKey: queryKeys.servers.all,
    queryFn: listServers,
  })

  // Tenant members are not supported by the current backend; only show the current user.
  const tenantMembers: { user_id: string; username?: string; email?: string; avatar_url?: string | null }[] = []

  const { data: nodes = [] } = useQuery({
    queryKey: ['nodes-status'],
    queryFn: listNodeStatus,
  })

  const healthQuery = useQuery<HealthStatus>({
    queryKey: ['health'],
    queryFn: async () => {
      const { data } = await api.get('/health')
      return data as HealthStatus
    },
    refetchInterval: 30000,
    retry: false,
  })

  const currentUserMember = user
    ? {
        user_id: user.id,
        username: user.username,
        email: user.email,
        avatar_url: user.avatar_url,
      }
    : null

  const allMembers = currentUserMember
    ? [currentUserMember, ...tenantMembers.filter((m) => m.user_id !== currentUserMember.user_id).slice(0, 3)]
    : tenantMembers.slice(0, 4)

  const visibleMembers = allMembers.slice(0, Math.min(allMembers.length, 4))
  const placeholderCount = Math.max(0, 4 - visibleMembers.length)
  const extraMemberCount = Math.max(0, tenantMembers.length - 4)

  const startMutation = useMutation({
    mutationFn: (id: string) => startServer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.servers.all })
      sileo.success({ description: 'Server starting...', icon: false })
    },
    onError: () => sileo.error({ description: 'Failed to start server', icon: false }),
  })

  const stopMutation = useMutation({
    mutationFn: (id: string) => stopServer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.servers.all })
      sileo.success({ description: 'Server stopping...', icon: false })
    },
    onError: () => sileo.error({ description: 'Failed to stop server', icon: false }),
  })

  const restartMutation = useMutation({
    mutationFn: (id: string) => restartServer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.servers.all })
      sileo.success({ description: 'Server restarting...', icon: false })
    },
    onError: () => sileo.error({ description: 'Failed to restart server', icon: false }),
  })

  const serverList = Array.isArray(servers) ? servers : []
  const [search, setSearch] = useState('')
  const filteredServers = serverList.filter((server) =>
    server.name.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--fg)]">
          Welcome to Flight Deck{user?.username ? `, ${user.username}` : ''} 👋
        </h1>
        <p className="text-sm text-[var(--fg-muted)] mt-1">
          Here's an overview of your account and servers.
        </p>
      </div>

      {isLoading ? (
        <Skeleton className="h-80 rounded-lg" />
      ) : (
        <>
          {/* Account + activity */}
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]">
            <ResourceStats servers={serverList} />

            <Card className="flex flex-col h-full">
              <CardHeader>
                <CardTitle>Your personal Flight Deck</CardTitle>
                <CardDescription>
                  Where your servers, resources, and coins live. Manage everything from one place.
                </CardDescription>
              </CardHeader>
              <CardContent className="mt-auto pt-4 space-y-4">
                <UptimeCard />
                <StatusAndAnnouncements nodes={nodes} health={healthQuery} />
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-3">
                    {visibleMembers.map((member, index) => {
                      const colorClass = MEMBER_COLORS[index % MEMBER_COLORS.length]
                      const textColorClass = MEMBER_TEXT_COLORS[index % MEMBER_TEXT_COLORS.length]
                      const initial = member.username?.charAt(0).toUpperCase() || member.email?.charAt(0).toUpperCase() || 'U'
                      return (
                        <div
                          key={member.user_id}
                          className={`flex h-10 w-10 items-center justify-center rounded-lg border-2 border-[var(--card)] text-xs font-medium uppercase shadow-sm overflow-hidden ${colorClass} ${textColorClass}`}
                          title={member.username || member.email}
                        >
                          {member.avatar_url ? (
                            <img src={member.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="relative z-10">{initial}</span>
                          )}
                        </div>
                      )
                    })}
                    {placeholderCount > 0 && new Array(placeholderCount).fill(null).map((_, index) => (
                      <div
                        key={`placeholder-${index}`}
                        className={`flex h-10 w-10 items-center justify-center rounded-lg border-2 border-[var(--card)] text-xs font-medium uppercase text-white/50 shadow-sm ${PLACEHOLDER_COLOR}`}
                      >
                        --
                      </div>
                    ))}
                  </div>
                  {extraMemberCount > 0 && (
                    <span className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-700 dark:text-neutral-300">
                      + {extraMemberCount} more
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

        </>
      )}

      {/* Servers list */}
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-[var(--fg)]">Your servers</h2>
            <p className="text-xs text-[var(--fg-muted)] mt-1">
              {serverList.length} server{serverList.length !== 1 ? 's' : ''} total
            </p>
          </div>
          <Button width={130} height={32} onClick={() => navigate('/servers/new')}>
            + New Server
          </Button>
        </div>

        {isLoading ? (
          <Skeleton className="h-48 rounded-lg" />
        ) : (
          <DataTable
            data={filteredServers}
            columns={[
              {
                label: 'Server',
                width: 'flex-1 min-w-[180px]',
                render: (server) => {
                  const port = server.port_bindings?.[0]
                  return (
                    <div className="flex min-w-0 flex-col justify-center">
                      <p className="text-sm font-medium text-[var(--fg)] truncate">{server.name}</p>
                      <p className="text-xs text-[var(--fg-muted)] font-mono mt-px">
                        {port ? `:${port.host_port}` : 'No Port'}
                      </p>
                    </div>
                  )
                },
              },
              {
                label: 'Status',
                width: 'w-28',
                render: (server) => (
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-[var(--fg)] capitalize">{server.status.toLowerCase()}</span>
                  </div>
                ),
              },
              {
                label: 'Memory',
                width: 'w-28',
                render: (server) => <p className="text-sm text-[var(--fg)]">{formatMemory(server.memory_mb)}</p>,
              },
              {
                label: 'CPU',
                width: 'w-20',
                render: (server) => <p className="text-sm text-[var(--fg)]">{server.cpu_percent}%</p>,
              },
              {
                label: 'Node',
                width: 'w-28',
                render: (server) => <p className="text-sm text-[var(--fg)] truncate">{server.node_name || '—'}</p>,
              },
              {
                label: 'Actions',
                width: 'w-24',
                render: (server) => {
                  const isRunning = server.status === 'RUNNING' || server.status === 'STARTING'
                  return (
                    <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        {isRunning ? (
                          <>
                            <button
                              type="button"
                              onClick={() => stopMutation.mutate(server.id)}
                              className="inline-flex items-center justify-center p-1 text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors"
                              title="Stop"
                            >
                              <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                                <rect x="6" y="6" width="12" height="12" rx="2" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              onClick={() => restartMutation.mutate(server.id)}
                              className="inline-flex items-center justify-center p-1 text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors"
                              title="Restart"
                            >
                              <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                                <path d="M17.65 6.35A7.95 7.95 0 0012 4a8 8 0 00-8 8 8 8 0 008 8 8 8 0 006.06-2.79l-1.56-1.34A6.02 6.02 0 0112 18a6 6 0 01-6-6 6 6 0 016-6 5.96 5.96 0 014.95 2.55L13 11h7V4l-2.35 2.35z" />
                              </svg>
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => startMutation.mutate(server.id)}
                            className="inline-flex items-center justify-center p-1 text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors"
                            title="Start"
                          >
                            <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </button>
                        )}
                      </div>
                  )
                },
              },
            ]}
            searchValue={search}
            onSearch={setSearch}
            onRowClick={(server) => navigate(`/servers/${server.id}`)}
            emptyMessage="No servers yet"
            emptySearchMessage="Try a different server name."
            bulkDeleteUrl="/api/servers"
            entityName="server"
          />
        )}
      </div>
    </div>
  )
}
