import { HugeiconsIcon } from '@hugeicons/react'
import { LocationIcon } from '@hugeicons/core-free-icons'
import { AdminLayout } from '../../components/admin/AdminLayout'

/*
 * Locations — placeholder page. There is no locations table or API yet
 * (nodes currently belong to a single implicit region), so this renders
 * the roadmap stub instead of a data grid with non-functional actions.
 */
export default function AdminLocationsPage() {
  return (
    <AdminLayout
      title="Locations"
      description="Manage datacenter locations and regions."
    >
      <div className="flex flex-1 flex-col items-center justify-center gap-4 py-24 text-center">
        <div className="w-14 h-14 rounded-xl bg-[var(--bg-elevated)] flex items-center justify-center">
          <HugeiconsIcon icon={LocationIcon} className="w-7 h-7 text-[var(--fg-muted)]" />
        </div>
        <div>
          <p className="text-sm font-medium text-[var(--fg)]">Locations are on the roadmap</p>
          <p className="text-xs text-[var(--fg-muted)] mt-1 max-w-sm">
            Group nodes into datacenter regions once multi-region support lands.
            Nodes currently live in a single implicit location.
          </p>
        </div>
      </div>
    </AdminLayout>
  )
}
