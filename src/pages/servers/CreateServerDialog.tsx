import { useRef, useState } from 'react'
import type { FormEvent, PointerEvent as ReactPointerEvent } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { X } from 'lucide-react'
import { HugeiconsIcon } from '@hugeicons/react'
import { GaugeIcon } from '@hugeicons/core-free-icons'
import { Gauge } from '../../components/charts/gauge'
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

const MIN_MEMORY_MB = 128
const MIN_DISK_MB = 1024
const MIN_CPU_PERCENT = 10

type ServerFormData = {
  name: string
  eggId: string
  nodeId: string
  memoryMb: string
  diskMb: string
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
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="gap-0 overflow-hidden border-[color-mix(in_srgb,var(--fg)_5%,transparent)] p-0 sm:max-w-2xl">
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
        {open && <CreateServerForm onClose={onClose} />}
      </DialogContent>
    </Dialog>
  )
}

function CreateServerForm({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient()
  const [data, setData] = useState<ServerFormData>({
    name: '',
    eggId: '',
    nodeId: '',
    memoryMb: '2048',
    diskMb: '10240',
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

  const mem = parseInt(data.memoryMb) || 0
  const disk = parseInt(data.diskMb) || 0
  const cpu = parseInt(data.cpuPercent) || 0

  const eggList: Egg[] = Array.isArray(eggs) ? eggs : []
  const nodeList: Node[] = Array.isArray(nodes) ? nodes : []
  const selectedNode = nodeList.find((n) => n.id === data.nodeId)
  const availMem = selectedNode?.total_memory ?? 0
  const availDisk = selectedNode?.total_disk ?? 0
  const availCpu = selectedNode?.total_cpu ?? 0

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

  const memError = capacityError(mem, availMem)
  const diskError = capacityError(disk, availDisk)
  const cpuError = capacityError(cpu, availCpu)

  /* Dial picker: a small gauge icon on each resource input opens an inline
     panel with an interactive notch gauge — drag across the dial to set the
     allocation instead of typing numbers. */
  const [gaugePanel, setGaugePanel] = useState<'memory' | 'disk' | 'cpu' | null>(null)
  const gaugeWrapRef = useRef<HTMLDivElement | null>(null)
  const gaugeDragRef = useRef(false)

  const gaugeResource = (() => {
    if (gaugePanel === 'memory') return { label: 'Memory', unit: 'MiB', min: MIN_MEMORY_MB, max: availMem, amount: mem, set: (v: number) => setDataField('memoryMb', String(v)) }
    if (gaugePanel === 'disk') return { label: 'Disk', unit: 'MiB', min: MIN_DISK_MB, max: availDisk, amount: disk, set: (v: number) => setDataField('diskMb', String(v)) }
    if (gaugePanel === 'cpu') return { label: 'CPU', unit: '%', min: MIN_CPU_PERCENT, max: availCpu, amount: cpu, set: (v: number) => setDataField('cpuPercent', String(v)) }
    return null
  })()

  const gaugePct = gaugeResource && gaugeResource.max > 0
    ? Math.min(100, Math.max(0, (gaugeResource.amount / gaugeResource.max) * 100))
    : 0

  const setGaugeFromPointer = (clientX: number, clientY: number) => {
    const el = gaugeWrapRef.current
    if (!el || !gaugeResource || gaugeResource.max <= 0) return
    const rect = el.getBoundingClientRect()
    const dx = clientX - (rect.left + rect.width / 2)
    const dy = clientY - (rect.top + rect.height / 2)
    // Degrees clockwise from 12 o'clock; the dial sweeps 135°→405°.
    const angle = (Math.atan2(dx, -dy) * 180) / Math.PI
    const rel = ((angle - 135) + 360) % 360
    const within = Math.min(Math.max(rel, 0), 270)
    const pct = (within / 270) * 100
    const raw = Math.round((pct / 100) * gaugeResource.max)
    const clamped = Math.max(gaugeResource.min, Math.min(gaugeResource.max, raw))
    gaugeResource.set(clamped)
  }

  const isValid =
    data.name.trim() !== '' &&
    data.eggId !== '' &&
    data.nodeId !== '' &&
    mem >= MIN_MEMORY_MB &&
    disk >= MIN_DISK_MB &&
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
        memory_mb: mem,
        disk_mb: disk,
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
          <div className="grid gap-2">
            <Label htmlFor="server-memory">Memory (MiB)</Label>
            <div className="group relative">
              <Input
                id="server-memory"
                type="number"
                min={MIN_MEMORY_MB}
                max={availMem > 0 ? availMem : undefined}
                value={data.memoryMb}
                onChange={(event) => setDataField('memoryMb', event.target.value)}
                required
                aria-invalid={memError !== ''}
                className="pr-14"
              />
              {selectedNode && (
                <button
                  type="button"
                  aria-label="Pick with the dial"
                  aria-pressed={gaugePanel === 'memory'}
                  title="Pick with the dial"
                  onClick={() => setGaugePanel(gaugePanel === 'memory' ? null : 'memory')}
                  className={`absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md p-1 transition-colors duration-150 hover:bg-[var(--fg)]/5 ${
                    gaugePanel === 'memory'
                      ? 'text-[var(--fg)]'
                      : 'text-[var(--fg-faint)] hover:text-[var(--fg)]'
                  }`}
                >
                  <HugeiconsIcon icon={GaugeIcon} size={13} />
                </button>
              )}
            </div>
            {memError !== '' ? (
              <p className="text-xs text-[var(--destructive)]">{memError}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                {availMem > 0 ? `Available: ${availMem.toLocaleString()} MiB (${(availMem / 1024).toFixed(1)} GiB)` : `Minimum ${MIN_MEMORY_MB} MiB`}
              </p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="server-disk">Disk (MiB)</Label>
            <div className="group relative">
              <Input
                id="server-disk"
                type="number"
                min={MIN_DISK_MB}
                max={availDisk > 0 ? availDisk : undefined}
                value={data.diskMb}
                onChange={(event) => setDataField('diskMb', event.target.value)}
                required
                aria-invalid={diskError !== ''}
                className="pr-14"
              />
              {selectedNode && (
                <button
                  type="button"
                  aria-label="Pick with the dial"
                  aria-pressed={gaugePanel === 'disk'}
                  title="Pick with the dial"
                  onClick={() => setGaugePanel(gaugePanel === 'disk' ? null : 'disk')}
                  className={`absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md p-1 transition-colors duration-150 hover:bg-[var(--fg)]/5 ${
                    gaugePanel === 'disk'
                      ? 'text-[var(--fg)]'
                      : 'text-[var(--fg-faint)] hover:text-[var(--fg)]'
                  }`}
                >
                  <HugeiconsIcon icon={GaugeIcon} size={13} />
                </button>
              )}
            </div>
            {diskError !== '' ? (
              <p className="text-xs text-[var(--destructive)]">{diskError}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                {availDisk > 0 ? `Available: ${availDisk.toLocaleString()} MiB (${(availDisk / 1024).toFixed(1)} GiB)` : `Minimum ${MIN_DISK_MB} MiB`}
              </p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="server-cpu">CPU (%)</Label>
            <div className="group relative">
              <Input
                id="server-cpu"
                type="number"
                min={MIN_CPU_PERCENT}
                max={availCpu > 0 ? availCpu : undefined}
                value={data.cpuPercent}
                onChange={(event) => setDataField('cpuPercent', event.target.value)}
                required
                aria-invalid={cpuError !== ''}
                className="pr-14"
              />
              {selectedNode && (
                <button
                  type="button"
                  aria-label="Pick with the dial"
                  aria-pressed={gaugePanel === 'cpu'}
                  title="Pick with the dial"
                  onClick={() => setGaugePanel(gaugePanel === 'cpu' ? null : 'cpu')}
                  className={`absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md p-1 transition-colors duration-150 hover:bg-[var(--fg)]/5 ${
                    gaugePanel === 'cpu'
                      ? 'text-[var(--fg)]'
                      : 'text-[var(--fg-faint)] hover:text-[var(--fg)]'
                  }`}
                >
                  <HugeiconsIcon icon={GaugeIcon} size={13} />
                </button>
              )}
            </div>
            {cpuError !== '' ? (
              <p className="text-xs text-[var(--destructive)]">{cpuError}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                {availCpu > 0 ? `Available: ${availCpu}%` : `Minimum ${MIN_CPU_PERCENT}%`}
              </p>
            )}
          </div>
        </div>

        {gaugePanel && gaugeResource && gaugeResource.max > 0 && (
          <div className="flex flex-col items-center gap-4 rounded-lg border border-[var(--border)] bg-[var(--bg)]/40 p-4 sm:flex-row sm:gap-6">
            <div
              ref={gaugeWrapRef}
              className="w-[220px] shrink-0 cursor-pointer select-none"
              style={{ touchAction: 'none' }}
              onPointerDown={(e) => {
                gaugeDragRef.current = true
                e.currentTarget.setPointerCapture?.(e.pointerId)
                setGaugeFromPointer(e.clientX, e.clientY)
              }}
              onPointerMove={(e: ReactPointerEvent<HTMLDivElement>) => {
                if (gaugeDragRef.current) setGaugeFromPointer(e.clientX, e.clientY)
              }}
              onPointerUp={() => { gaugeDragRef.current = false }}
              onPointerCancel={() => { gaugeDragRef.current = false }}
            >
              <Gauge
                value={gaugePct}
                totalNotches={28}
                spacing={30}
                centerValue={gaugeResource.amount}
                suffix={` ${gaugeResource.unit}`}
                defaultLabel={`of ${gaugeResource.max.toLocaleString()} max`}
                minWidth={220}
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-[var(--fg)]">
                {gaugeResource.label} dial
              </p>
              <p className="mt-1 text-xs text-[var(--fg-muted)]">
                Drag across the dial to choose how much {gaugeResource.label.toLowerCase()} this
                server gets — it snaps to notches and clamps to the node's free capacity.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  height={22}
                  onClick={() => gaugeResource.set(gaugeResource.max)}
                >
                  Max
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  height={22}
                  onClick={() => gaugeResource.set(gaugeResource.min)}
                >
                  Minimum
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  height={22}
                  onClick={() => setGaugePanel(null)}
                >
                  Done
                </Button>
              </div>
            </div>
          </div>
        )}
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
