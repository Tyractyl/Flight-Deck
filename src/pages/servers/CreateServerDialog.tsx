import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { X } from 'lucide-react'
import { HugeiconsIcon } from '@hugeicons/react'
import { GaugeIcon } from '@hugeicons/core-free-icons'
import { Gauge } from '../../components/charts/gauge'
import NumberFlow from '@number-flow/react'
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
     front means the form never submits something it would reject. Falls
     back to totals while a stale cached node list (without the free
     fields) is in flight. */
  const availMemGb = Math.floor((selectedNode?.free_memory ?? selectedNode?.total_memory ?? 0) / 1024)
  const availDiskGb = Math.floor((selectedNode?.free_disk ?? selectedNode?.total_disk ?? 0) / 1024)
  const availCpu = selectedNode?.free_cpu ?? selectedNode?.total_cpu ?? 0

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
      sileo.success({ description: 'Server created successfully', icon: false })
      onClose()
      // Refresh the list after the dialog's exit animation finishes —
      // refetching underneath the closing dialog reads as a flash.
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: queryKeys.servers.all })
      }, 260)
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
            fallbackMax={32}
            unit="GB"
            invalid={memError !== ''}
            footerText={
              !selectedNode
                ? 'Select a node to check availability'
                : memError !== ''
                  ? memError
                  : `Available: ${availMemGb} GB`
            }
            footerError={!!selectedNode && memError !== ''}
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
            fallbackMax={100}
            unit="GB"
            invalid={diskError !== ''}
            footerText={
              !selectedNode
                ? 'Select a node to check availability'
                : diskError !== ''
                  ? diskError
                  : `Available: ${availDiskGb} GB`
            }
            footerError={!!selectedNode && diskError !== ''}
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
            fallbackMax={400}
            unit="%"
            invalid={cpuError !== ''}
            footerText={
              !selectedNode
                ? 'Select a node to check availability'
                : cpuError !== ''
                  ? cpuError
                  : `Available: ${availCpu}%`
            }
            footerError={!!selectedNode && cpuError !== ''}
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
  fallbackMax,
  unit,
  invalid,
  footerText,
  footerError,
  open,
  onOpenChange,
}: {
  id: string
  label: string
  value: string
  onValueChange: (v: string) => void
  min: number
  /** Capacity of the selected node; 0 until one is picked. */
  max: number
  /** Ceiling used before a node is selected. */
  fallbackMax: number
  unit: string
  invalid: boolean
  /** Single-line caption under the input — fixed height so swapping the
      text never shifts the row. */
  footerText: string
  footerError: boolean
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  /* Before a node is picked the dial works against the fallback ceiling;
     capacity validation kicks in once one is selected. */
  const effectiveMax = max > 0 ? max : fallbackMax
  const dialRef = useRef<HTMLDivElement | null>(null)
  const draggingRef = useRef(false)
  const lastValueRef = useRef(value)
  /* While dragging, the ring fills at the pointer's exact angle instead of
     jumping between whole-GB notches; it snaps back to the committed value
     when the drag ends. */
  const [livePct, setLivePct] = useState<number | null>(null)

  lastValueRef.current = value

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
    // Near the hub the angle is noise — hold the value instead of spinning.
    if (Math.hypot(dx, dy) < rect.width * 0.12) return null
    return (Math.atan2(dx, -dy) * 180) / Math.PI
  }

  /* Arc-follow: the dial's minimum sits at 228° and sweeps 264° clockwise
     to its maximum (measured off the rendered gauge — its 135°/405° props
     land there on screen). The pointer's angle maps straight onto the arc,
     so the fill follows the curve under the cursor; the bottom gap between
     the ends holds the current value instead of jumping. */
  const applyPointer = (clientX: number, clientY: number) => {
    if (max <= 0) return
    const angle = pointerAngle(clientX, clientY)
    if (angle === null) return
    const START_ANGLE = 228
    const SWEEP = 264
    const rel = ((angle - START_ANGLE) + 360) % 360
    if (rel > SWEEP) return
    // The ring fills continuously at the pointer's exact angle while
    // dragging (no notch stepping); the committed GB value stays an integer.
    setLivePct(Math.round((rel / SWEEP) * 10000) / 100)
    const raw = Math.round((rel / SWEEP) * effectiveMax)
    const clamped = Math.max(min, Math.min(effectiveMax, raw))
    const next = String(clamped)
    if (next !== lastValueRef.current) {
      lastValueRef.current = next
      onValueChange(next)
    }
  }

  const resetDialState = () => {
    draggingRef.current = false
  }

  /* Sliding highlight for the Max/Minimum shortcuts — the same frame-measured
     glide the top navigation uses. The pill rests on Max from the start so
     the first hover slides from there instead of flying in from nowhere. */
  const segRef = useRef<HTMLDivElement | null>(null)
  const maxBtnRef = useRef<HTMLButtonElement | null>(null)
  const [segPill, setSegPill] = useState({ left: 0, width: 0, opacity: 0 })
  const placeSeg = (el: HTMLElement, opacity: number) => {
    const seg = segRef.current
    if (!seg) return
    const segRect = seg.getBoundingClientRect()
    const rect = el.getBoundingClientRect()
    setSegPill({ left: rect.left - segRect.left, width: rect.width, opacity })
  }
  const slideSeg = (el: HTMLElement) => placeSeg(el, 1)
  useLayoutEffect(() => {
    if (maxBtnRef.current) placeSeg(maxBtnRef.current, 0)
  }, [])

  const pct = Math.min(100, Math.max(0, ((parseInt(value) || 0) / effectiveMax) * 100))

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
            onWheel={(event) => event.currentTarget.blur()}
            required
            aria-invalid={invalid}
            className="pr-9"
          />
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label={`Pick ${label.toLowerCase()} with the dial`}
              title="Pick with the dial"
              className={`absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md p-1 transition-all duration-150 hover:bg-[var(--fg)]/5 hover:text-[var(--fg)] ${
                open
                  ? 'text-[var(--fg)] opacity-100'
                  : 'text-[var(--fg-faint)] opacity-0 group-hover:opacity-100 group-focus-within:opacity-100'
              }`}
            >
              <HugeiconsIcon icon={GaugeIcon} size={13} />
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
            onPointerUp={() => { draggingRef.current = false; resetDialState(); setLivePct(null) }}
            onPointerCancel={() => { draggingRef.current = false; resetDialState(); setLivePct(null) }}
          >
            <Gauge
              value={livePct ?? pct}
              totalNotches={28}
              spacing={30}
              geometryScrubbing
              minWidth={216}
            />
            {/* Center readout — the odometer tweens between values while
                the dial drags; GB values are short so it fits the hub. */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="flex items-baseline gap-1">
                <NumberFlow
                  value={parseInt(value) || 0}
                  className="font-semibold tabular-nums text-[var(--fg)]"
                  style={{ fontSize: 28, lineHeight: 1 }}
                />
                <span className="text-xs font-medium text-[var(--fg-muted)]">{unit}</span>
              </div>
            </div>
          </div>
          <div
            ref={segRef}
            className="relative mt-2 flex justify-center gap-1"
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
            <button
              ref={maxBtnRef}
              type="button"
              onMouseEnter={(e) => slideSeg(e.currentTarget)}
              onClick={() => onValueChange(String(effectiveMax))}
              className="relative z-10 rounded-md px-2.5 py-1 text-[11px] font-medium text-[var(--fg-muted)] transition-colors hover:text-[var(--fg)]"
            >
              Max
            </button>
            <button
              type="button"
              onMouseEnter={(e) => slideSeg(e.currentTarget)}
              onClick={() => onValueChange(String(min))}
              className="relative z-10 rounded-md px-2.5 py-1 text-[11px] font-medium text-[var(--fg-muted)] transition-colors hover:text-[var(--fg)]"
            >
              Minimum
            </button>
          </div>
        </PopoverContent>
      </Popover>
      <div className="h-[18px] overflow-hidden">
        <p className={`text-xs truncate ${footerError ? 'text-[var(--destructive)]' : 'text-muted-foreground'}`}>
          {footerText}
        </p>
      </div>
    </div>
  )
}
