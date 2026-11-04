import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { queryKeys } from '../../api/queryKeys'
import { getServer } from '../../api/servers'
import { listBackups, createBackup, deleteBackup, restoreBackup } from '../../api/backups'
import type { Backup } from '../../api/backups'
import Button from '../../components/Button'
import Heading from '../../components/ui/Heading'
import { Spinner } from '../../components/ui/Spinner'
import { Input } from '../../components/ui/Input'
import { Label } from '../../components/ui/Label'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from '../../components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '../../components/ui/alert-dialog'
import { Card } from '../../components/ui/Card'

function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / 1024 ** i).toFixed(i > 1 ? 1 : 0)} ${units[i]}`
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(iso))
}

function BackupStatusBadge({ status }: { status: Backup['status'] }) {
  if (status === 'creating' || status === 'restoring') {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-[var(--fg-muted)]">
        <Spinner className="size-3" />
        {status === 'creating' ? 'Creating…' : 'Restoring…'}
      </span>
    )
  }
  if (status === 'failed') {
    return (
      <span className="inline-flex items-center rounded-full bg-red-500/10 px-2 py-0.5 text-[11px] font-medium text-red-400">Failed</span>
    )
  }
  return null
}

function BackupRow({ backup, serverId }: { backup: Backup; serverId: string }) {
  const [deleting, setDeleting] = useState(false)
  const [restoring, setRestoring] = useState(false)
  const [showRestore, setShowRestore] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const isActionable = backup.status === 'completed'
  const queryClient = useQueryClient()

  const restoreMutation = useMutation({
    mutationFn: () => restoreBackup(serverId, backup.id),
    onSuccess: () => { setRestoring(false); setShowRestore(false) },
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteBackup(serverId, backup.id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.servers.backups(serverId) }); setDeleting(false); setShowDelete(false) },
  })

  return (
    <>
      <div className="flex items-center gap-4 px-6 py-3 hover:bg-[var(--bg-elevated)]/30 transition-colors">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-[var(--fg)] truncate">{backup.name}</span>
            <BackupStatusBadge status={backup.status} />
          </div>
          <div className="mt-0.5 flex items-center gap-3 text-xs text-[var(--fg-muted)]">
            <span>{formatSize(backup.size_bytes)}</span>
            <span>{formatDate(backup.created_at)}</span>
            {backup.error && <span className="text-red-500 truncate">{backup.error}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isActionable && (
            <Button variant="secondary" width="auto" height={32} onClick={() => setShowRestore(true)} disabled={restoring}>
              Restore
            </Button>
          )}
          <Button variant="danger" width="auto" height={32} onClick={() => setShowDelete(true)} disabled={deleting}>
            Delete
          </Button>
        </div>
      </div>

      <AlertDialog open={showRestore} onOpenChange={setShowRestore}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore {backup.name}</AlertDialogTitle>
            <AlertDialogDescription>
              This will <strong>delete all current server files</strong> and replace them with this backup. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowRestore(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setRestoring(true); restoreMutation.mutate() }}>Restore</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {backup.name}</AlertDialogTitle>
            <AlertDialogDescription>
              This backup will be permanently deleted and cannot be recovered.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowDelete(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setDeleting(true); deleteMutation.mutate() }}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

function CreateBackupDialog({ serverId, canCreate, currentCount, backupLimit }: {
  serverId: string; canCreate: boolean; backupLimit: number; currentCount: number
}) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const queryClient = useQueryClient()

  const createMutation = useMutation({
    mutationFn: (backupName: string) => createBackup(serverId, backupName),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.servers.backups(serverId) }); setOpen(false); setName('') },
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button width="auto" height={32} disabled={!canCreate}>
          Create backup
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(name || `Backup ${new Date().toLocaleDateString()}`) }}>
          <DialogHeader>
            <DialogTitle>Create backup</DialogTitle>
            <DialogDescription>
              Create a snapshot of this server&apos;s files.{backupLimit > 0 && ` ${currentCount} of ${backupLimit} backups used.`}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 grid gap-2">
            <Label htmlFor="backup-name">Backup name</Label>
            <Input id="backup-name" value={name} onChange={(e) => setName(e.target.value)} placeholder={`Backup ${new Date().toLocaleDateString()}`} maxLength={255} required />
          </div>
          <DialogFooter className="mt-6">
            <Button type="submit" width="auto" height={32} disabled={createMutation.isPending} loading={createMutation.isPending}>
              Create backup
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default function ServerBackupsPage() {
  const { id } = useParams<{ id: string }>()
  const { data: server } = useQuery({ queryKey: queryKeys.servers.detail(id!), queryFn: () => getServer(id!), enabled: !!id })
  const { data: backups = [], isLoading } = useQuery({ queryKey: queryKeys.servers.backups(id!), queryFn: () => listBackups(id!), enabled: !!id })

  if (!server) return null

  const completedCount = backups.filter((b: Backup) => b.status === 'completed' || b.status === 'creating').length
  const canCreate = 5 > 0 && completedCount < 5

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <Heading title="Backups" description="Create and restore snapshots of this server's files." />
        <CreateBackupDialog serverId={id!} canCreate={canCreate} backupLimit={5} currentCount={completedCount} />
      </div>

      <Card className="overflow-hidden [&>[data-slot=card-inner]]:py-0">
        {isLoading ? (
          <div className="text-center py-12">
            <Spinner className="mx-auto size-5 text-[var(--fg-muted)]" />
            <p className="text-sm text-[var(--fg-muted)] mt-3">Loading backups...</p>
          </div>
        ) : backups.length > 0 ? (
          <div className="divide-y divide-[var(--border)]">
            {backups.map((backup: Backup) => (
              <BackupRow key={backup.id} backup={backup} serverId={id!} />
            ))}
          </div>
        ) : (
          <div className="px-6 py-12 text-center">
            <p className="text-sm text-[var(--fg-muted)]">No backups yet. Create one to snapshot your server files.</p>
          </div>
        )}
      </Card>
    </div>
  )
}
