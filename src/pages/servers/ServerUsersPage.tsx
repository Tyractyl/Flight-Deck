import { useState } from 'react'
import { Input } from '../../components/ui/Input'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { queryKeys } from '../../api/queryKeys'
import { getServer } from '../../api/servers'
import { listSubusers, addSubuser, updateSubuserPermissions, removeSubuser } from '../../api/subusers'
import type { Subuser } from '../../api/subusers'
import { sileo } from 'sileo'
import { HugeiconsIcon } from '@hugeicons/react'
import { PencilIcon, AddIcon, DeleteIcon } from '@hugeicons/core-free-icons'

const permissionLabels: Record<string, { label: string; description: string }> = {
  console: { label: 'Console', description: 'View console output and send commands.' },
  files: { label: 'Files', description: 'Browse, edit, upload, and delete files.' },
  power: { label: 'Power', description: 'Start, stop, restart, and kill the server.' },
  settings: { label: 'Settings', description: 'Change server name and startup configuration.' },
  allocations: { label: 'Allocations', description: 'Manage port allocations.' },
  firewall: { label: 'Firewall', description: 'Create and delete firewall rules.' },
  users: { label: 'Users', description: 'Add, edit, and remove subusers.' },
}

function PermissionCheckboxes({
  available,
  selected,
  onChange,
}: {
  available: string[]
  selected: string[]
  onChange: (permissions: string[]) => void
}) {
  const allSelected = available.every((p) => selected.includes(p))

  const toggleAll = () => onChange(allSelected ? [] : [...available])
  const toggle = (permission: string) => {
    if (selected.includes(permission)) {
      onChange(selected.filter((p) => p !== permission))
    } else {
      onChange([...selected, permission])
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 border-b border-theme-strong pb-3">
        <input
          type="checkbox"
          id="select-all"
          checked={allSelected}
          onChange={toggleAll}
          className="h-4 w-4 rounded border-theme-strong bg-[var(--bg-elevated)]"
        />
        <label htmlFor="select-all" className="cursor-pointer text-sm font-medium text-[var(--fg)]">
          Select all permissions
        </label>
      </div>
      <div className="space-y-2">
        {available.map((permission) => {
          const info = permissionLabels[permission]
          return (
            <div key={permission} className="flex items-start gap-2.5">
              <input
                type="checkbox"
                id={`perm-${permission}`}
                checked={selected.includes(permission)}
                onChange={() => toggle(permission)}
                className="h-4 w-4 mt-0.5 rounded border-theme-strong bg-[var(--bg-elevated)]"
              />
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

function SubuserCard({
  subuser,
  availablePermissions,
  canManage,
  onEdit,
  onDelete,
}: {
  subuser: Subuser
  availablePermissions: string[]
  canManage: boolean
  onEdit: (userId: string, permissions: string[]) => void
  onDelete: (userId: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [editPerms, setEditPerms] = useState<string[]>([...subuser.permissions])
  const initial = (subuser.username || subuser.email).charAt(0).toUpperCase()

  return (
    <div className="group relative flex items-center gap-3 rounded-xl border border-theme-strong bg-[var(--bg-card)] px-1 py-1">
      <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[var(--bg)] text-[var(--fg-muted)] shadow-xs ring-1 ring-theme-strong">
        <span className="relative text-sm font-semibold">{initial}</span>
      </div>
      <div className="min-w-0 flex-1 pl-2">
        <p className="text-sm font-medium text-[var(--fg)]">{subuser.username}</p>
        <p className="text-xs text-[var(--fg-muted)]">{subuser.email}</p>
        <div className="mt-1 flex flex-wrap gap-1">
          {subuser.permissions.map((perm) => (
            <span key={perm} className="rounded-full bg-[var(--bg-elevated)] px-2 py-0.5 text-[11px] font-medium text-[var(--fg-muted)]">
              {permissionLabels[perm]?.label ?? perm}
            </span>
          ))}
        </div>
      </div>
      {canManage && (
        <div className="flex items-center gap-1 pr-2">
          <button
            onClick={() => { setEditPerms([...subuser.permissions]); setEditing(true) }}
            className="p-2 rounded-lg hover:bg-[var(--bg-elevated)] text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors"
            title="Edit permissions"
          >
            <HugeiconsIcon icon={PencilIcon} className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => { if (confirm(`Remove ${subuser.username} from this server?`)) onDelete(subuser.id) }}
            className="p-2 rounded-lg hover:bg-red-500/10 text-[var(--fg-muted)] hover:text-red-400 transition-colors"
            title="Remove user"
          >
            <HugeiconsIcon icon={DeleteIcon} className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Edit Permissions Dialog */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[var(--bg-card)] rounded-xl border border-theme-strong p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-[var(--fg)]">Edit {subuser.username}'s permissions</h3>
            <p className="text-sm text-[var(--fg-muted)] mt-1 mb-4">Choose what {subuser.username} can do on this server.</p>
            <PermissionCheckboxes available={availablePermissions} selected={editPerms} onChange={setEditPerms} />
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setEditing(false)} className="px-3 py-1.5 rounded-[8px] bg-[var(--bg-elevated)] text-[var(--fg)] text-xs font-medium border border-theme-strong">Cancel</button>
              <button onClick={() => { onEdit(subuser.id, editPerms); setEditing(false) }} className="px-3 py-1.5 rounded-[8px] bg-[var(--accent)] text-white text-xs font-medium">Save permissions</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ServerUsersPage() {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const [addOpen, setAddOpen] = useState(false)
  const [addEmail, setAddEmail] = useState('')
  const [addPerms, setAddPerms] = useState<string[]>([])

  const availablePermissions = Object.keys(permissionLabels)

  const { data: server } = useQuery({
    queryKey: queryKeys.servers.detail(id!),
    queryFn: () => getServer(id!),
    enabled: !!id,
  })

  const { data: subusers = [], isLoading } = useQuery({
    queryKey: queryKeys.servers.users(id!),
    queryFn: () => listSubusers(id!),
    enabled: !!id,
  })

  const addMutation = useMutation({
    mutationFn: ({ email, permissions }: { email: string; permissions: string[] }) => addSubuser(id!, email, permissions),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.servers.users(id!) })
      sileo.success({ description: 'User added', icon: false })
    },
    onError: () => sileo.error({ description: 'Failed to add user', icon: false }),
  })

  const updateMutation = useMutation({
    mutationFn: ({ subuserId, permissions }: { subuserId: string; permissions: string[] }) =>
      updateSubuserPermissions(id!, subuserId, permissions),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.servers.users(id!) })
      sileo.success({ description: 'Permissions updated', icon: false })
    },
    onError: () => sileo.error({ description: 'Failed to update permissions', icon: false }),
  })

  const removeMutation = useMutation({
    mutationFn: (subuserId: string) => removeSubuser(id!, subuserId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.servers.users(id!) })
      sileo.success({ description: 'User removed', icon: false })
    },
    onError: () => sileo.error({ description: 'Failed to remove user', icon: false }),
  })

  const canManage = !!server?.user_id

  return (
    <div className="px-1 py-6 space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-[var(--fg)]">Users</h2>
        <p className="text-sm text-[var(--fg-muted)]">Manage who has access to this server and what they can do.</p>
      </div>

      <div className="rounded-md bg-[var(--bg-elevated)] p-1">
        <div className="rounded-md border border-theme-strong bg-[var(--bg-card)] p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-[var(--fg)]">Subusers</h3>
              <p className="text-xs text-[var(--fg-muted)] mt-0.5">
                {canManage ? 'People you have given access to this server.' : "You're viewing this server's users."}
              </p>
            </div>
            {canManage && (
              <button
                onClick={() => { setAddPerms([...availablePermissions]); setAddOpen(true) }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--accent)] text-white text-xs font-medium hover:opacity-90 transition-opacity"
              >
                <HugeiconsIcon icon={AddIcon} className="h-4 w-4" />
                Add user
              </button>
            )}
          </div>

          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-sm text-[var(--fg-muted)]">Loading users...</p>
            </div>
          ) : subusers.length > 0 ? (
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {subusers.map((subuser: Subuser) => (
                <SubuserCard
                  key={subuser.id}
                  subuser={subuser}
                  availablePermissions={availablePermissions}
                  canManage={canManage}
                  onEdit={(uid, perms) => updateMutation.mutate({ subuserId: uid, permissions: perms })}
                  onDelete={(uid) => removeMutation.mutate(uid)}
                />
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-dashed border-theme-strong px-4 py-6 text-center">
              <p className="text-xs text-[var(--fg-muted)]">No users have been added to this server yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* Add User Dialog */}
      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[var(--bg-card)] rounded-xl border border-theme-strong p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-[var(--fg)]">Add user</h3>
            <p className="text-sm text-[var(--fg-muted)] mt-1 mb-4">
              Invite someone to this server by their email address. They must already have a panel account.
            </p>
            <form onSubmit={(e) => {
              e.preventDefault()
              addMutation.mutate({ email: addEmail, permissions: addPerms })
              setAddEmail('')
              setAddOpen(false)
            }}>
              <label className="text-xs font-medium text-[var(--fg-muted)] block mb-1.5">Email address</label>
              <Input
                type="email"
                value={addEmail}
                onChange={(e) => setAddEmail(e.target.value)}
                placeholder="user@example.com"
                required
                className="mb-4"
                autoFocus
              />
              <label className="text-xs font-medium text-[var(--fg-muted)] block mb-1.5">Permissions</label>
              <PermissionCheckboxes available={availablePermissions} selected={addPerms} onChange={setAddPerms} />
              <div className="flex justify-end gap-2 mt-6">
                <button type="button" onClick={() => { setAddOpen(false); setAddEmail('') }} className="px-3 py-1.5 rounded-[8px] bg-[var(--bg-elevated)] text-[var(--fg)] text-xs font-medium border border-theme-strong">Cancel</button>
                <button type="submit" disabled={addMutation.isPending} className="px-3 py-1.5 rounded-[8px] bg-[var(--accent)] text-white text-xs font-medium disabled:opacity-40">Add user</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
