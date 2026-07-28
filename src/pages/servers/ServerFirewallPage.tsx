import { useQuery } from '@tanstack/react-query'
import { getServer } from '../../api/servers'
import { queryKeys } from '../../api/queryKeys'
import { HugeiconsIcon } from '@hugeicons/react'
import { ShieldIcon, ShieldBanIcon, AddIcon, DeleteIcon } from '@hugeicons/core-free-icons'

interface FirewallRule {
  id: string
  direction: 'inbound' | 'outbound'
  action: 'allow' | 'deny'
  protocol: 'tcp' | 'udp' | 'icmp'
  source: string
  port_start: number
  port_end: number | null
  notes: string | null
}

const MOCK_INBOUND_RULES: FirewallRule[] = [
  { id: 'rule-1', direction: 'inbound', action: 'allow', protocol: 'tcp', source: '0.0.0.0/0', port_start: 25565, port_end: 25565, notes: 'Minecraft game port' },
  { id: 'rule-2', direction: 'inbound', action: 'allow', protocol: 'tcp', source: '0.0.0.0/0', port_start: 25575, port_end: 25575, notes: 'Minecraft query port' },
  { id: 'rule-3', direction: 'inbound', action: 'deny', protocol: 'tcp', source: '10.0.0.0/8', port_start: 8080, port_end: 8080, notes: 'Block internal access to web panel' },
]

const MOCK_OUTBOUND_RULES: FirewallRule[] = [
  { id: 'rule-4', direction: 'outbound', action: 'allow', protocol: 'tcp', source: '0.0.0.0/0', port_start: 443, port_end: 443, notes: 'HTTPS outbound' },
  { id: 'rule-5', direction: 'outbound', action: 'allow', protocol: 'tcp', source: '0.0.0.0/0', port_start: 80, port_end: 80, notes: 'HTTP outbound' },
]

function formatPort(start: number, end: number | null) {
  if (!end || start === end) return `${start}`
  return `${start}-${end}`
}

function RuleCard({ rule }: { rule: FirewallRule }) {
  const isAllow = rule.action === 'allow'
  const isInbound = rule.direction === 'inbound'

  return (
    <div className="group relative flex items-center gap-3 rounded-xl border border-theme-strong bg-[var(--bg-card)] px-1 py-1">
      <div className={`relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg shadow-xs ring-1 ${
        isAllow
          ? 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20'
          : 'bg-red-500/10 text-red-400 ring-red-500/20'
      }`}>
        <HugeiconsIcon icon={isAllow ? ShieldIcon : ShieldBanIcon} className="relative h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1 pl-2">
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
            isAllow
              ? 'bg-emerald-500/10 text-emerald-400'
              : 'bg-red-500/10 text-red-400'
          }`}>
            {isAllow ? 'Allow' : 'Deny'}
          </span>
          <span className="inline-flex items-center rounded-full bg-[var(--bg-elevated)] px-2 py-0.5 text-[11px] font-medium text-[var(--fg-muted)]">
            {isInbound ? 'Inbound' : 'Outbound'}
          </span>
          <span className="rounded-full bg-[var(--bg-elevated)] px-2 py-0.5 font-mono text-[11px] font-medium uppercase text-[var(--fg-muted)]">
            {rule.protocol}
          </span>
        </div>
        <div className="mt-0.5 flex items-center gap-3 text-xs text-[var(--fg-muted)]">
          <span>{rule.source}</span>
          <span>Port {formatPort(rule.port_start, rule.port_end)}</span>
          {rule.notes && <span className="truncate italic">{rule.notes}</span>}
        </div>
      </div>
      <div className="flex items-center gap-1 pr-2">
        <button
          className="p-2 rounded-lg hover:bg-red-500/10 text-[var(--fg-muted)] hover:text-red-400 transition-colors"
          title="Delete rule"
        >
          <HugeiconsIcon icon={DeleteIcon} className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}

export default function ServerFirewallPage({ serverId }: { serverId: string }) {
  const { isLoading } = useQuery({
    queryKey: queryKeys.servers.detail(serverId),
    queryFn: () => getServer(serverId),
    enabled: !!serverId,
  })

  const inboundRules = MOCK_INBOUND_RULES
  const outboundRules = MOCK_OUTBOUND_RULES

  if (isLoading) {
    return (
      <div className="px-1 py-6">
        <p className="text-sm text-[var(--fg-muted)]">Loading firewall rules...</p>
      </div>
    )
  }

  return (
    <div className="px-1 py-6 space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-[var(--fg)]">Firewall</h2>
        <p className="text-sm text-[var(--fg-muted)]">Control inbound and outbound traffic to this server.</p>
      </div>

      {/* Default policy banner */}
      <div className="rounded-md bg-[var(--bg-elevated)] p-1">
        <div className="flex items-center justify-between rounded-md border border-theme-strong bg-[var(--bg-card)] px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-[var(--fg)]">Default policy: Allow all traffic</p>
            <p className="text-xs text-[var(--fg-muted)]">
              All inbound and outbound connections are permitted unless a rule below blocks them.
            </p>
          </div>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-[var(--accent)] text-white text-xs font-medium hover:opacity-90 transition-opacity">
            <HugeiconsIcon icon={AddIcon} className="h-4 w-4" />
            Add rule
          </button>
        </div>
      </div>

      {/* Inbound Rules */}
      <div className="rounded-md bg-[var(--bg-elevated)] p-1">
        <div className="rounded-md border border-theme-strong bg-[var(--bg-card)] p-6">
          <h3 className="text-sm font-semibold text-[var(--fg)]">Inbound rules</h3>
          <p className="text-xs text-[var(--fg-muted)] mt-0.5 mb-4">Control incoming connections to this server.</p>

          {inboundRules.length > 0 ? (
            <div className="grid gap-2">
              {inboundRules.map((rule) => (
                <RuleCard key={rule.id} rule={rule} />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-theme-strong px-4 py-6 text-center">
              <p className="text-xs text-[var(--fg-muted)]">No inbound rules — all incoming traffic is allowed.</p>
            </div>
          )}
        </div>
      </div>

      {/* Outbound Rules */}
      <div className="rounded-md bg-[var(--bg-elevated)] p-1">
        <div className="rounded-md border border-theme-strong bg-[var(--bg-card)] p-6">
          <h3 className="text-sm font-semibold text-[var(--fg)]">Outbound rules</h3>
          <p className="text-xs text-[var(--fg-muted)] mt-0.5 mb-4">Control outgoing connections from this server.</p>

          {outboundRules.length > 0 ? (
            <div className="grid gap-2">
              {outboundRules.map((rule) => (
                <RuleCard key={rule.id} rule={rule} />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-theme-strong px-4 py-6 text-center">
              <p className="text-xs text-[var(--fg-muted)]">No outbound rules — all outgoing traffic is allowed.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
