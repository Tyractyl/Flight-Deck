import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../../api/queryKeys'
import { adminListNodes, adminDeleteNode, adminCreateNode, adminUpdateNode, adminEnrollNode } from '../../api/admin'
import { sileo } from 'sileo'
import { HugeiconsIcon } from '@hugeicons/react'
import { CpuIcon, DeleteIcon, PencilEdit01Icon, GpuIcon, CloudServerIcon } from '@hugeicons/core-free-icons'
import Button from '../../components/Button'
import { AdminLayout } from '../../components/admin/AdminLayout'
import { DataTable } from '../../components/DataTable'
import type { Column } from '../../components/DataTable'
import { RowMenuButton, RowMenuItem } from '../../components/admin/RowMenu'
import type { Node } from '../../types/server'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../../components/ui/dialog'
import { Input } from '../../components/ui/Input'

// ─── Create Node Dialog ──────────────────────────────────────────────────────

function CreateNodeDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [fqdn, setFqdn] = useState('')
  const [port, setPort] = useState('8080')
  const [memory, setMemory] = useState('8192')
  const [disk, setDisk] = useState('51200')
  const [cpu, setCpu] = useState('200')
  const [gpuEnabled, setGpuEnabled] = useState(false)
  const [createdNode, setCreatedNode] = useState<Node | null>(null)
  const [copied, setCopied] = useState(false)

  const createMutation = useMutation({
    mutationFn: () => adminCreateNode({
      name, fqdn,
      port: parseInt(port) || 8080,
      total_memory: parseInt(memory) || 8192,
      total_disk: parseInt(disk) || 51200,
      total_cpu: parseInt(cpu) || 200,
      gpu_enabled: gpuEnabled,
    }),
    onSuccess: (node) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.nodes })
      setCreatedNode(node)
    },
    onError: () => sileo.error({ description: 'Failed to create node' }),
  })

  // Token step after creation
  if (createdNode) {
    return (
      <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Node Created</DialogTitle>
            <DialogDescription>Save this token — you won't see it again.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Configuration Token</label>
              <div className="mt-1.5 flex items-center gap-2">
                <code className="flex-1 px-3 py-2 rounded-lg bg-muted text-xs font-mono select-all break-all">
                  {createdNode.token}
                </code>
                <Button width={70} height={34} onClick={() => {
                  navigator.clipboard.writeText(createdNode.token)
                  setCopied(true)
                  setTimeout(() => setCopied(false), 2000)
                }}>
                  {copied ? 'Copied' : 'Copy'}
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="primary" width={80} height={34} onClick={onClose}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Node</DialogTitle>
          <DialogDescription>Register a new Talon daemon node.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Name</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. us-east-1" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Port</label>
              <Input value={port} onChange={(e) => setPort(e.target.value)} placeholder="8080" />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">FQDN / IP</label>
            <Input value={fqdn} onChange={(e) => setFqdn(e.target.value)} placeholder="node1.example.com" className="font-mono" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">RAM (MB)</label>
              <Input value={memory} onChange={(e) => setMemory(e.target.value)} placeholder="8192" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Disk (MB)</label>
              <Input value={disk} onChange={(e) => setDisk(e.target.value)} placeholder="51200" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">CPU (%)</label>
              <Input value={cpu} onChange={(e) => setCpu(e.target.value)} placeholder="200" />
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg border px-4 py-3">
            <div>
              <p className="text-sm font-medium">GPU Acceleration</p>
              <p className="text-xs text-muted-foreground">Enable GPU passthrough</p>
            </div>
            <button
              onClick={() => setGpuEnabled(!gpuEnabled)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${gpuEnabled ? 'bg-emerald-500' : 'bg-muted'}`}
            >
              <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${gpuEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" width={80} height={34} onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            width={120}
            height={34}
            onClick={() => createMutation.mutate()}
            disabled={!name || !fqdn || createMutation.isPending}
            loading={createMutation.isPending}
          >
            Create Node
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Node Detail Dialog ─────────────────────────────────────────────────────

function NodeDetailDialog({ node, open, onClose }: { node: Node; open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [editingName, setEditingName] = useState(node.name)
  const [editingFqdn, setEditingFqdn] = useState(node.fqdn)
  const [editingPort, setEditingPort] = useState(String(node.port))
  const [editingMemory, setEditingMemory] = useState(String(node.total_memory))
  const [editingDisk, setEditingDisk] = useState(String(node.total_disk))
  const [editingCpu, setEditingCpu] = useState(String(node.total_cpu))
  const [editingGpu, setEditingGpu] = useState(node.gpu_enabled)
  const [saving, setSaving] = useState(false)
  const [enrolling, setEnrolling] = useState(false)
  const [copied, setCopied] = useState(false)

  const updateMutation = useMutation({
    mutationFn: () => adminUpdateNode(node.id, {
      name: editingName, fqdn: editingFqdn,
      port: parseInt(editingPort) || 8080,
      total_memory: parseInt(editingMemory) || 0,
      total_disk: parseInt(editingDisk) || 0,
      total_cpu: parseInt(editingCpu) || 0,
      gpu_enabled: editingGpu,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.nodes })
      sileo.success({ description: 'Node updated' })
    },
    onError: () => sileo.error({ description: 'Failed to update node' }),
  })

  const deleteMutation = useMutation({
    mutationFn: () => adminDeleteNode(node.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.nodes })
      sileo.success({ description: 'Node deleted' })
      onClose()
    },
    onError: () => sileo.error({ description: 'Failed to delete node' }),
  })

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{node.name}</DialogTitle>
          <DialogDescription className="font-mono">{node.fqdn}:{node.port}</DialogDescription>
        </DialogHeader>

        <div className="space-y-1">
          {[
            { label: 'Node ID', value: `#${node.id?.slice(0, 8)}` },
            { label: 'Status', value: node.is_online ? 'Online' : 'Offline' },
            { label: 'Memory', value: `${node.total_memory} MB` },
            { label: 'Disk', value: `${node.total_disk} MB` },
            { label: 'CPU', value: `${node.total_cpu}%` },
            { label: 'GPU', value: node.gpu_enabled ? 'Enabled' : 'Disabled' },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between rounded-md px-3 py-2.5">
              <span className="text-sm text-muted-foreground">{label}</span>
              <span className="text-sm font-medium">{value}</span>
            </div>
          ))}
        </div>

        {/* Config Token */}
        <div>
          <label className="text-xs font-medium text-muted-foreground">Config Token</label>
          <div className="mt-1.5 flex items-center gap-2">
            <code className="flex-1 px-3 py-2 rounded-lg bg-muted text-xs font-mono select-all break-all">{node.token}</code>
            <Button width={70} height={34} onClick={() => { navigator.clipboard.writeText(node.token); setCopied(true); setTimeout(() => setCopied(false), 2000) }}>
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </div>
        </div>

        {/* Edit section */}
        <div className="space-y-3 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Name</label>
              <Input value={editingName} onChange={(e) => setEditingName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Port</label>
              <Input value={editingPort} onChange={(e) => setEditingPort(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">FQDN</label>
            <Input value={editingFqdn} onChange={(e) => setEditingFqdn(e.target.value)} className="font-mono" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">RAM (MB)</label>
              <Input value={editingMemory} onChange={(e) => setEditingMemory(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Disk (MB)</label>
              <Input value={editingDisk} onChange={(e) => setEditingDisk(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">CPU (%)</label>
              <Input value={editingCpu} onChange={(e) => setEditingCpu(e.target.value)} />
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg border px-4 py-3">
            <div>
              <p className="text-sm font-medium">GPU Acceleration</p>
              <p className="text-xs text-muted-foreground">Enable GPU passthrough</p>
            </div>
            <button
              onClick={() => setEditingGpu(!editingGpu)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${editingGpu ? 'bg-emerald-500' : 'bg-muted'}`}
            >
              <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${editingGpu ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>
        </div>

        <DialogFooter className="justify-between">
          <div className="flex gap-2">
            {!node.is_online && (
              <Button
                variant="primary"
                width={110}
                height={34}
                loading={enrolling}
                onClick={async () => {
                  setEnrolling(true)
                  try {
                    await adminEnrollNode(node.id)
                    queryClient.invalidateQueries({ queryKey: queryKeys.admin.nodes })
                    sileo.success({ description: 'Node enrolled' })
                  } catch { sileo.error({ description: 'Failed to enroll node' }) }
                  setEnrolling(false)
                }}
              >
                Enroll
              </Button>
            )}
            <Button
              variant="danger"
              width={100}
              height={34}
              onClick={() => {
                if (confirm(`Delete "${node.name}"?`)) deleteMutation.mutate()
              }}
            >
              Delete
            </Button>
          </div>
          <Button
            width={100}
            height={34}
            onClick={() => { setSaving(true); updateMutation.mutate(); setTimeout(() => setSaving(false), 600) }}
            loading={saving}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function AdminNodesPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)

  const { data: nodes, isLoading } = useQuery({
    queryKey: queryKeys.admin.nodes,
    queryFn: adminListNodes,
  })

  const nodeList: Node[] = Array.isArray(nodes) ? nodes : []
  const filtered = search
    ? nodeList.filter((n) =>
        (n.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (n.fqdn || '').toLowerCase().includes(search.toLowerCase())
      )
    : nodeList

  const columns: Column<Node>[] = [
    {
      label: 'Node',
      width: 'flex-1 min-w-0',
      render: (node) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-[var(--bg-elevated)] flex items-center justify-center shrink-0">
            <HugeiconsIcon icon={CpuIcon} className="w-4 h-4 text-[var(--fg-muted)]" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-[var(--fg)] truncate">{node.name}</p>
            <p className="text-xs text-[var(--fg-muted)] font-mono truncate">{node.fqdn}</p>
          </div>
        </div>
      ),
    },
    {
      label: 'Status',
      width: 'w-24 text-center',
      render: (node) => (
        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${
          node.is_online ? 'bg-emerald-500/10 text-emerald-500' : 'bg-neutral-500/10 text-neutral-400'
        }`}>
          {node.is_online ? 'Online' : 'Offline'}
        </span>
      ),
    },
    {
      label: 'Resources',
      width: 'w-36 text-right',
      render: (node) => (
        <span className="text-sm text-[var(--fg-secondary)]">{node.total_memory}MB · {node.total_cpu}%</span>
      ),
    },
  ]

  return (
    <AdminLayout
      title="Nodes"
      description="Manage daemon nodes and their resources."
      actions={
        <Button variant="primary" width={130} height={34} onClick={() => setShowCreateModal(true)}>
          Create Node
        </Button>
      }
    >
      <DataTable
        data={filtered}
        columns={columns}
        searchValue={search}
        onSearch={(v) => { setSearch(v); setPage(1) }}
        onRowClick={setSelectedNode}
        rowMenu={(node) => (
          <RowMenuButton>
            <RowMenuItem
              icon={<HugeiconsIcon icon={PencilEdit01Icon} className="h-4 w-4" />}
              label="Edit"
              onClick={() => setSelectedNode(node)}
            />
            <RowMenuItem
              icon={<HugeiconsIcon icon={DeleteIcon} className="h-4 w-4" />}
              label="Delete..."
              destructive
              onClick={() => setSelectedNode(node)}
            />
          </RowMenuButton>
        )}
        loading={isLoading}
        emptyMessage="No nodes found. Create one to get started."
        entityName="node"
        pagination={{
          currentPage: page,
          totalPages: Math.max(1, Math.ceil(filtered.length / 20)),
          total: filtered.length,
          onPageChange: setPage,
        }}
      />

      <CreateNodeDialog open={showCreateModal} onClose={() => setShowCreateModal(false)} />
      {selectedNode && (
        <NodeDetailDialog node={selectedNode} open={selectedNode !== null} onClose={() => setSelectedNode(null)} />
      )}
    </AdminLayout>
  )
}
