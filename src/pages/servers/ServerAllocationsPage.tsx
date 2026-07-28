import { useQuery } from '@tanstack/react-query'
import { getServer } from '../../api/servers'
import { queryKeys } from '../../api/queryKeys'
import { sileo } from 'sileo'
import { HugeiconsIcon } from '@hugeicons/react'
import { GlobeIcon, StarIcon, CopyIcon, DeleteIcon, AddIcon } from '@hugeicons/core-free-icons'

interface Allocation {
  id: string
  ip: string
  port: number
  ip_alias: string | null
  is_primary: boolean
}

const MOCK_ALLOCATIONS: Allocation[] = [
  { id: 'alloc-1', ip: '0.0.0.0', port: 25565, ip_alias: 'mc.example.com', is_primary: true },
  { id: 'alloc-2', ip: '0.0.0.0', port: 25575, ip_alias: null, is_primary: false },
  { id: 'alloc-3', ip: '0.0.0.0', port: 8080, ip_alias: 'panel.example.com', is_primary: false },
]

function AllocationCard({ allocation }: { allocation: Allocation }) {
  const displayAddress = allocation.ip_alias
    ? `${allocation.ip_alias}:${allocation.port}`
    : `${allocation.ip}:${allocation.port}`

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    sileo.success({ description: 'Copied to clipboard', icon: false })
  }

  return (
    <div className="group relative flex items-center gap-3 rounded-xl border border-theme-strong bg-[var(--bg-card)] px-1 py-1">
      <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[var(--bg)] text-[var(--fg-muted)] shadow-xs ring-1 ring-theme-strong">
        <HugeiconsIcon icon={GlobeIcon} className="relative h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1 pl-2">
        <div className="flex items-center gap-2">
          <code className="text-sm font-medium text-[var(--fg)]">{displayAddress}</code>
          {allocation.is_primary && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--accent)]/10 px-2 py-0.5 text-[11px] font-medium text-[var(--accent)]">
              <HugeiconsIcon icon={StarIcon} className="h-2.5 w-2.5" />
              Primary
            </span>
          )}
        </div>
        <p className="text-xs text-[var(--fg-muted)]">
          {allocation.ip_alias
            ? `${allocation.ip}:${allocation.port}`
            : `Port ${allocation.port}`}
        </p>
      </div>
      <div className="flex items-center gap-1 pr-2">
        <button
          onClick={() => copyToClipboard(displayAddress)}
          className="p-2 rounded-lg hover:bg-[var(--bg-elevated)] text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors"
          title="Copy address"
        >
          <HugeiconsIcon icon={CopyIcon} className="h-3.5 w-3.5" />
        </button>
        {!allocation.is_primary && (
          <>
            <button
              className="p-2 rounded-lg hover:bg-[var(--bg-elevated)] text-[var(--fg-muted)] hover:text-yellow-400 transition-colors"
              title="Make primary"
            >
              <HugeiconsIcon icon={StarIcon} className="h-3.5 w-3.5" />
            </button>
            <button
              className="p-2 rounded-lg hover:bg-red-500/10 text-[var(--fg-muted)] hover:text-red-400 transition-colors"
              title="Remove allocation"
            >
              <HugeiconsIcon icon={DeleteIcon} className="h-3.5 w-3.5" />
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default function ServerAllocationsPage({ serverId }: { serverId: string }) {
  const { data: server, isLoading } = useQuery({
    queryKey: queryKeys.servers.detail(serverId),
    queryFn: () => getServer(serverId),
    enabled: !!serverId,
  })

  const realAllocations: Allocation[] = server?.port_bindings?.map((pb: { host_port: number }, i: number) => ({
    id: `alloc-${i}`,
    ip: '0.0.0.0',
    port: pb.host_port,
    ip_alias: null,
    is_primary: i === 0,
  })) || []

  const allocations = realAllocations.length > 0 ? realAllocations : MOCK_ALLOCATIONS

  return (
    <div className="px-1 py-6 space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-[var(--fg)]">Allocations</h2>
        <p className="text-sm text-[var(--fg-muted)]">Manage the network port allocations for this server.</p>
      </div>

      <div className="rounded-md bg-[var(--bg-elevated)] p-1">
        <div className="rounded-md border border-theme-strong bg-[var(--bg-card)] p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-[var(--fg)]">Port allocations</h3>
              <p className="text-xs text-[var(--fg-muted)] mt-0.5">
                The primary allocation is the main address used to connect to this server.
              </p>
            </div>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-[var(--accent)] text-white text-xs font-medium hover:opacity-90 transition-opacity">
              <HugeiconsIcon icon={AddIcon} className="h-4 w-4" />
              Add allocation
            </button>
          </div>

          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-sm text-[var(--fg-muted)]">Loading allocations...</p>
            </div>
          ) : (
            <div className="mt-6 grid gap-2 sm:grid-cols-2">
              {allocations.map((alloc) => (
                <AllocationCard key={alloc.id} allocation={alloc} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
