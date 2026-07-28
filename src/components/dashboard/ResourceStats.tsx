import { HugeiconsIcon } from '@hugeicons/react'
import { ChartIcon } from '@hugeicons/core-free-icons'
import { formatMemory } from '../../utils/formatMemory'

interface ResourceStatsProps {
  servers: Array<{
    memory_mb: number
    disk_mb: number
    cpu_percent: number
  }>
}

// TODO: replace hardcoded caps with values from a real package/limits API.
const CAPS = {
  memory_mb: 8192,
  disk_mb: 51200,
  cpu_percent: 100,
  servers: 10,
}

function clampPct(value: number): number {
  return Math.min(100, Math.max(0, value))
}

function ResourceCard({
  label,
  used,
  total,
  unit,
}: {
  label: string
  used: number
  total: number
  unit: 'memory' | 'percent' | 'count'
}) {
  const pct = total > 0 ? clampPct((used / total) * 100) : 0
  const displayUsed = unit === 'memory' ? formatMemory(used) : `${used}${unit === 'percent' ? '%' : ''}`
  const displayTotal = unit === 'memory' ? formatMemory(total) : `${total}${unit === 'percent' ? '%' : ''}`

  return (
    <div className="relative flex h-full flex-col p-3 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg overflow-hidden">
      <div
        className="pointer-events-none absolute bottom-0 left-0 w-full h-16 bg-gradient-to-t from-[var(--fg)]/[0.12] to-transparent"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute bottom-0 left-0 h-8 bg-[var(--fg)]/10 blur-lg rounded-r-full"
        style={{ width: `${Math.max(pct, 1)}%` }}
        aria-hidden="true"
      />
      <div className="text-sm font-semibold text-[var(--fg)] mb-3">{label}</div>
      <div className="flex flex-col gap-2 flex-1 justify-center">
        <div className="text-sm text-[var(--fg)] mt-10">
          <span className="font-semibold">{displayUsed}</span>
          <span className="text-[var(--fg-muted)]"> / {displayTotal}</span>
        </div>
        <div className="text-xs text-[var(--fg-muted)]">{pct.toFixed(0)}% utilized</div>
      </div>
    </div>
  )
}

export function ResourceStats({ servers }: ResourceStatsProps) {
  const totalMemory = servers.reduce((sum, s) => sum + s.memory_mb, 0)
  const totalDisk = servers.reduce((sum, s) => sum + s.disk_mb, 0)
  const avgCpu = servers.length
    ? Math.round(servers.reduce((sum, s) => sum + s.cpu_percent, 0) / servers.length)
    : 0

  return (
    <div className="bg-[var(--bg-elevated)]/50 rounded-lg">
      <div className="px-2 pt-2 pb-1 flex items-center gap-2">
        <HugeiconsIcon icon={ChartIcon} className="h-4 w-4 text-[var(--fg-muted)]/30" />
        <span className="text-xs text-[var(--fg-muted)] font-semibold">Resources</span>
      </div>
      <div className="grid grid-cols-2 p-1 gap-1 h-80 items-stretch">
        <ResourceCard label="Memory" used={totalMemory} total={CAPS.memory_mb} unit="memory" />
        <ResourceCard label="Disk" used={totalDisk} total={CAPS.disk_mb} unit="memory" />
        <ResourceCard label="CPU" used={avgCpu} total={CAPS.cpu_percent} unit="percent" />
        <ResourceCard label="Servers" used={servers.length} total={CAPS.servers} unit="count" />
      </div>
    </div>
  )
}
