import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getStoreRates, customPurchase } from '../../api/eggs'
import { getBalance } from '../../api/coins'
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
  GaugeIcon,
} from '@hugeicons/core-free-icons'
import NumberFlow from '@number-flow/react'
import { Gauge } from '../../components/charts/gauge'
import { Popover, PopoverContent, PopoverTrigger } from '../../components/ui/popover'
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
 * menu and the global dropdown: scale-in on open, outside-click + Escape,
 * global panel tokens.
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
        className="absolute z-50 mt-1.5 w-full rounded-xl overflow-hidden bg-[var(--bg-card)] border border-[var(--border-strong)] shadow-2xl backdrop-blur-md origin-top"
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

/*
 * ResourceCard — one store tile, in the app's card language. The amount is
 * set with the same notch-gauge dial the create-server dialog uses (the icon
 * on the input opens a floating gauge whose ring fills at the pointer's
 * exact angle), plus quick preset chips with the topbar's sliding hover
 * highlight.
 */
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
  const [dialOpen, setDialOpen] = useState(false)
  const [livePct, setLivePct] = useState<number | null>(null)

  const dialRef = useRef<HTMLDivElement | null>(null)
  const draggingRef = useRef(false)

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

  // Escape closes the dial (the popover's own close also fires here).
  useEffect(() => {
    if (!dialOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDialOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [dialOpen])

  const applyAmount = (v: number) => {
    const clamped = Math.max(cfg.min, Math.min(cfg.max, v))
    setAmount(clamped)
    return clamped
  }

  // The dial's minimum sits at 228° and sweeps 264° clockwise (measured off
  // the rendered gauge). The pointer's angle maps straight onto the arc; the
  // bottom gap between the ends holds the value instead of jumping.
  const applyPointer = (clientX: number, clientY: number) => {
    const el = dialRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const dx = clientX - (rect.left + rect.width / 2)
    const dy = clientY - (rect.top + rect.height / 2)
    // Near the hub the angle is noise — hold the value instead of spinning.
    if (Math.hypot(dx, dy) < rect.width * 0.12) return
    const angle = (Math.atan2(dx, -dy) * 180) / Math.PI
    const rel = ((angle - 228) + 360) % 360
    if (rel > 264) return
    setLivePct(Math.round((rel / 264) * 10000) / 100)
    applyAmount(Math.round((rel / 264) * cfg.max))
  }

  const resetDialState = () => {
    draggingRef.current = false
    setLivePct(null)
  }

  // Sliding hover pill across the preset chips — the topbar's glide.
  const segRef = useRef<HTMLDivElement | null>(null)
  const [segPill, setSegPill] = useState({ left: 0, width: 0, opacity: 0 })
  const slideSeg = (el: HTMLElement) => {
    const seg = segRef.current
    if (!seg) return
    const segRect = seg.getBoundingClientRect()
    const rect = el.getBoundingClientRect()
    setSegPill({ left: rect.left - segRect.left, width: rect.width, opacity: 1 })
  }

  const pct = Math.min(100, Math.max(0, (amount / cfg.max) * 100))

  return (
    <div style={{ animation: `fade-up 0.4s cubic-bezier(0.22, 1, 0.36, 1) ${index * 70}ms both` }}>
      {/* Tile — Heliactyl-style: a quiet card inside the grouped container,
          title top-left, controls below, price pinned to the bottom. */}
      <div className="flex h-full flex-col rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-3">
        <div className="text-sm font-semibold text-[var(--fg)] mb-1">{cfg.label}</div>
        <p className="text-[11px] text-[var(--fg-muted)] mb-3">
          {rate.toFixed(2)} coins per {isGb ? 'MB' : cfg.unit}
        </p>

        <div className="flex flex-col gap-2.5 flex-1">
          {/* Amount input + dial trigger */}
          <Popover open={dialOpen} onOpenChange={setDialOpen}>
            <div className="group relative">
              <input
                type="number"
                value={amount}
                min={cfg.min}
                max={cfg.max}
                onChange={(e) => {
                  const v = Number(e.target.value)
                  if (v >= cfg.min && v <= cfg.max) setAmount(v)
                }}
                onWheel={(e) => e.currentTarget.blur()}
                className="w-full h-8 rounded-lg bg-[var(--bg-input)] border border-[var(--border-strong)] px-3 pr-8 text-center text-sm text-[var(--fg)] outline-none focus:border-[var(--fg-muted)]/40"
                aria-label={`${cfg.label} amount`}
              />
              <PopoverTrigger asChild>
                <button
                  type="button"
                  aria-label={`Pick ${cfg.label.toLowerCase()} with the dial`}
                  title="Pick with the dial"
                  className={`absolute right-1 top-1/2 -translate-y-1/2 rounded p-1 transition-all duration-150 hover:bg-[var(--fg)]/5 hover:text-[var(--fg)] ${
                    dialOpen
                      ? 'text-[var(--fg)] opacity-100'
                      : 'text-[var(--fg-muted)] opacity-80 group-hover:opacity-100'
                  }`}
                >
                  <HugeiconsIcon icon={GaugeIcon} size={12} />
                </button>
              </PopoverTrigger>
            </div>
            <PopoverContent align="end" sideOffset={6} className="w-[248px] gap-0 p-3">
              <div
                ref={dialRef}
                className="relative mx-auto w-[216px] cursor-grab select-none active:cursor-grabbing"
                style={{ touchAction: 'none' }}
                onPointerDown={(e) => {
                  draggingRef.current = true
                  e.currentTarget.setPointerCapture?.(e.pointerId)
                  applyPointer(e.clientX, e.clientY)
                }}
                onPointerMove={(e) => {
                  if (draggingRef.current) applyPointer(e.clientX, e.clientY)
                }}
                onPointerUp={resetDialState}
                onPointerCancel={resetDialState}
              >
                <Gauge
                  value={livePct ?? pct}
                  totalNotches={28}
                  spacing={30}
                  geometryScrubbing
                  minWidth={216}
                />
                {/* Number alone on its line, unit centered below — digit-width
                    changes can't shove the unit sideways. */}
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <NumberFlow
                    value={amount}
                    className="font-semibold tabular-nums text-[var(--fg)]"
                    style={{ fontSize: 26, lineHeight: 1 }}
                  />
                  <span className="text-[11px] font-medium text-[var(--fg-muted)]" style={{ marginTop: 3 }}>
                    {cfg.unit}
                  </span>
                </div>
              </div>
              <div className="mt-2 flex justify-center">
                <button
                  type="button"
                  onClick={() => applyAmount(cfg.max)}
                  className="rounded-md px-2.5 py-1 text-[11px] font-medium text-[var(--fg-muted)] transition-colors hover:bg-[var(--fg)]/5 hover:text-[var(--fg)]"
                >
                  Max ({cfg.max} {cfg.unit})
                </button>
              </div>
            </PopoverContent>
          </Popover>

          {/* Presets with the sliding hover pill */}
          <div
            ref={segRef}
            className="relative flex items-center gap-0.5"
            onMouseLeave={() => setSegPill((p) => ({ ...p, opacity: 0 }))}
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute top-0 bottom-0 rounded-md bg-[var(--fg)]/10"
              style={{
                left: segPill.left,
                width: segPill.width,
                opacity: segPill.opacity,
                transition: 'all 0.25s cubic-bezier(0.22, 1, 0.36, 1)',
              }}
            />
            {presets.map((preset) => (
              <button
                key={preset}
                type="button"
                onMouseEnter={(e) => slideSeg(e.currentTarget)}
                onClick={() => setAmount(preset)}
                className={`relative z-10 flex-1 px-1 py-1 rounded-md text-xs transition-colors ${
                  amount === preset
                    ? 'text-[var(--fg)]'
                    : 'text-[var(--fg-muted)] hover:text-[var(--fg)]'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>

          {/* Target server */}
          <ServerDropdown
            servers={servers}
            value={serverId}
            onChange={setServerId}
          />
        </div>

        {/* Price + purchase */}
        <div className="mt-auto pt-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className={`text-sm font-medium ${canAfford ? 'text-[var(--fg)]' : 'text-red-400'}`}>
              {totalPrice.toLocaleString()}
            </span>
            <HugeiconsIcon icon={CircleDollarSignIcon} className="w-3.5 h-3.5 text-[var(--fg-muted)]" />
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
      </div>

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
    <div className="space-y-6">
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

      {/* Grouped resources container — Heliactyl dashboard style: a quiet
          muted panel holding the tiles. */}
      <div className="rounded-lg bg-[var(--bg-elevated)]/60">
        <div className="px-3 pt-3 pb-1 flex items-center gap-2">
          <HugeiconsIcon icon={CircleDollarSignIcon} className="h-4 w-4 text-[var(--fg-muted)]/30" />
          <span className="text-xs text-[var(--fg)] font-semibold">Resources</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 p-1 gap-1 items-stretch">
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
    </div>
  )
}
