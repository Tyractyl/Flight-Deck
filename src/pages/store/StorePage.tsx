import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getStoreRates, customPurchase } from '../../api/eggs'
import { getBalance } from '../../api/coins'
import { Input } from '../../components/ui/Input'
import { listServers } from '../../api/servers'

import { queryKeys } from '../../api/queryKeys'
import { sileo } from 'sileo'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  RamMemoryIcon,
  HardDriveIcon,
  CpuIcon,
  CircleDollarSignIcon,
  CheckIcon,
} from '@hugeicons/core-free-icons'
import Button from '../../components/Button'

type ResourceType = 'MEMORY' | 'DISK' | 'CPU'

const resourceConfig: Record<ResourceType, {
  label: string
  description: string
  icon: typeof RamMemoryIcon
  unit: string
  step: number
  min: number
  max: number
  defaultGb: number
}> = {
  MEMORY: {
    label: 'RAM',
    description: 'Memory allocated to your server',
    icon: RamMemoryIcon,
    unit: 'GB',
    step: 1,
    min: 1,
    max: 32,
    defaultGb: 2,
  },
  DISK: {
    label: 'Disk',
    description: 'Storage space for your server files',
    icon: HardDriveIcon,
    unit: 'GB',
    step: 1,
    min: 1,
    max: 100,
    defaultGb: 10,
  },
  CPU: {
    label: 'CPU',
    description: 'Processing power for your server',
    icon: CpuIcon,
    unit: '%',
    step: 10,
    min: 10,
    max: 400,
    defaultGb: 50,
  },
}

function ChevronSvg({ open }: { open: boolean }) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none"
      className="text-[var(--fg-muted)] transition-transform duration-150"
      style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
    >
      <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ServerDropdown({
  servers,
  value,
  onChange,
}: {
  servers: { id: string; name: string }[]
  value: string
  onChange: (val: string) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const selected = servers.find((s) => s.id === value)?.name || 'Select a server...'

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors bg-[var(--bg-input)] text-[var(--fg)] border border-[var(--border-strong)] hover:border-[var(--accent)]"
      >
        <span className="truncate">{selected}</span>
        <ChevronSvg open={open} />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-lg shadow-xl overflow-hidden bg-[var(--bg-input)] border border-[var(--border-strong)]">
          <div className="py-1 max-h-48 overflow-y-auto">
            {servers.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => { onChange(s.id); setOpen(false) }}
                className={`w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-white/5 transition-colors ${value === s.id ? 'text-[var(--fg)]' : 'text-[var(--fg-muted)]'}`}
              >
                <span className="truncate">{s.name}</span>
                {value === s.id && <HugeiconsIcon icon={CheckIcon} className="w-4 h-4 text-[var(--accent)]" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function ResourceCard({
  type,
  rate,
  balance,
  servers,
  onPurchased,
}: {
  type: ResourceType
  rate: number
  balance: number
  servers: { id: string; name: string }[]
  onPurchased: () => void
}) {
  const queryClient = useQueryClient()
  const cfg = resourceConfig[type]
  const [amount, setAmount] = useState(cfg.defaultGb)
  const [serverId, setServerId] = useState('')

  const isGb = cfg.unit === 'GB'
  const amountInMb = isGb ? amount * 1024 : amount
  const totalPrice = Math.ceil(amountInMb * rate)
  const canAfford = balance >= totalPrice

  const purchaseMutation = useMutation({
    mutationFn: () => customPurchase(type, amountInMb, serverId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.coins.balance })
      queryClient.invalidateQueries({ queryKey: queryKeys.servers.all })
      sileo.success({ description: `Purchased ${amount} ${cfg.unit} of ${cfg.label}` })
      onPurchased()
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Purchase failed'
      sileo.error({ description: msg })
    },
  })

  const presets = type === 'MEMORY' ? [1, 2, 4, 8, 16]
    : type === 'DISK' ? [5, 10, 25, 50, 100]
    : [10, 25, 50, 100, 200]

  return (
    <div
      className="rounded-xl p-5 flex flex-col"
      style={{
        background: 'linear-gradient(180deg, #1e1e1e 0%, #191919 100%)',
        border: '1px solid var(--border-strong)',
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-lg bg-[var(--bg-elevated)] flex items-center justify-center">
          <HugeiconsIcon icon={cfg.icon} className="w-5 h-5 text-[var(--fg-muted)]" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-[var(--fg)]">{cfg.label}</p>
          <p className="text-xs text-[var(--fg-muted)]">{cfg.description}</p>
        </div>
      </div>

      {/* Rate */}
      <p className="text-[11px] text-[var(--fg-faint)] mb-3">
        {rate.toFixed(2)} coins per {isGb ? 'GB' : cfg.unit}
      </p>

      {/* Amount input */}
      <div className="flex items-center gap-2 mb-3">
        <button
          onClick={() => setAmount(Math.max(cfg.min, amount - cfg.step))}
          className="w-8 h-8 rounded-md flex items-center justify-center bg-[var(--bg-elevated)] text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors text-lg"
        >
          −
        </button>
        <div className="flex-1 relative">
          <Input
            type="number"
            value={amount}
            onChange={(e) => {
              const v = Number(e.target.value)
              if (v >= cfg.min && v <= cfg.max) setAmount(v)
            }}
            className="text-center"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--fg-faint)] pointer-events-none">{cfg.unit}</span>
        </div>
        <button
          onClick={() => setAmount(Math.min(cfg.max, amount + cfg.step))}
          className="w-8 h-8 rounded-md flex items-center justify-center bg-[var(--bg-elevated)] text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors text-lg"
        >
          +
        </button>
      </div>

      {/* Presets */}
      <div className="flex items-center gap-1 mb-4 flex-wrap">
        {presets.map((preset) => (
          <button
            key={preset}
            onClick={() => setAmount(preset)}
            className={`px-2.5 py-1 rounded-md text-xs transition-colors ${
              amount === preset
                ? 'bg-[var(--bg-elevated)] text-[var(--fg)]'
                : 'text-[var(--fg-faint)] hover:text-[var(--fg-muted)]'
            }`}
          >
            {preset}{cfg.unit === '%' ? '%' : ''}
          </button>
        ))}
      </div>

      {/* Server selection */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-[var(--fg-muted)] mb-1.5">Apply to server</label>
        <ServerDropdown servers={servers} value={serverId} onChange={setServerId} />
      </div>

      {/* Price + Purchase */}
      <div className="mt-auto pt-3 border-t border-theme flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className={`text-lg font-medium ${canAfford ? 'text-[var(--fg)]' : 'text-red-400'}`}>
            {totalPrice.toLocaleString()}
          </span>
          <HugeiconsIcon icon={CircleDollarSignIcon} className="w-4 h-4 text-[var(--fg-muted)]" />
        </div>
        <Button
          variant="primary"
          width={120}
          height={34}
          onClick={() => purchaseMutation.mutate()}
          disabled={!canAfford || !serverId || purchaseMutation.isPending}
          loading={purchaseMutation.isPending}
        >
          {!canAfford ? 'No coins' : !serverId ? 'Select server' : 'Purchase'}
        </Button>
      </div>
    </div>
  )
}

export default function StorePage() {
  const queryClient = useQueryClient()

  const { data: balanceData } = useQuery({
    queryKey: queryKeys.coins.balance,
    queryFn: getBalance,
  })

  const { data: rates } = useQuery({
    queryKey: ['store', 'rates'],
    queryFn: getStoreRates,
  })

  const { data: servers } = useQuery({
    queryKey: queryKeys.servers.all,
    queryFn: listServers,
  })

  const balance = balanceData?.balance ?? 0
  const serverList = Array.isArray(servers) ? servers : []
  const ratesMap = rates ?? { MEMORY: 0.1, DISK: 0.015, CPU: 3.0 }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[var(--fg)]">Store</h1>
          <p className="text-sm text-[var(--fg-muted)] mt-0.5">Upgrade your server resources</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-strong)]">
          <span className="text-sm font-medium text-[var(--fg)]">{balance.toLocaleString()}</span>
          <HugeiconsIcon icon={CircleDollarSignIcon} className="w-4 h-4 text-[var(--fg-muted)]" />
        </div>
      </div>

      {/* Resource Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(['MEMORY', 'DISK', 'CPU'] as ResourceType[]).map((type) => (
          <ResourceCard
            key={type}
            type={type}
            rate={ratesMap[type] ?? 0}
            balance={balance}
            servers={serverList}
            onPurchased={() => {
              queryClient.invalidateQueries({ queryKey: queryKeys.coins.balance })
              queryClient.invalidateQueries({ queryKey: queryKeys.servers.all })
            }}
          />
        ))}
      </div>
    </div>
  )
}
