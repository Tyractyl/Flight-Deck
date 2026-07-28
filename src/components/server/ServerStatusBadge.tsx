import type { ServerStatus } from '../../types/server'

const statusConfig: Record<ServerStatus, { color: string; label: string }> = {
  RUNNING: { color: 'bg-green-500/20 text-green-400', label: 'Running' },
  STOPPED: { color: 'bg-gray-500/20 text-gray-400', label: 'Stopped' },
  STARTING: { color: 'bg-yellow-500/20 text-yellow-400', label: 'Starting' },
  STOPPING: { color: 'bg-yellow-500/20 text-yellow-400', label: 'Stopping' },
  ERROR: { color: 'bg-red-500/20 text-red-400', label: 'Error' },
  INSTALLING: { color: 'bg-blue-500/20 text-blue-400', label: 'Installing' },
}

interface ServerStatusBadgeProps {
  status: ServerStatus
}

export function ServerStatusBadge({ status }: ServerStatusBadgeProps) {
  const config = statusConfig[status]
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-sans font-medium ${config.color}`}>
      {config.label}
    </span>
  )
}
