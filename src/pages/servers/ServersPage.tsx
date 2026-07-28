import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listServers, startServer, stopServer, restartServer } from '../../api/servers'
import { queryKeys } from '../../api/queryKeys'
import { Skeleton } from 'parthenon-ui/components'
import { sileo } from 'sileo'
import { HugeiconsIcon } from '@hugeicons/react'
import { RamMemoryIcon, CpuIcon, PlayIcon, PauseIcon, RefreshIcon, CopyIcon, CheckIcon } from '@hugeicons/core-free-icons'
import Button from '../../components/Button'

const statusColors: Record<string, string> = {
  RUNNING: 'bg-emerald-500',
  STARTING: 'bg-amber-500',
  STOPPING: 'bg-amber-500',
  INSTALLING: 'bg-amber-500',
  ERROR: 'bg-red-500',
  OFFLINE: 'bg-neutral-500',
  STOPPED: 'bg-neutral-500',
}

function StatusDot({ status }: { status: string }) {
  const color = statusColors[status] || 'bg-neutral-500'
  return (
    <span className="relative inline-flex h-2.5 w-2.5 shrink-0">
      <span className={`absolute inline-flex h-full w-full rounded-full ${color} opacity-40`} />
      <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${color}`} />
    </span>
  )
}

function formatMemory(mb: number): string {
  if (mb >= 1024) return `${(mb / 1024).toFixed(0)} GiB`
  return `${mb} MiB`
}

export default function ServersPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const { data: servers, isLoading } = useQuery({
    queryKey: queryKeys.servers.all,
    queryFn: listServers,
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

  const copyIp = (server: { id: string; port_bindings?: { host_port: number }[] }) => {
    const alloc = server.port_bindings?.[0]
    if (!alloc) return
    const ip = `0.0.0.0:${alloc.host_port}`
    navigator.clipboard.writeText(ip)
    setCopiedId(server.id)
    setTimeout(() => setCopiedId(null), 1500)
  }

  const isRunning = (status: string) => status === 'RUNNING' || status === 'STARTING'

  return (
    <div className="max-w-5xl mx-auto h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-[var(--fg)]">Servers</h1>
          <p className="text-sm text-[var(--fg-muted)] mt-0.5">A list of all servers you own or have access to.</p>
        </div>
        <Button width={140} height={32} onClick={() => navigate('/servers/new')}>
          + New server
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-lg" />
          ))}
        </div>
      ) : !Array.isArray(servers) || !servers.length ? (
        <div className="flex flex-col items-center justify-center py-16">
          <p className="text-[var(--fg-muted)]">No servers yet. Use the button above to create one.</p>
        </div>
      ) : (
        <div className="rounded-lg border border-theme overflow-hidden">
          {/* Header */}
          <div className="flex items-center px-4 py-2.5 bg-[var(--bg-card)] border-b border-theme">
            <div className="flex-1 min-w-0 text-xs font-medium text-[var(--fg-muted)]">Name</div>
            <div className="w-64 text-xs font-medium text-[var(--fg-muted)] hidden sm:block">Memory</div>
            <div className="w-56 text-xs font-medium text-[var(--fg-muted)] hidden sm:block">CPU</div>
            <div className="w-28 text-xs font-medium text-[var(--fg-muted)] text-right hidden sm:block">Actions</div>
          </div>

          {/* Rows */}
          <div className="bg-[var(--bg-card)]">
            {servers.map((server, index) => {
              const alloc = server.port_bindings?.[0]
              const ip = alloc ? `0.0.0.0:${alloc.host_port}` : null
              const running = isRunning(server.status)

              return (
                <div
                  key={server.id}
                  className={`flex items-center px-4 py-3 hover:bg-[var(--bg-card-hover)] cursor-pointer transition-colors ${index !== servers.length - 1 ? 'border-b border-theme' : ''}`}
                  onClick={() => navigate(`/servers/${server.id}`)}
                >
                  {/* Name + Status + IP */}
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-[var(--fg)] truncate">{server.name}</p>
                      <StatusDot status={server.status} />
                    </div>
                    {ip && (
                      <button
                        className="mt-1 flex items-center gap-1.5 text-xs text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors"
                        onClick={(e) => { e.stopPropagation(); copyIp(server) }}
                        title="Click to copy IP"
                      >
                        <span className="font-mono">{ip}</span>
                        {copiedId === server.id ? (
                          <HugeiconsIcon icon={CheckIcon} size={12} className="text-emerald-500" />
                        ) : (
                          <HugeiconsIcon icon={CopyIcon} size={12} className="opacity-40" />
                        )}
                      </button>
                    )}
                  </div>

                  {/* Memory */}
                  <div className="w-64 hidden sm:block">
                    <div className="flex items-center gap-2 text-sm text-[var(--fg)]">
                      <HugeiconsIcon icon={RamMemoryIcon} size={16} className="text-[var(--fg-muted)]" />
                      <span>{formatMemory(server.memory_mb)}</span>
                    </div>
                  </div>

                  {/* CPU */}
                  <div className="w-56 hidden sm:block">
                    <div className="flex items-center gap-2 text-sm text-[var(--fg)]">
                      <HugeiconsIcon icon={CpuIcon} size={16} className="text-[var(--fg-muted)]" />
                      <span>{server.cpu_percent}%</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="w-28 flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                    {running ? (
                      <>
                        <button
                          onClick={() => stopMutation.mutate(server.id)}
                          className="p-1.5 rounded-md hover:bg-[var(--bg-elevated)] text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors"
                          title="Stop"
                        >
                          <HugeiconsIcon icon={PauseIcon} size={14} />
                        </button>
                        <button
                          onClick={() => restartMutation.mutate(server.id)}
                          className="p-1.5 rounded-md hover:bg-[var(--bg-elevated)] text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors"
                          title="Restart"
                        >
                          <HugeiconsIcon icon={RefreshIcon} size={14} />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => startMutation.mutate(server.id)}
                        className="p-1.5 rounded-md hover:bg-[var(--bg-elevated)] text-[var(--fg-muted)] hover:text-emerald-400 transition-colors"
                        title="Start"
                      >
                        <HugeiconsIcon icon={PlayIcon} size={14} />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
