import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listServers, startServer, stopServer, restartServer } from '../../api/servers'
import { queryKeys } from '../../api/queryKeys'
import { Skeleton } from 'parthenon-ui/components'
import { useAuthStore } from '../../store/authStore'
import { getBalance } from '../../api/coins'
import { sileo } from 'sileo'
import Button from '../../components/Button'

import { DataTable } from '../../components/DataTable'
import { ResourceStats } from '../../components/dashboard/ResourceStats'
import { ActivityLog } from '../../components/dashboard/ActivityLog'

function formatMemory(mb: number): string {
  if (mb >= 1024) return `${(mb / 1024).toFixed(mb % 1024 === 0 ? 0 : 1).replace(/\.0$/, '')} GiB`
  return `${mb} MiB`
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)

  const { data: servers, isLoading } = useQuery({
    queryKey: queryKeys.servers.all,
    queryFn: listServers,
  })

  const { data: balanceData } = useQuery({
    queryKey: queryKeys.coins.balance,
    queryFn: getBalance,
  })

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
    server.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--fg)]">Welcome to Flight Deck, {user?.username || 'there'}</h1>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-80 rounded-lg" />
          <Skeleton className="h-64 rounded-lg" />
        </div>
      ) : (
        <>
          {/* Resource stats bar */}
          <div className="rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-card)] p-4">
            <ResourceStats servers={serverList} />
          </div>

          {/* Account + activity */}
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,320px)]">
            {/* Account info card */}
            <div className="rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-card)] flex flex-col h-full">
              <div className="p-5 pb-2">
                <div className="bg-[var(--bg-elevated)] rounded-xl border border-[var(--border-strong)] h-10 w-10 flex items-center justify-center">
                  <span className="text-sm font-semibold text-[var(--fg-muted)]">
                    {user?.username?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <h3 className="text-base mt-4 text-[var(--fg)]">Account Overview</h3>
                <p className="text-sm mt-2 text-[var(--fg-muted)] leading-relaxed">
                  Welcome back. You have <span className="font-semibold text-[var(--fg)]">{balanceData?.balance ?? 0}</span> coins and <span className="font-semibold text-[var(--fg)]">{serverList.length}</span> server{serverList.length !== 1 ? 's' : ''}.
                </p>
              </div>
              <div className="mt-auto p-5 pt-0 flex items-center gap-3">
                <div className="flex -space-x-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-[var(--bg-card)] text-xs font-medium uppercase shadow-sm bg-yellow-500 text-yellow-800">
                    {user?.username?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-[var(--bg-card)] text-xs font-medium uppercase text-[var(--fg)]/50 shadow-sm bg-neutral-500">
                      --
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <ActivityLog />
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
