import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getServer, startServer, stopServer, restartServer, killServer, deleteServer } from '../../api/servers'
import { queryKeys } from '../../api/queryKeys'
import ServerConsole from '../../components/server/ServerConsole'
import ServerBackupsPage from './ServerBackupsPage'
import ServerUsersPage from './ServerUsersPage'
import ServerFilesPage from './ServerFilesPage'
import ServerAllocationsPage from './ServerAllocationsPage'
import ServerFirewallPage from './ServerFirewallPage'
import { sileo } from 'sileo'
import Loader from '../../components/Loader'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  TerminalIcon, FileIcon, SettingsIcon, HardDriveIcon,
  PlayIcon, PauseIcon, RefreshIcon,
  DeleteIcon, GroupIcon, AiNetworkIcon, ShieldIcon
} from '@hugeicons/core-free-icons'
import type { ServerStatus } from '../../types/server'

const statusLabels: Record<ServerStatus, string> = {
  RUNNING: 'Running',
  STOPPED: 'Offline',
  STARTING: 'Starting',
  STOPPING: 'Stopping',
  ERROR: 'Error',
  INSTALLING: 'Installing',
}

const statusDotColors: Record<ServerStatus, string> = {
  RUNNING: 'bg-emerald-500',
  STOPPED: 'bg-neutral-500',
  STARTING: 'bg-amber-500',
  STOPPING: 'bg-amber-500',
  ERROR: 'bg-red-500',
  INSTALLING: 'bg-sky-500',
}

const navItems = [
  { id: 'console', label: 'Console', icon: TerminalIcon },
  { id: 'files', label: 'Files', icon: FileIcon },
  { id: 'allocations', label: 'Allocations', icon: AiNetworkIcon },
  { id: 'firewall', label: 'Firewall', icon: ShieldIcon },
  { id: 'backups', label: 'Backups', icon: HardDriveIcon },
  { id: 'users', label: 'Users', icon: GroupIcon },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
]

function StatusDot({ status }: { status: ServerStatus }) {
  const color = statusDotColors[status] || 'bg-neutral-500'
  return (
    <span className="relative inline-flex h-2 w-2 shrink-0">
      <span className={`absolute inline-flex h-full w-full rounded-full ${color} opacity-40`} />
      <span className={`relative inline-flex h-2 w-2 rounded-full ${color}`} />
    </span>
  )
}

function MetaCard({
  label,
  value,
  icon,
}: {
  label: string
  value: string
  icon: typeof TerminalIcon
}) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-xl border border-theme-strong bg-[var(--bg-card)] px-1 py-1">
      <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[var(--bg)] text-[var(--fg-muted)] shadow-xs ring-1 ring-theme-strong">
        <HugeiconsIcon icon={icon} className="relative h-4 w-4" />
      </div>
      <div className="min-w-0 space-y-0.5 pl-2">
        <p className="text-xs font-medium text-[var(--fg-muted)]">{label}</p>
        <p className="truncate text-sm font-medium text-[var(--fg)]">{value}</p>
      </div>
    </div>
  )
}

function PowerButton({
  label,
  icon,
  variant,
  disabled,
  onClick,
}: {
  label: string
  icon: typeof PlayIcon
  variant: 'primary' | 'secondary' | 'danger'
  disabled?: boolean
  onClick: () => void
}) {
  const base = 'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed'
  const variantClasses = {
    primary: 'bg-[var(--accent)] text-white hover:opacity-90',
    secondary: 'bg-[var(--bg-elevated)] text-[var(--fg)] border border-theme-strong hover:bg-[var(--bg-card)]',
    danger: 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20',
  }

  return (
    <button className={`${base} ${variantClasses[variant]}`} disabled={disabled} onClick={onClick}>
      <HugeiconsIcon icon={icon} size={12} />
      {label}
    </button>
  )
}

export default function ServerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [activeNav, setActiveNav] = useState('console')

  const { data: server, isLoading } = useQuery({
    queryKey: queryKeys.servers.detail(id!),
    queryFn: () => getServer(id!),
    enabled: !!id,
  })

  const startMutation = useMutation({
    mutationFn: () => startServer(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.servers.detail(id!) })
      sileo.success({ description: 'Server starting...', icon: false })
    },
    onError: () => sileo.error({ description: 'Failed to start server', icon: false }),
  })

  const stopMutation = useMutation({
    mutationFn: () => stopServer(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.servers.detail(id!) })
      sileo.success({ description: 'Server stopping...', icon: false })
    },
    onError: () => sileo.error({ description: 'Failed to stop server', icon: false }),
  })

  const restartMutation = useMutation({
    mutationFn: () => restartServer(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.servers.detail(id!) })
      sileo.success({ description: 'Server restarting...', icon: false })
    },
    onError: () => sileo.error({ description: 'Failed to restart server', icon: false }),
  })

  const killMutation = useMutation({
    mutationFn: () => killServer(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.servers.detail(id!) })
      sileo.success({ description: 'Server killed', icon: false })
    },
    onError: () => sileo.error({ description: 'Failed to kill server', icon: false }),
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteServer(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.servers.all })
      navigate('/servers')
      sileo.success({ description: 'Server deleted', icon: false })
    },
    onError: () => sileo.error({ description: 'Failed to delete server', icon: false }),
  })

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader size={80} color="var(--accent, #3b82f6)" />
      </div>
    )
  }

  if (!server) return null

  const portBinding = server.port_bindings?.[0]
  const ipDisplay = portBinding ? `0.0.0.0:${portBinding.host_port}` : 'No allocation'
  const eggDisplay = server.egg_name || 'Unknown'

  return (
    <div className="flex h-full flex-1 flex-col gap-6 px-4 py-6">
      {/* Server Header */}
      <section className="space-y-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <h1 className="truncate text-xl font-semibold tracking-tight text-[var(--fg)]">
                {server.name}
              </h1>
              <span className="inline-flex items-center gap-1.5">
                <StatusDot status={server.status} />
                <span className="text-xs font-medium text-[var(--fg-muted)]">
                  {statusLabels[server.status]}
                </span>
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {server.status === 'STOPPED' || server.status === 'ERROR' ? (
              <PowerButton
                label="Start"
                icon={PlayIcon}
                variant="primary"
                disabled={startMutation.isPending}
                onClick={() => startMutation.mutate()}
              />
            ) : (
              <>
                <PowerButton
                  label="Restart"
                  icon={RefreshIcon}
                  variant="secondary"
                  disabled={restartMutation.isPending}
                  onClick={() => restartMutation.mutate()}
                />
                <PowerButton
                  label="Stop"
                  icon={PauseIcon}
                  variant="secondary"
                  disabled={stopMutation.isPending}
                  onClick={() => stopMutation.mutate()}
                />
                <PowerButton
                  label="Kill"
                  icon={DeleteIcon}
                  variant="danger"
                  disabled={killMutation.isPending}
                  onClick={() => {
                    if (confirm('Kill this server? This will forcibly terminate the process.')) {
                      killMutation.mutate()
                    }
                  }}
                />
              </>
            )}
          </div>
        </div>

        {/* Meta cards */}
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <MetaCard icon={AiNetworkIcon} label="IP Address" value={ipDisplay} />
          <MetaCard icon={HardDriveIcon} label="Egg" value={eggDisplay} />
          <MetaCard icon={TerminalIcon} label="Resources" value={`${server.memory_mb} MiB RAM · ${server.cpu_percent}% CPU`} />
        </div>
      </section>

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 overflow-x-auto rounded-lg bg-[var(--bg-elevated)] p-1">
        {navItems.map((item) => {
          const isActive = activeNav === item.id
          return (
            <button
              key={item.id}
              onClick={() => setActiveNav(item.id)}
              className={`flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-[var(--bg-card)] text-[var(--fg)] shadow-sm'
                  : 'text-[var(--fg-muted)] hover:text-[var(--fg)]'
              }`}
            >
              <HugeiconsIcon icon={item.icon} size={13} className="shrink-0" />
              {item.label}
            </button>
          )
        })}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden min-h-0">
        {activeNav === 'console' && <ServerConsole serverId={id!} />}
        {activeNav === 'files' && <ServerFilesPage />}
        {activeNav === 'allocations' && <ServerAllocationsPage serverId={id!} />}
        {activeNav === 'firewall' && <ServerFirewallPage serverId={id!} />}
        {activeNav === 'backups' && <ServerBackupsPage />}
        {activeNav === 'users' && <ServerUsersPage />}
        {activeNav === 'settings' && (
          <div className="px-1 py-6">
            <h3 className="text-lg font-semibold text-[var(--fg)] mb-1">Settings</h3>
            <p className="text-sm text-[var(--fg-muted)] mb-6">Manage this server's general details and danger zone actions.</p>

            <div className="rounded-md bg-[var(--bg-elevated)] p-1">
              <div className="rounded-md border border-theme-strong bg-[var(--bg-card)] p-6">
                <h4 className="text-sm font-semibold text-[var(--fg)]">Danger Zone</h4>
                <p className="text-xs text-[var(--fg-muted)] mt-1 mb-4">
                  Irreversible and destructive actions.
                </p>
                <div className="flex items-center justify-between rounded-lg border border-red-500/20 bg-red-500/5 p-4">
                  <div>
                    <p className="text-sm font-medium text-[var(--fg)]">Delete this server</p>
                    <p className="text-xs text-[var(--fg-muted)] mt-0.5">
                      Once you delete a server, there is no going back. All files and data will be lost.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this server? This cannot be undone.')) {
                        deleteMutation.mutate()
                      }
                    }}
                    disabled={deleteMutation.isPending}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-xs font-medium border border-red-500/20 hover:bg-red-500/20 transition-colors disabled:opacity-40"
                  >
                    <HugeiconsIcon icon={DeleteIcon} size={12} />
                    Delete Server
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
