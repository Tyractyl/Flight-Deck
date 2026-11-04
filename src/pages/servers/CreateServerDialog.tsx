import { useEffect, useRef, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { X } from 'lucide-react'
import { HugeiconsIcon } from '@hugeicons/react'
import { GaugeIcon } from '@hugeicons/core-free-icons'
import { Gauge } from '../../components/charts/gauge'
import { Popover, PopoverContent, PopoverTrigger } from '../../components/ui/popover'
import { createServer } from '../../api/servers'
import { listEggs } from '../../api/eggs'
import { listNodes } from '../../api/nodes'
import { queryKeys } from '../../api/queryKeys'
import { sileo } from 'sileo'
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { PlaceholderPattern } from '@/components/ui/PlaceholderPattern'
import { SearchableSelect, type SearchableSelectOption } from '@/components/ui/searchable-select'
import Button from '../../components/Button'
import { useCreateServerDialog } from '../../store/createServerStore'
import type { Egg, Node } from '../../types/server'

/* Allocations are entered in GB (the API takes MiB — values are converted on
   submit). 1 GB minimum keeps the numbers short and the dial readable. */
const MIN_MEMORY_GB = 1
const MIN_DISK_GB = 1
const MIN_CPU_PERCENT = 10

type ServerFormData = {
  name: string
  eggId: string
  nodeId: string
  memoryGb: string
  diskGb: string
  cpuPercent: string
}

/*
 * Create-server dialog — a centered modal form driven by the
 * createServerStore so any page can open it. The dialog unmounts its
 * content when closed, so every open starts from a fresh form.
 */
export function CreateServerDialog() {
  const open = useCreateServerDialog((s) => s.open)
  const closeDialog = useCreateServerDialog((s) => s.closeDialog)

  return <CreateServerModal open={open} onClose={closeDialog} />
}

function CreateServerModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  /* Which dial popover is open, if any. The dialog refuses Escape while one
     is open so a single Escape press closes the popover and not the whole
     dialog. */
  const [dialOpen, setDialOpen] = useState<'memory' | 'disk' | 'cpu' | null>(null)

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent
        className="gap-0 overflow-hidden border-[color-mix(in_srgb,var(--fg)_5%,transparent)] p-0 sm:max-w-2xl"
        onEscapeKeyDown={(event) => {
          if (dialOpen) event.preventDefault()
        }}
      >
        {/* Textured frame behind the title and footer areas */}
        <PlaceholderPattern
          patternSize={10}
          className="pointer-events-none absolute inset-0 size-full stroke-neutral-900/[0.04] dark:stroke-neutral-100/[0.04]"
        />
        <DialogHeader className="relative flex flex-row items-center justify-between space-y-0 px-4 pt-4 pb-3">
          <DialogTitle className="text-base font-semibold">Create server</DialogTitle>
          <DialogClose className="rounded-md p-1.5 text-[var(--fg-faint)] transition-colors hover:bg-[var(--bg-elevated)] hover:text-[var(--fg)]">
            <X className="size-4" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </DialogHeader>
        {open && (
          <CreateServerForm
            onClose={onClose}
            dialOpen={dialOpen}
            onDialOpenChange={setDialOpen}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function CreateServerForm({
  onClose,
  dialOpen,
  onDialOpenChange,
}: {
  onClose: () => void
  dialOpen: 'memory' | 'disk' | 'cpu' | null
  onDialOpenChange: (v: 'memory' | 'disk' | 'cpu' | null) => void
}) {
  const queryClient = useQueryClient()
  const [data, setData] = useState<ServerFormData>({
    name: '',
    eggId: '',
    nodeId: '',
    memoryGb: '2',
    diskGb: '10',
    cpuPercent: '100',
  })
  const setDataField = <K extends keyof ServerFormData>(key: K, value: ServerFormData[K]) =>
    setData((prev) => ({ ...prev, [key]: value }))

  const { data: eggs, isLoading: eggsLoading } = useQuery({
    queryKey: queryKeys.eggs.all,
    queryFn: listEggs,
  })

  const { data: nodes, isLoading: nodesLoading } = useQuery({
    queryKey: queryKeys.nodes.all,
    queryFn: listNodes,
  })

  const memGb = parseInt(data.memoryGb) || 0
  const diskGb = parseInt(data.diskGb) || 0
  const cpu = parseInt(data.cpuPercent) || 0

  const eggList: Egg[] = Array.isArray(eggs) ? eggs : []
  const nodeList: Node[] = Array.isArray(nodes) ? nodes : []
  const selectedNode = nodeList.find((n) => n.id === data.nodeId)
  /* Free capacity (totals minus what existing servers on the node already
     reserve) — the backend enforces the same numbers, but showing them up
     front means the form never submits something it would reject. */
  const availMemGb = Math.floor((selectedNode?.free_memory ?? 0) / 1024)
  const availDiskGb = Math.floor((selectedNode?.free_disk ?? 0) / 1024)
  const availCpu = selectedNode?.free_cpu ?? 0

  const eggOptions: SearchableSelectOption[] = eggList.map((egg) => ({
    value: egg.id,
    label: egg.name,
    description: egg.docker_image,
  }))
  const nodeOptions: SearchableSelectOption[] = nodeList.map((node) => ({
    value: node.id,
    label: node.name,
    description: node.fqdn,
  }))

  const capacityError = (value: number, avail: number) =>
    selectedNode ? (avail <= 0 ? 'No capacity is available on this node.' : value > avail ? 'Exceeds the capacity of this node.' : '') : ''

  const memError = capacityError(memGb, availMemGb)
  const diskError = capacityError(diskGb, availDiskGb)
  const cpuError = capacityError(cpu, availCpu)


  const isValid =
    data.name.trim() !== '' &&
    data.eggId !== '' &&
    data.nodeId !== '' &&
    memGb >= MIN_MEMORY_GB &&
    diskGb >= MIN_DISK_GB &&
    cpu >= MIN_CPU_PERCENT &&
    memError === '' &&
    diskError === '' &&
    cpuError === ''

  const createMutation = useMutation({
    mutationFn: () =>
      createServer({
        name: data.name,
        egg_id: data.eggId,
        node_id: data.nodeId,
        memory_mb: memGb * 1024,
        disk_mb: diskGb * 1024,
        cpu_percent: cpu,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.servers.all })
      sileo.success({ description: 'Server created successfully', icon: false })
      onClose()
    },
    onError: () => {
      sileo.error({ description: 'Failed to create server', icon: false })
    },
  })

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!isValid || createMutation.isPending) return
    createMutation.mutate()
  }

  return (
    <form onSubmit={submit} className="relative">
      {/* Inset field card — the main structural body of the dialog */}
      <div className="px-[14px] pb-3">
        <div className="grid gap-4 rounded-xl bg-[var(--bg-elevated)] p-4">
        <div className="grid gap-2">
          <Label htmlFor="server-name">Name</Label>
          <Input
            id="server-name"
            value={data.name}
            onChange={(event) => setDataField('name', event.target.value)}
            placeholder="Paper Survival"
            required
          />
        </div>

        <div className="grid gap-2 sm:grid-cols-2 sm:gap-4">
          <div className="grid gap-2">
            <Label htmlFor="server-egg">Software</Label>
            <SearchableSelect
              id="server-egg"
              options={eggOptions}
              value={data.eggId}
              onValueChange={(value) => setDataField('eggId', value)}
              placeholder={eggsLoading ? 'Loading software…' : 'Choose a software'}
              searchPlaceholder="Search software…"
              emptyMessage="No software available."
              disabled={eggsLoading}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="server-node">Node</Label>
            <SearchableSelect
              id="server-node"
              options={nodeOptions}
              value={data.nodeId}
              onValueChange={(value) => setDataField('nodeId', value)}
              placeholder={nodesLoading ? 'Loading nodes…' : 'Choose a node'}
              searchPlaceholder="Search nodes…"
              emptyMessage="No nodes available."
              disabled={nodesLoading}
            />
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-3 sm:gap-4">
          <DialField
            id="server-memory"
            label="Memory (GB)"
            value={data.memoryGb}
            onValueChange={(v) => setDataField('memoryGb', v)}
            min={MIN_MEMORY_GB}
            max={availMemGb}
            unit="GB"
            invalid={memError !== ''}
            footer={
              memError !== '' ? (
                <p className="text-xs text-[var(--destructive)]">{memError}</p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {availMemGb > 0 ? `Available: ${availMemGb} GB` : `Minimum ${MIN_MEMORY_GB} GB`}
                </p>
              )
            }
            open={dialOpen === 'memory'}
            onOpenChange={(o) => onDialOpenChange(o ? 'memory' : null)}
          />
          <DialField
            id="server-disk"
            label="Disk (GB)"
            value={data.diskGb}
            onValueChange={(v) => setDataField('diskGb', v)}
            min={MIN_DISK_GB}
            max={availDiskGb}
            unit="GB"
            invalid={diskError !== ''}
            footer={
              diskError !== '' ? (
                <p className="text-xs text-[var(--destructive)]">{diskError}</p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {availDiskGb > 0 ? `Available: ${availDiskGb} GB` : `Minimum ${MIN_DISK_GB} GB`}
                </p>
              )
            }
            open={dialOpen === 'disk'}
            onOpenChange={(o) => onDialOpenChange(o ? 'disk' : null)}
          />
          <DialField
            id="server-cpu"
            label="CPU (%)"
            value={data.cpuPercent}
            onValueChange={(v) => setDataField('cpuPercent', v)}
            min={MIN_CPU_PERCENT}
            max={availCpu}
            unit="%"
            invalid={cpuError !== ''}
            footer={
              cpuError !== '' ? (
                <p className="text-xs text-[var(--destructive)]">{cpuError}</p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {availCpu > 0 ? `Available: ${availCpu}%` : `Minimum ${MIN_CPU_PERCENT}%`}
                </p>
              )
            }
            open={dialOpen === 'cpu'}
            onOpenChange={(o) => onDialOpenChange(o ? 'cpu' : null)}
          />
        </div>
        </div>
      </div>

      <div className="flex justify-end px-4 pb-4">
        <Button
          type="submit"
          disabled={!isValid || createMutation.isPending}
          loading={createMutation.isPending}
          className="disabled:bg-[var(--bg-elevated)] disabled:text-[var(--fg-faint)] disabled:opacity-100 disabled:shadow-none"
        >
          Create server
        </Button>
      </div>
    </form>
  )
}


/*
 * DialField — a resource allocation input whose gauge icon opens a floating
 * popover with an interactive notch gauge. The popover is portaled, so
 * opening it never reflows the dialog. Dragging across the dial applies the
 * value once per animation frame (snapped to notches, clamped to
 * [min, max]) so the drag tracks the pointer 1:1 without jank.
 */
function DialField({
  id,
  label,
  value,
  onValueChange,
  min,
  max,
  unit,
  invalid,
  footer,
  open,
  onOpenChange,
}: {
  id: string
  label: string
  value: string
  onValueChange: (v: string) => void
  min: number
  max: number
  unit: string
  invalid: boolean
  footer: ReactNode
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const dialRef = useRef<HTMLDivElement | null>(null)
  const draggingRef = useRef(false)
  const rafRef = useRef<number | null>(null)
  const pointerRef = useRef<{ x: number; y: number } | null>(null)
  const lastValueRef = useRef(value)
  /* Jog-drag state: the value follows the pointer's rotation relative to
     where the drag started, so the fill moves with your hand around the ring
     in the direction you pull — instead of teleporting to whichever notch the
     absolute pointer angle lands on. */
  const dialState = useRef<{ lastAngle: number; value: number } | null>(null)

  lastValueRef.current = value

  // Drop the pending animation frame when the field unmounts.
  useEffect(() => {
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  // Escape closes this dial and nothing else. Handled with a capture-phase
  // document listener while the popover is open: the event is consumed before
  // any layered component (the create-server dialog included) can react to
  // it, so one Escape press closes exactly one layer.
  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.stopPropagation()
      event.preventDefault()
      onOpenChange(false)
    }
    document.addEventListener('keydown', onKey, true)
    return () => document.removeEventListener('keydown', onKey, true)
  }, [open, onOpenChange])

  const pointerAngle = (clientX: number, clientY: number): number | null => {
    const el = dialRef.current
    if (!el) return null
    const rect = el.getBoundingClientRect()
    const dx = clientX - (rect.left + rect.width / 2)
    const dy = clientY - (rect.top + rect.height / 2)
    // Near the hub the angle is noise — ignore so the dial doesn't spin.
    if (Math.hypot(dx, dy) < rect.width * 0.12) return null
    return (Math.atan2(dx, -dy) * 180) / Math.PI
  }

  const applyPointer = () => {
    rafRef.current = null
    const ptr = pointerRef.current
    if (!ptr || !draggingRef.current || max <= 0) return
    const angle = pointerAngle(ptr.x, ptr.y)
    if (angle === null) return
    const state = dialState.current
    if (!state) {
      // First contact outside the hub: anchor here at the current value.
      dialState.current = { lastAngle: angle, value: parseInt(lastValueRef.current) || min }
      return
    }
    // Shortest signed rotation from the last sample, clamped so a fast
    // flick (or a pass across the hub) can't teleport the value.
    let delta = angle - state.lastAngle
    if (delta > 180) delta -= 360
    if (delta < -180) delta += 360
    delta = Math.min(Math.max(delta, -40), 40)
    state.lastAngle = angle
    const next = Math.max(min, Math.min(max, Math.round(state.value + (delta / 270) * max)))
    state.value = next
    const nextStr = String(next)
    if (nextStr !== lastValueRef.current) {
      lastValueRef.current = nextStr
      onValueChange(nextStr)
    }
  }

  const schedulePointer = (clientX: number, clientY: number) => {
    pointerRef.current = { x: clientX, y: clientY }
    if (rafRef.current == null) {
      rafRef.current = requestAnimationFrame(applyPointer)
    }
  }

  const resetDialState = () => {
    dialState.current = null
  }

  const pct = max > 0 ? Math.min(100, Math.max(0, ((parseInt(value) || 0) / max) * 100)) : 0

  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Popover open={open} onOpenChange={onOpenChange}>
        <div className="group relative">
          <Input
            id={id}
            type="number"
            min={min}
            max={max > 0 ? max : undefined}
            value={value}
            onChange={(event) => onValueChange(event.target.value)}
            required
            aria-invalid={invalid}
            className="pr-9"
          />
          {max > 0 && (
            <PopoverTrigger asChild>
              <button
                type="button"
                aria-label={`Pick ${label.toLowerCase()} with the dial`}
                title="Pick with the dial"
                className={`absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md p-1 transition-all duration-150 hover:bg-[var(--fg)]/5 hover:text-[var(--fg)] ${
                  open
                    ? 'opacity-100 text-[var(--fg)]'
                    : 'text-[var(--fg-faint)] opacity-0 group-hover:opacity-100 group-focus-within:opacity-100'
                }`}
              >
                <HugeiconsIcon icon={GaugeIcon} size={13} />
              </button>
            </PopoverTrigger>
          )}
        </div>
        <PopoverContent align="end" sideOffset={6} className="w-[248px] gap-0 p-3">
          <div
            ref={dialRef}
            className="relative mx-auto w-[216px] cursor-grab select-none active:cursor-grabbing"
            style={{ touchAction: 'none' }}
            onPointerDown={(e) => {
              draggingRef.current = true
              dialState.current = null
              e.currentTarget.setPointerCapture?.(e.pointerId)
              schedulePointer(e.clientX, e.clientY)
            }}
            onPointerMove={(e) => {
              if (draggingRef.current) schedulePointer(e.clientX, e.clientY)
            }}
            onPointerUp={() => { draggingRef.current = false; resetDialState() }}
            onPointerCancel={() => { draggingRef.current = false; resetDialState() }}
          >
            <Gauge
              value={pct}
              totalNotches={28}
              spacing={30}
              geometryScrubbing
              minWidth={216}
            />
            {/* Center readout — a plain tabular number (no odometer
                animation: it lagged behind fast drags) with the unit beside
                it. GB values are short, so this always fits the hub. */}
            <div className="pointer-events-none absolute inset-0 flex items-baseline justify-center">
              <span
                className="font-semibold tabular-nums text-[var(--fg)]"
                style={{ fontSize: Math.min(30, 120 / Math.max(1, value.length)), lineHeight: 1 }}
              >
                {value}
              </span>
              <span className="text-xs font-medium text-[var(--fg-muted)]">{unit}</span>
            </div>
          </div>
          <div className="mt-2 flex justify-center gap-1.5">
            <button
              type="button"
              onClick={() => onValueChange(String(max))}
              className="rounded-md px-2 py-1 text-[11px] font-medium text-[var(--fg-muted)] transition-colors hover:bg-[var(--fg)]/5 hover:text-[var(--fg)]"
            >
              Max
            </button>
            <button
              type="button"
              onClick={() => onValueChange(String(min))}
              className="rounded-md px-2 py-1 text-[11px] font-medium text-[var(--fg-muted)] transition-colors hover:bg-[var(--fg)]/5 hover:text-[var(--fg)]"
            >
              Minimum
            </button>
          </div>
        </PopoverContent>
      </Popover>
      {footer}
    </div>
  )
}
