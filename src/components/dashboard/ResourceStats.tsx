import { HugeiconsIcon } from '@hugeicons/react'
import { CpuIcon, RamMemoryIcon, HardDriveIcon } from '@hugeicons/core-free-icons'

interface ResourceStatsProps {
  servers: Array<{
    memory_mb: number
    disk_mb: number
    cpu_percent: number
  }>
}

export function ResourceStats({ servers }: ResourceStatsProps) {
  const totalMemory = servers.reduce((sum, s) => sum + s.memory_mb, 0)
  const totalDisk = servers.reduce((sum, s) => sum + s.disk_mb, 0)
  const totalCpu = servers.reduce((sum, s) => sum + s.cpu_percent, 0)

  return (
    <div className="flex items-center gap-6 text-sm">
      <div className="flex items-center gap-2 text-[var(--fg-secondary)]">
        <HugeiconsIcon icon={RamMemoryIcon} size={14} />
        <span>{totalMemory} MB</span>
      </div>
      <div className="flex items-center gap-2 text-[var(--fg-secondary)]">
        <HugeiconsIcon icon={HardDriveIcon} size={14} />
        <span>{totalDisk} MB</span>
      </div>
      <div className="flex items-center gap-2 text-[var(--fg-secondary)]">
        <HugeiconsIcon icon={CpuIcon} size={14} />
        <span>{totalCpu}%</span>
      </div>
      <span className="text-[var(--fg-faint)]">{servers.length} server{servers.length !== 1 ? 's' : ''}</span>
    </div>
  )
}
