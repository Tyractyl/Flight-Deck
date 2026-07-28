import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminListEggs, adminDeleteEgg } from '../../api/admin'
import { queryKeys } from '../../api/queryKeys'
import { sileo } from 'sileo'
import { HugeiconsIcon } from '@hugeicons/react'
import { BoxIcon, DeleteIcon } from '@hugeicons/core-free-icons'
import api from '../../api/client'
import Button from '../../components/Button'
import type { Egg } from '../../types/server'
import { AdminLayout } from '../../components/admin/AdminLayout'
import { DataTable } from '../../components/DataTable'
import type { Column } from '../../components/DataTable'
import { RowMenuButton, RowMenuItem } from '../../components/admin/RowMenu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../../components/ui/dialog'
import { Input } from '../../components/ui/Input'

// ─── Create Egg Dialog ────────────────────────────────────────────────────────

function CreateEggDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [dockerImage, setDockerImage] = useState('')
  const [startCmd, setStartCmd] = useState('')

  const createMutation = useMutation({
    mutationFn: async () => {
      await api.post('/admin/eggs', { name, docker_image: dockerImage, start_cmd: startCmd, default_env: {}, config_files: [] })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.eggs })
      onClose()
      sileo.success({ description: 'Egg created' })
    },
    onError: () => sileo.error({ description: 'Failed to create egg' }),
  })

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Egg</DialogTitle>
          <DialogDescription>Define a new game or application template.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Minecraft Paper" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Docker Image</label>
            <Input value={dockerImage} onChange={(e) => setDockerImage(e.target.value)} placeholder="itzg/minecraft-server:latest" className="font-mono" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Startup Command</label>
            <Input value={startCmd} onChange={(e) => setStartCmd(e.target.value)} placeholder="java -Xmx1024M -jar server.jar nogui" className="font-mono" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" width={80} height={34} onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            width={110}
            height={34}
            onClick={() => createMutation.mutate()}
            disabled={!name || !dockerImage || !startCmd || createMutation.isPending}
            loading={createMutation.isPending}
          >
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Egg Detail Dialog ────────────────────────────────────────────────────────

function EggDetailDialog({ egg, open, onClose }: { egg: Egg; open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient()

  const deleteMutation = useMutation({
    mutationFn: () => adminDeleteEgg(egg.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.eggs })
      sileo.success({ description: 'Egg deleted' })
      onClose()
    },
    onError: () => sileo.error({ description: 'Failed to delete egg' }),
  })

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{egg.name}</DialogTitle>
          <DialogDescription className="font-mono">{egg.docker_image}</DialogDescription>
        </DialogHeader>
        <div className="space-y-1">
          {[
            { label: 'Egg ID', value: `#${egg.id?.slice(0, 8)}` },
            { label: 'Name', value: egg.name },
            { label: 'Docker Image', value: egg.docker_image },
            { label: 'Startup Command', value: egg.start_cmd },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between rounded-md px-3 py-2.5">
              <span className="text-sm text-muted-foreground">{label}</span>
              <span className="text-sm font-medium font-mono max-w-[60%] truncate">{value}</span>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button
            variant="danger"
            width={110}
            height={34}
            onClick={() => {
              if (confirm(`Delete "${egg.name}"? This cannot be undone.`)) deleteMutation.mutate()
            }}
          >
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function AdminCargoPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [showCreate, setShowCreate] = useState(false)
  const [selected, setSelected] = useState<Egg | null>(null)

  const { data: eggs, isLoading } = useQuery({
    queryKey: queryKeys.admin.eggs,
    queryFn: adminListEggs,
  })

  const eggList: Egg[] = Array.isArray(eggs) ? eggs : []
  const filtered = search ? eggList.filter((e) => e.name.toLowerCase().includes(search.toLowerCase())) : eggList

  const columns: Column<Egg>[] = [
    {
      label: 'Egg',
      width: 'flex-1 min-w-0',
      render: (egg) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-purple-500/10 flex items-center justify-center shrink-0">
            <HugeiconsIcon icon={BoxIcon} className="w-4 h-4 text-purple-400" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-[var(--fg)] truncate">{egg.name}</p>
            <p className="text-xs text-[var(--fg-muted)] font-mono truncate">{egg.docker_image}</p>
          </div>
        </div>
      ),
    },
    {
      label: 'Startup Command',
      width: 'flex-1 min-w-0',
      render: (egg) => (
        <span className="text-xs text-[var(--fg-muted)] font-mono truncate block">{egg.start_cmd}</span>
      ),
    },
  ]

  return (
    <AdminLayout
      title="Egg Templates"
      description="Manage game and application templates."
      actions={
        <Button variant="primary" width={120} height={34} onClick={() => setShowCreate(true)}>
          Create Egg
        </Button>
      }
    >
      <DataTable
        data={filtered}
        columns={columns}
        searchValue={search}
        onSearch={(v) => { setSearch(v); setPage(1) }}
        onRowClick={setSelected}
        rowMenu={(egg) => (
          <RowMenuButton>
            <RowMenuItem
              icon={<HugeiconsIcon icon={DeleteIcon} className="h-4 w-4" />}
              label="Delete"
              destructive
              onClick={() => setSelected(egg)}
            />
          </RowMenuButton>
        )}
        loading={isLoading}
        emptyMessage="No eggs found. Create one to get started."
        entityName="egg"
        pagination={{
          currentPage: page,
          totalPages: Math.max(1, Math.ceil(filtered.length / 20)),
          total: filtered.length,
          onPageChange: setPage,
        }}
      />

      <CreateEggDialog open={showCreate} onClose={() => setShowCreate(false)} />
      {selected && <EggDetailDialog egg={selected} open={selected !== null} onClose={() => setSelected(null)} />}
    </AdminLayout>
  )
}
