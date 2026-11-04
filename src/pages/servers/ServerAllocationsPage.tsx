import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Button from '../../components/Button'
import { Spinner } from '../../components/ui/Spinner'
import Heading from '../../components/ui/Heading'
import { Card } from '../../components/ui/Card'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '../../components/ui/alert-dialog'
import type { ServerContext } from './ServerConsolePage'
import type { ServerAllocation } from '../../types/server'

function AllocationRow({ allocation, serverId }: { allocation: ServerAllocation; serverId: string }) {
  const [deleting, setDeleting] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const queryClient = useQueryClient()
  const displayAddress = `${allocation.ip}:${allocation.port}`

  const deleteAllocation = useMutation({
    mutationFn: async (allocId: string) => { const res = await fetch(`/api/servers/${serverId}/allocations/${allocId}`, { method: 'DELETE' }); if (!res.ok) throw new Error('Failed') },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['server', serverId, 'allocations'] }); setDeleting(false); setShowDelete(false) },
  })

  return (
    <>
      <div className="flex items-center gap-4 px-6 py-3 hover:bg-[var(--bg-elevated)]/30 transition-colors">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <code className="text-sm font-medium text-[var(--fg)]">{displayAddress}</code>
            {allocation.isPrimary && (
              <span className="inline-flex items-center rounded-full bg-[var(--accent)]/10 px-2 py-0.5 text-[11px] font-medium text-[var(--accent)]">Primary</span>
            )}
          </div>
          <p className="text-xs text-[var(--fg-muted)] mt-0.5">{allocation.notes || `Port ${allocation.port}`}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="secondary" width="auto" height={28} onClick={() => navigator.clipboard.writeText(displayAddress)}>
            Copy
          </Button>
          {!allocation.isPrimary && (
            <Button variant="danger" width="auto" height={28} onClick={() => setShowDelete(true)} disabled={deleting}>
              Remove
            </Button>
          )}
        </div>
      </div>

      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove allocation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove <code className="font-medium">{displayAddress}</code> from this server?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowDelete(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setDeleting(true); deleteAllocation.mutate(allocation.id) }}>Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export default function ServerAllocationsPage() {
  const { server } = useOutletContext<ServerContext>()

  const { data: allocations, isLoading } = useQuery<ServerAllocation[]>({
    queryKey: ['server', server.id, 'allocations'],
    queryFn: async () => { const res = await fetch(`/api/servers/${server.id}/allocations`); if (!res.ok) throw new Error('Failed'); return res.json() },
  })

  return (
    <div className="space-y-6">
      <Heading title="Allocations" description="Manage the network port allocations for this server." />

      <Card className="overflow-hidden [&>[data-slot=card-inner]]:py-0">
        {isLoading ? (
          <div className="text-center py-12">
            <Spinner className="mx-auto size-5 text-[var(--fg-muted)]" />
            <p className="text-sm text-[var(--fg-muted)] mt-3">Loading allocations...</p>
          </div>
        ) : allocations && allocations.length > 0 ? (
          <div className="divide-y divide-[var(--border)]">
            {allocations.map((alloc) => (
              <AllocationRow key={alloc.id} allocation={alloc} serverId={String(server.id)} />
            ))}
          </div>
        ) : (
          <div className="px-6 py-12 text-center">
            <p className="text-sm text-[var(--fg-muted)]">No allocations configured.</p>
          </div>
        )}
      </Card>
    </div>
  )
}
