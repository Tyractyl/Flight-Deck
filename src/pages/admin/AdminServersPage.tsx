import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../../api/queryKeys'
import { adminListServers, adminDeleteServer, adminKillServer } from '../../api/admin'
import { sileo } from 'sileo'
import { HugeiconsIcon } from '@hugeicons/react'
import { ComputerIcon, DeleteIcon } from '@hugeicons/core-free-icons'
import Button from '../../components/Button'
import { AdminLayout } from '../../components/admin/AdminLayout'
import { DataTable } from '../../components/DataTable'
import type { Column } from '../../components/DataTable'
import { RowMenuButton, RowMenuItem } from '../../components/admin/RowMenu'
import type { Server } from '../../types/server'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../../components/ui/dialog'

// ─── Server Detail Dialog ──────────────────────────────────────────────────────

function ServerDetailDialog({ server, open, onClose }: { server: Server; open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient()

  const deleteMutation = useMutation({
    mutationFn: () => adminDeleteServer(server.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.servers })
      sileo.success({ description: 'Server deleted' })
      onClose()
    },
    onError: () => sileo.error({ description: 'Failed to delete server' }),
  })

  const killMutation = useMutation({
    mutationFn: () => adminKillServer(server.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.servers })
      sileo.success({ description: 'Server killed' })
    },
    onError: () => sileo.error({ description: 'Failed to kill server' }),
  })

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{server.name}</DialogTitle>
          <DialogDescription>{server.user_username ?? 'Unknown user'} · {server.node_name ?? '—'}</DialogDescription>
        </DialogHeader>
        <div className="space-y-1">
          {[
            { label: 'Server ID', value: `#${server.id?.slice(0, 8)}` },
            { label: 'Status', value: server.status ?? 'Unknown' },
            { label: 'Memory', value: `${server.memory_mb ?? 0} MB` },
            { label: 'Disk', value: `${server.disk_mb ?? 0} MB` },
            { label: 'CPU', value: `${server.cpu_percent ?? 0}%` },
            { label: 'Created', value: server.created_at ? new Date(server.created_at).toLocaleDateString() : '—' },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between rounded-md px-3 py-2.5">
              <span className="text-sm text-muted-foreground">{label}</span>
              <span className="text-sm font-medium">{value}</span>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button
            variant="secondary"
            width={100}
            height={34}
            onClick={() => killMutation.mutate()}
            loading={killMutation.isPending}
          >
            Kill
          </Button>
          <Button
            variant="danger"
            width={120}
            height={34}
            onClick={() => {
              if (confirm(`Delete server "${server.name}"? This cannot be undone.`)) {
                deleteMutation.mutate()
              }
            }}
          >
            Delete server
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function AdminServersPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [selectedServer, setSelectedServer] = useState<Server | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.admin.servers,
    queryFn: () => adminListServers(500, 0),
  })

  const servers = Array.isArray(data?.servers) ? data!.servers : []
  const filtered = search
    ? servers.filter((s) =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        (s.user_username || '').toLowerCase().includes(search.toLowerCase())
      )
    : servers

  const statusColor = (status?: string) => {
    switch (status) {
      case 'running': return 'bg-emerald-500/10 text-emerald-500'
      case 'starting': return 'bg-yellow-500/10 text-yellow-500'
      case 'stopped': return 'bg-neutral-500/10 text-neutral-400'
      case 'installing': return 'bg-blue-500/10 text-blue-400'
      default: return 'bg-neutral-500/10 text-neutral-400'
    }
  }

  const columns: Column<Server>[] = [
    {
      label: 'Server',
      width: 'flex-1 min-w-0',
      render: (server) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-[var(--bg-elevated)] flex items-center justify-center shrink-0">
            <HugeiconsIcon icon={ComputerIcon} className="w-4 h-4 text-[var(--fg-muted)]" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-[var(--fg)] truncate">{server.name}</p>
            <p className="text-xs text-[var(--fg-muted)] truncate">{server.user_username ?? 'Unknown'}</p>
          </div>
        </div>
      ),
    },
    {
      label: 'Node',
      width: 'w-32',
      render: (server) => (
        <span className="text-sm text-[var(--fg-secondary)] truncate block">{server.node_name ?? '—'}</span>
      ),
    },
    {
      label: 'Status',
      width: 'w-28 text-center',
      render: (server) => (
        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${statusColor(server.status)}`}>
          {server.status ?? 'Unknown'}
        </span>
      ),
    },
  ]

  return (
    <AdminLayout title="Servers" description="Manage all servers across the system.">
      <DataTable
        data={filtered}
        columns={columns}
        searchValue={search}
        onSearch={(v) => { setSearch(v); setPage(1) }}
        onRowClick={setSelectedServer}
        rowMenu={(server) => (
          <RowMenuButton>
            <RowMenuItem
              icon={<HugeiconsIcon icon={DeleteIcon} className="h-4 w-4" />}
              label="View & manage"
              onClick={() => setSelectedServer(server)}
            />
          </RowMenuButton>
        )}
        loading={isLoading}
        emptyMessage="No servers found"
        entityName="server"
        pagination={{
          currentPage: page,
          totalPages: Math.max(1, Math.ceil(filtered.length / 20)),
          total: filtered.length,
          onPageChange: setPage,
        }}
      />

      {selectedServer && (
        <ServerDetailDialog
          server={selectedServer}
          open={selectedServer !== null}
          onClose={() => setSelectedServer(null)}
        />
      )}
    </AdminLayout>
  )
}
