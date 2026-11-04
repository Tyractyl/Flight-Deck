import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Button from '../../components/Button'
import { Spinner } from '../../components/ui/Spinner'
import { Input } from '../../components/ui/Input'
import { Label } from '../../components/ui/Label'
import { Checkbox } from '../../components/ui/Checkbox'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from '../../components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '../../components/ui/alert-dialog'
import Heading from '../../components/ui/Heading'
import { Card } from '../../components/ui/Card'
import type { ServerContext } from './ServerConsolePage'
import type { ServerUser } from '../../types/server'

const permissionLabels: Record<string, { label: string; description: string }> = {
  'console.read': { label: 'Console', description: 'View console output and send commands.' },
  'console.write': { label: 'Console', description: 'View console output and send commands.' },
  'files.read': { label: 'Files', description: 'Browse, edit, upload, and delete files.' },
  'files.write': { label: 'Files', description: 'Browse, edit, upload, and delete files.' },
  'files.delete': { label: 'Files', description: 'Browse, edit, upload, and delete files.' },
  'files.upload': { label: 'Files', description: 'Browse, edit, upload, and delete files.' },
  'backup.create': { label: 'Backups', description: 'Create, restore, and delete backups.' },
  'backup.read': { label: 'Backups', description: 'Create, restore, and delete backups.' },
  'backup.update': { label: 'Backups', description: 'Create, restore, and delete backups.' },
  'backup.delete': { label: 'Backups', description: 'Create, restore, and delete backups.' },
  'user.create': { label: 'Users', description: 'Add, edit, and remove subusers.' },
  'user.read': { label: 'Users', description: 'Add, edit, and remove subusers.' },
  'user.update': { label: 'Users', description: 'Add, edit, and remove subusers.' },
  'user.delete': { label: 'Users', description: 'Add, edit, and remove subusers.' },
  'allocation.read': { label: 'Allocations', description: 'Manage port allocations.' },
  'allocation.update': { label: 'Allocations', description: 'Manage port allocations.' },
  'firewall.read': { label: 'Firewall', description: 'Create and delete firewall rules.' },
  'firewall.update': { label: 'Firewall', description: 'Create and delete firewall rules.' },
  'settings.read': { label: 'Settings', description: 'Change server name and startup configuration.' },
  'settings.update': { label: 'Settings', description: 'Change server name and startup configuration.' },
  'start': { label: 'Power', description: 'Start, stop, restart, and kill the server.' },
  'stop': { label: 'Power', description: 'Start, stop, restart, and kill the server.' },
  'restart': { label: 'Power', description: 'Start, stop, restart, and kill the server.' },
  'kill': { label: 'Power', description: 'Start, stop, restart, and kill the server.' },
}

const ALL_PERMISSIONS = [
  'console.read', 'console.write',
  'files.read', 'files.write', 'files.delete', 'files.upload',
  'backup.create', 'backup.read', 'backup.update', 'backup.delete',
  'user.create', 'user.read', 'user.update', 'user.delete',
  'allocation.read', 'allocation.update',
  'firewall.read', 'firewall.update',
  'settings.read', 'settings.update',
  'start', 'stop', 'restart', 'kill',
] as const

function PermissionCheckboxes({ available, selected, onChange }: {
  available: readonly string[]; selected: string[]; onChange: (perms: string[]) => void
}) {
  const allSelected = available.every((p) => selected.includes(p))
  const toggleAll = () => onChange(allSelected ? [] : [...available])
  const toggle = (perm: string) => onChange(selected.includes(perm) ? selected.filter((p) => p !== perm) : [...selected, perm])

  return (
    <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
      <div className="flex items-center gap-2 border-b border-[var(--border)] pb-3 sticky top-0 bg-[var(--bg-card)]">
        <Checkbox id="select-all" checked={allSelected} onCheckedChange={toggleAll} />
        <Label htmlFor="select-all" className="cursor-pointer text-sm font-medium">Select all permissions</Label>
      </div>
      <div className="grid gap-2">
        {available.map((permission) => {
          const info = permissionLabels[permission]
          return (
            <div key={permission} className="flex items-start gap-2.5">
              <Checkbox id={`perm-${permission}`} checked={selected.includes(permission)} onCheckedChange={() => toggle(permission)} className="mt-0.5" />
              <label htmlFor={`perm-${permission}`} className="cursor-pointer">
                <p className="text-sm font-medium text-[var(--fg)]">{info?.label ?? permission}</p>
                {info?.description && <p className="text-xs text-[var(--fg-muted)]">{info.description}</p>}
              </label>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function SubuserRow({ subuser, onDelete }: { subuser: ServerUser; onDelete: () => void }) {
  const [showDelete, setShowDelete] = useState(false)

  return (
    <>
      <div className="flex items-center gap-4 px-6 py-3 hover:bg-[var(--bg-elevated)]/30 transition-colors">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-[var(--fg)]">{subuser.email}</p>
          <p className="text-xs text-[var(--fg-muted)] mt-0.5">
            {subuser.permissions.length} permission{subuser.permissions.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button variant="danger" width="auto" height={28} onClick={() => setShowDelete(true)}>
          Remove
        </Button>
      </div>

      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {subuser.email}</AlertDialogTitle>
            <AlertDialogDescription>
              This will revoke all access for {subuser.email} on this server.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowDelete(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { onDelete(); setShowDelete(false) }}>Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

function AddUserDialog({ serverId }: { serverId: string }) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [permissions, setPermissions] = useState<string[]>([...ALL_PERMISSIONS])
  const queryClient = useQueryClient()

  const createUser = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/servers/${serverId}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, permissions }),
      })
      if (!res.ok) throw new Error('Failed to create user')
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['server', serverId, 'users'] }); setOpen(false); setEmail(''); setPermissions([...ALL_PERMISSIONS]) },
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button width="auto" height={32}>
          Add user
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={(e) => { e.preventDefault(); createUser.mutate() }}>
          <DialogHeader>
            <DialogTitle>Add user</DialogTitle>
            <DialogDescription>Invite someone to this server by their email address. They must already have a panel account.</DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email address</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@example.com" required />
            </div>
            <div className="grid gap-2">
              <Label>Permissions</Label>
              <PermissionCheckboxes available={ALL_PERMISSIONS} selected={permissions} onChange={setPermissions} />
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button type="submit" width="auto" height={32} disabled={!email || createUser.isPending} loading={createUser.isPending}>
              Add user
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default function ServerUsersPage() {
  const { server } = useOutletContext<ServerContext>()
  const queryClient = useQueryClient()

  const { data: users, isLoading } = useQuery<ServerUser[]>({
    queryKey: ['server', server.id, 'users'],
    queryFn: async () => { const res = await fetch(`/api/servers/${server.id}/users`); if (!res.ok) throw new Error('Failed'); return res.json() },
  })

  const deleteUser = useMutation({
    mutationFn: async (userId: string) => { const res = await fetch(`/api/servers/${server.id}/users/${userId}`, { method: 'DELETE' }); if (!res.ok) throw new Error('Failed') },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['server', server.id, 'users'] }),
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <Heading title="Users" description="Manage who has access to this server and what they can do." />
        <AddUserDialog serverId={String(server.id)} />
      </div>

      <Card className="overflow-hidden [&>[data-slot=card-inner]]:py-0">
        {isLoading ? (
          <div className="text-center py-12">
            <Spinner className="mx-auto size-5 text-[var(--fg-muted)]" />
            <p className="text-sm text-[var(--fg-muted)] mt-3">Loading users...</p>
          </div>
        ) : users && users.length > 0 ? (
          <div className="divide-y divide-[var(--border)]">
            {users.map((user) => (
              <SubuserRow key={user.id} subuser={user} onDelete={() => deleteUser.mutate(user.id)} />
            ))}
          </div>
        ) : (
          <div className="px-6 py-12 text-center">
            <p className="text-sm text-[var(--fg-muted)]">No users have been added to this server yet.</p>
          </div>
        )}
      </Card>
    </div>
  )
}
