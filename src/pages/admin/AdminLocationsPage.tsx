import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { LocationIcon, DeleteIcon } from '@hugeicons/core-free-icons'
import Button from '../../components/Button'
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

interface Location {
  id: string
  name: string
  short_name: string
  nodes_count: number
}

const EMPTY_LOCATIONS: Location[] = []

export default function AdminLocationsPage() {
  const [locations] = useState<Location[]>(EMPTY_LOCATIONS)
  const [search, setSearch] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)

  const filtered = search
    ? locations.filter((l) =>
        l.name.toLowerCase().includes(search.toLowerCase()) ||
        l.short_name.toLowerCase().includes(search.toLowerCase())
      )
    : locations

  const columns: Column<Location>[] = [
    {
      label: 'Location',
      width: 'flex-1 min-w-0',
      render: (loc) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-[var(--bg-elevated)] flex items-center justify-center shrink-0">
            <HugeiconsIcon icon={LocationIcon} className="w-4 h-4 text-[var(--fg-muted)]" />
          </div>
          <p className="text-sm font-medium text-[var(--fg)] truncate">{loc.name}</p>
        </div>
      ),
    },
    {
      label: 'Short name',
      width: 'w-32',
      render: (loc) => (
        <span className="text-sm text-[var(--fg-secondary)]">{loc.short_name}</span>
      ),
    },
    {
      label: 'Nodes',
      width: 'w-24 text-right',
      render: (loc) => (
        <span className="text-sm text-[var(--fg)]">{loc.nodes_count}</span>
      ),
    },
  ]

  return (
    <AdminLayout
      title="Locations"
      description="Manage datacenter locations and regions."
      actions={
        <Button variant="primary" width={130} height={34} onClick={() => setShowCreateModal(true)}>
          Create Location
        </Button>
      }
    >
      <DataTable
        data={filtered}
        columns={columns}
        searchValue={search}
        onSearch={setSearch}
        onRowClick={setSelectedLocation}
        rowMenu={(loc) => (
          <RowMenuButton>
            <RowMenuItem
              icon={<HugeiconsIcon icon={DeleteIcon} className="h-4 w-4" />}
              label="Delete..."
              destructive
              onClick={() => setSelectedLocation(loc)}
            />
          </RowMenuButton>
        )}
        emptyMessage="No locations found. Create one to organize your nodes."
        entityName="location"
      />

      {/* Create dialog */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Location</DialogTitle>
            <DialogDescription>Add a new datacenter location or region.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Name</label>
              <Input placeholder="e.g. US East" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Short name</label>
              <Input placeholder="e.g. EU West" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" width={100} height={36} onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" width={120} height={36}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail dialog */}
      <Dialog open={selectedLocation !== null} onOpenChange={(v) => { if (!v) setSelectedLocation(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedLocation?.name}</DialogTitle>
            <DialogDescription>{selectedLocation?.short_name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-1">
            {selectedLocation && [
              { label: 'Location ID', value: selectedLocation.id },
              { label: 'Name', value: selectedLocation.name },
              { label: 'Short name', value: selectedLocation.short_name },
              { label: 'Nodes', value: String(selectedLocation.nodes_count) },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between rounded-md px-3 py-2.5">
                <span className="text-sm text-[var(--fg-muted)]">{label}</span>
                <span className="text-sm font-medium text-[var(--fg)]">{value}</span>
              </div>
            ))}
          </div>
          <DialogFooter>
            {selectedLocation && (
              <Button variant="danger" width={120} height={34} onClick={() => {
                if (confirm(`Delete "${selectedLocation.name}"?`)) setSelectedLocation(null)
              }}>
                Delete
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  )
}
