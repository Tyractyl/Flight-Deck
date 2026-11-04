import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getStoreRates, customPurchase } from '../../api/eggs'
import { getBalance } from '../../api/coins'
import { Input } from '../../components/ui/Input'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import { DialogShell, useDialog } from '../../components/modules/dialog-shell'
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
  ArrowDown01Icon,
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
    description: 'Processing power for your server (100% = 1 core)',
    icon: CpuIcon,
    unit: '%',
    step: 10,
    min: 10,
    max: 400,
    defaultGb: 50,
  },
}

/*
 * Server picker — a small animated dropdown in the same spirit as the account
 * menu: blur/scale-in on open, a sliding highlight, outside-click + Escape.
 */
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
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      window.removeEventListener('keydown', onKey)
    }
  }, [])

  const selected = servers.find((s) => s.id === value)?.name || 'Select a server…'

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm transition-colors bg-[var(--bg-input)] text-[var(--fg)] border border-[var(--border-strong)] hover:border-[var(--fg-muted)]/40"
      >
        <span className="truncate">{selected}</span>
        <HugeiconsIcon
          icon={ArrowDown01Icon}
          className={`w-3.5 h-3.5 shrink-0 text-[var(--fg-muted)] transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      <div
        className="absolute z-50 mt-1.5 w-full rounded-xl overflow-hidden bg-[var(--bg-elevated)] border border-[var(--border)] shadow-2xl origin-top"
        style={{
          display: open ? 'block' : 'none',
          animation: open ? 'dropdownIn 0.18s cubic-bezier(0.22, 1, 0.36, 1) forwards' : undefined,
        }}
      >
        <div className="py-1 max-h-48 overflow-y-auto">
          {servers.length === 0 && (
            <div className="px-3 py-2 text-sm text-[var(--fg-muted)]">No servers</div>
          )}
          {servers.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                onChange(s.id)
                setOpen(false)
              }}
              className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-sm transition-colors hover:bg-[var(--fg)]/5 ${
                value === s.id ? 'text-[var(--fg)]' : 'text-[var(--fg-muted)]'
              }`}
            >
              <span className="truncate">{s.name}</span>
              {value === s.id && <HugeiconsIcon icon={CheckIcon} className="w-4 h-4 shrink-0 text-[var(--accent)]" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function PurchaseConfirm({
  label,
  amount,
  unit,
  total,
  serverName,
  onConfirm,
}: {
  label: string
  amount: number
  unit: string
  total: number
  serverName: string
  onConfirm: () => void
}) {
  const { close } = useDialog()
  return (
    <div className="p-5">
      <h2 id="store-confirm-title" className="text-[var(--fg)] text-lg font-semibold">
        Buy {amount} {unit} of {label}?
      </h2>
      <p className="text-[var(--fg-muted)] text-sm mt-2">
        This will add <span className="text-[var(--fg)] font-medium">{amount} {unit}</span> to{' '}
        <span className="text-[var(--fg)] font-medium">{serverName || 'your server'}</span> and spend{' '}
        <span className="text-[var(--fg)] font-medium">{total.toLocaleString()} coins</span>.
      </p>
      <div className="flex justify-end gap-2 mt-6">
        <Button variant="secondary" onClick={close}>
          Cancel
        </Button>
        <Button
          variant="default"
          onClick={() => {
            onConfirm()
            close()
          }}
        >
          Confirm purchase
        </Button>
      </div>
    </div>
  )
}

function ResourceCard({
  type,
  rate,
  balance,
  servers,
  onPurchased,
  index,
}: {
  type: ResourceType
  rate: number
  balance: number
  servers: { id: string; name: string }[]
  onPurchased: () => void
  index: number
}) {
  const queryClient = useQueryClient()
  const cfg = resourceConfig[type]
  const [amount, setAmount] = useState(cfg.defaultGb)
  const [serverId, setServerId] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)

  const isGb = cfg.unit === 'GB'
  const amountInMb = isGb ? amount * 1024 : amount
  const totalPrice = Math.round(amountInMb * rate)
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

  const serverName = servers.find((s) => s.id === serverId)?.name || ''

  return (
    <div style={{ animation: `fade-up 0.4s cubic-bezier(0.22, 1, 0.36, 1) ${index * 70}ms both` }}>
      <Card className="h-full">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[var(--bg-elevated)] flex items-center justify-center">
              <HugeiconsIcon icon={cfg.icon} className="w-5 h-5 text-[var(--fg-muted)]" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-sm">{cfg.label}</CardTitle>
              <p className="text-xs text-[var(--fg-muted)] mt-1">{cfg.description}</p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex flex-1 flex-col">
          <p className="text-[11px] text-[var(--fg-muted)] mb-3">
            {rate.toFixed(2)} coins per {isGb ? 'MB' : cfg.unit}
          </p>

          {/* Amount */}
          <div className="flex items-center gap-2 mb-3">
            <button
              type="button"
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
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--fg-muted)] pointer-events-none">
                {cfg.unit}
              </span>
            </div>
            <button
              type="button"
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
                type="button"
                onClick={() => setAmount(preset)}
                className={`px-2.5 py-1 rounded-md text-xs transition-colors ${
                  amount === preset
                    ? 'bg-[var(--bg-elevated)] text-[var(--fg)]'
                    : 'text-[var(--fg-muted)] hover:text-[var(--fg)]'
                }`}
              >
                {preset}{cfg.unit === '%' ? '%' : ''}
              </button>
            ))}
          </div>

          {/* Server */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-[var(--fg-muted)] mb-1.5">Apply to server</label>
            <ServerDropdown servers={servers} value={serverId} onChange={setServerId} />
          </div>

          {/* Price + purchase */}
          <div className="mt-auto pt-3 border-t border-[var(--border)] flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className={`text-lg font-medium ${canAfford ? 'text-[var(--fg)]' : 'text-red-400'}`}>
                {totalPrice.toLocaleString()}
              </span>
              <HugeiconsIcon icon={CircleDollarSignIcon} className="w-4 h-4 text-[var(--fg-muted)]" />
            </div>
            <Button
              variant="default"
              size="sm"
              onClick={() => setConfirmOpen(true)}
              disabled={!canAfford || !serverId || purchaseMutation.isPending}
              loading={purchaseMutation.isPending}
            >
              {!canAfford ? 'No coins' : !serverId ? 'Select server' : 'Purchase'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {confirmOpen && (
        <DialogShell width={400} labelledBy="store-confirm-title" onClose={() => setConfirmOpen(false)}>
          <PurchaseConfirm
            label={cfg.label}
            amount={amount}
            unit={cfg.unit}
            total={totalPrice}
            serverName={serverName}
            onConfirm={() => purchaseMutation.mutate()}
          />
        </DialogShell>
      )}
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
          <h1 className="text-2xl font-semibold text-[var(--fg)]">Store</h1>
          <p className="text-sm text-[var(--fg-muted)] mt-0.5">Upgrade your server resources</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-strong)]">
          <span className="text-sm font-medium text-[var(--fg)]">{balance.toLocaleString()}</span>
          <HugeiconsIcon icon={CircleDollarSignIcon} className="w-4 h-4 text-[var(--fg-muted)]" />
        </div>
      </div>

      {/* Resource cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
        {(['MEMORY', 'DISK', 'CPU'] as ResourceType[]).map((type, i) => (
          <ResourceCard
            key={type}
            type={type}
            index={i}
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
