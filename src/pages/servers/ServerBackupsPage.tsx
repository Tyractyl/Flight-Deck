import { useState } from 'react'
import { Input } from '../../components/ui/Input'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { queryKeys } from '../../api/queryKeys'
import { getServer } from '../../api/servers'
import { listBackups, createBackup, deleteBackup, restoreBackup } from '../../api/backups'
import type { Backup } from '../../api/backups'
import { sileo } from 'sileo'
import {
  ArchiveIcon,
  ClockIcon,
  HardDriveIcon,
  AddIcon,
  RedoIcon,
  DeleteIcon,
  LoadingIcon
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'

function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / 1024 ** i).toFixed(i > 1 ? 1 : 0)} ${units[i]}`
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Intl.DateTimeFormat(undefined, {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  }).format(new Date(iso))
}

function BackupStatusBadge({ status }: { status: Backup['status'] }) {
  if (status === 'creating' || status === 'restoring') {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-[var(--fg-muted)]">
        <HugeiconsIcon icon={LoadingIcon} className="h-3 w-3 animate-spin" />
        {status === 'creating' ? 'Creating...' : 'Restoring...'}
      </span>
    )
  }
  if (status === 'failed') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-red-500/10 text-red-400">
        Failed
      </span>
    )
  }
  return null
}

function BackupCard({
  backup,
  onRestore,
  onDelete
}: {
  backup: Backup
  onRestore: (id: string) => void
  onDelete: (id: string) => void
}) {
  const isActionable = backup.status === 'completed'
  const isInProgress = backup.status === 'creating' || backup.status === 'restoring'

  return (
    <div className="group relative flex items-center gap-3 rounded-xl border border-theme-strong bg-[var(--bg-card)] px-1 py-1">
      <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[var(--bg)] text-[var(--fg-muted)] shadow-xs ring-1 ring-theme-strong">
        <HugeiconsIcon icon={ArchiveIcon} className="relative h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1 pl-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-[var(--fg)] truncate">{backup.name}</span>
          <BackupStatusBadge status={backup.status} />
        </div>
        <div className="flex items-center gap-3 mt-0.5 text-xs text-[var(--fg-muted)]">
          {backup.size_bytes > 0 && (
            <span className="flex items-center gap-1">
              <HugeiconsIcon icon={HardDriveIcon} className="h-3 w-3" />
              {formatSize(backup.size_bytes)}
            </span>
          )}
          <span className="flex items-center gap-1">
            <HugeiconsIcon icon={ClockIcon} className="h-3 w-3" />
            {formatDate(backup.created_at)}
          </span>
          {backup.error && <span className="text-red-400 truncate">{backup.error}</span>}
        </div>
      </div>
      <div className="flex items-center gap-1 pr-2">
        {isActionable && (
          <button
            onClick={() => onRestore(backup.id)}
            className="p-2 rounded-lg hover:bg-[var(--bg-elevated)] text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors"
            title="Restore backup"
          >
            <HugeiconsIcon icon={RedoIcon} className="h-3.5 w-3.5" />
          </button>
        )}
        <button
          onClick={() => onDelete(backup.id)}
          disabled={isInProgress}
          className="p-2 rounded-lg hover:bg-red-500/10 text-[var(--fg-muted)] hover:text-red-400 transition-colors disabled:opacity-30"
          title="Delete backup"
        >
          <HugeiconsIcon icon={DeleteIcon} className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}

export default function ServerBackupsPage() {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)
  const [backupName, setBackupName] = useState('')

  const { data: server } = useQuery({
    queryKey: queryKeys.servers.detail(id!),
    queryFn: () => getServer(id!),
    enabled: !!id,
  })

  const { data: backups = [], isLoading } = useQuery({
    queryKey: queryKeys.servers.backups(id!),
    queryFn: () => listBackups(id!),
    enabled: !!id,
  })

  const createMutation = useMutation({
    mutationFn: (name: string) => createBackup(id!, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.servers.backups(id!) })
      sileo.success({ description: 'Backup created', icon: false })
    },
    onError: () => sileo.error({ description: 'Failed to create backup', icon: false }),
  })

  const deleteMutation = useMutation({
    mutationFn: (backupId: string) => deleteBackup(id!, backupId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.servers.backups(id!) })
      sileo.success({ description: 'Backup deleted', icon: false })
    },
    onError: () => sileo.error({ description: 'Failed to delete backup', icon: false }),
  })

  const restoreMutation = useMutation({
    mutationFn: (backupId: string) => restoreBackup(id!, backupId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.servers.backups(id!) })
      sileo.success({ description: 'Backup restoring...', icon: false })
    },
    onError: () => sileo.error({ description: 'Failed to restore backup', icon: false }),
  })

  const backupLimit = 5
  const completedCount = backups.filter((b: Backup) => b.status === 'completed' || b.status === 'creating').length
  const canCreate = backupLimit > 0 && completedCount < backupLimit

  if (!server) return null

  return (
    <div className="px-1 py-6 space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-[var(--fg)]">Backups</h2>
        <p className="text-sm text-[var(--fg-muted)]">Create and restore snapshots of this server's files.</p>
      </div>

      <div className="rounded-md bg-[var(--bg-elevated)] p-1">
        <div className="rounded-md border border-theme-strong bg-[var(--bg-card)] p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-[var(--fg)]">Server backups</h3>
              <p className="text-xs text-[var(--fg-muted)] mt-0.5">
                {backupLimit <= 0
                  ? 'Backups are disabled for this server.'
                  : `${completedCount} of ${backupLimit} backups used.`}
              </p>
            </div>
            <button
              onClick={() => setCreateOpen(true)}
              disabled={!canCreate}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--accent)] text-white text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-40"
              title={!canCreate ? `Backup limit of ${backupLimit} reached` : undefined}
            >
              <HugeiconsIcon icon={AddIcon} className="h-4 w-4" />
              Create backup
            </button>
          </div>

          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-sm text-[var(--fg-muted)]">Loading backups...</p>
            </div>
          ) : backups.length > 0 ? (
            <div className="mt-4 grid gap-2">
              {backups.map((backup: Backup) => (
                <BackupCard
                  key={backup.id}
                  backup={backup}
                  onRestore={(bid) => {
                    if (confirm('This will delete all current server files and replace them with this backup. This cannot be undone.')) {
                      restoreMutation.mutate(bid)
                    }
                  }}
                  onDelete={(bid) => {
                    if (confirm('This backup will be permanently deleted.')) {
                      deleteMutation.mutate(bid)
                    }
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-dashed border-theme-strong px-4 py-6 text-center">
              <p className="text-xs text-[var(--fg-muted)]">
                {backupLimit <= 0
                  ? 'Backups are not enabled for this server.'
                  : 'No backups yet. Create one to snapshot your server files.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Create Backup Dialog */}
      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[var(--bg-card)] rounded-xl border border-theme-strong p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-[var(--fg)]">Create backup</h3>
            <p className="text-sm text-[var(--fg-muted)] mt-1 mb-4">
              Create a snapshot of this server's files.
              {backupLimit > 0 && ` ${completedCount} of ${backupLimit} backups used.`}
            </p>
            <form onSubmit={(e) => {
              e.preventDefault()
              createMutation.mutate(backupName || `Backup ${new Date().toLocaleDateString()}`)
              setBackupName('')
              setCreateOpen(false)
            }}>
              <label className="text-xs font-medium text-[var(--fg-muted)] block mb-1.5">Backup name</label>
              <Input
                value={backupName}
                onChange={(e) => setBackupName(e.target.value)}
                placeholder={`Backup ${new Date().toLocaleDateString()}`}
                maxLength={255}
                autoFocus
              />
              <div className="flex justify-end gap-2 mt-4">
                <button type="button" onClick={() => { setCreateOpen(false); setBackupName('') }} className="px-3 py-1.5 rounded-[8px] bg-[var(--bg-elevated)] text-[var(--fg)] text-xs font-medium border border-theme-strong">Cancel</button>
                <button type="submit" disabled={createMutation.isPending} className="px-3 py-1.5 rounded-[8px] bg-[var(--accent)] text-white text-xs font-medium disabled:opacity-40">Create backup</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
