import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../../api/queryKeys'
import { adminListUsers, adminDeleteUser, adminUpdateUser, adminModifyCoins } from '../../api/admin'
import { sileo } from 'sileo'
import { useState, useMemo } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { CrownIcon, DeleteIcon, PencilEdit01Icon } from '@hugeicons/core-free-icons'
import Avatar from 'boring-avatars'
import Button from '../../components/Button'
import type { User } from '../../types/server'
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

// ─── User Detail Dialog ───────────────────────────────────────────────────────

function UserDetailDialog({ user, open, onClose }: { user: User; open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [username, setUsername] = useState(user.username)
  const [email, setEmail] = useState(user.email)
  const [saving, setSaving] = useState(false)

  const updateMutation = useMutation({
    mutationFn: () => adminUpdateUser(user.id, { username, email }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.users })
      sileo.success({ description: 'User updated' })
    },
    onError: () => sileo.error({ description: 'Failed to update user' }),
  })

  const deleteMutation = useMutation({
    mutationFn: () => adminDeleteUser(user.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.users })
      sileo.success({ description: 'User deleted' })
      onClose()
    },
    onError: () => sileo.error({ description: 'Failed to delete user' }),
  })

  const adminToggleMutation = useMutation({
    mutationFn: () => adminUpdateUser(user.id, { is_admin: !user.is_admin }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.users })
      sileo.success({ description: user.is_admin ? 'Admin removed' : 'User made admin' })
    },
  })

  const coinsMutation = useMutation({
    mutationFn: ({ amount, type }: { amount: number; type: 'grant' | 'deduct' }) =>
      adminModifyCoins(user.id, amount, type),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.users })
      sileo.success({ description: 'Coins updated' })
    },
    onError: () => sileo.error({ description: 'Failed to update coins' }),
  })

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{user.username}</DialogTitle>
          <DialogDescription>{user.email}</DialogDescription>
        </DialogHeader>

        {/* Profile + Role */}
        <div className="space-y-1">
          {[
            { label: 'User ID', value: `#${user.id.slice(0, 8)}` },
            { label: 'Coins', value: user.coins?.toLocaleString() ?? '0' },
            { label: 'Joined', value: user.created_at ? new Date(user.created_at).toLocaleDateString() : '—' },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between rounded-md px-3 py-2.5">
              <span className="text-sm text-muted-foreground">{label}</span>
              <span className="text-sm font-medium">{value}</span>
            </div>
          ))}
        </div>

        {/* Admin toggle */}
        <div className="flex items-center justify-between rounded-lg border px-4 py-3">
          <div>
            <p className="text-sm font-medium">Administrator</p>
            <p className="text-xs text-muted-foreground">{user.is_admin ? 'Has full access' : 'Regular user'}</p>
          </div>
          <button
            onClick={() => adminToggleMutation.mutate()}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${user.is_admin ? 'bg-yellow-500' : 'bg-muted'}`}
          >
            <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${user.is_admin ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>

        {/* Edit profile */}
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Username</label>
            <Input value={username} onChange={(e) => setUsername(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Email</label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
          </div>
        </div>

        {/* Coin actions */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Modify Coins</label>
          <div className="flex flex-wrap gap-2">
            {[100, 500, 1000].map((n) => (
              <Button key={`grant-${n}`} variant="primary" width={70} height={28} onClick={() => coinsMutation.mutate({ amount: n, type: 'grant' })}>
                +{n}
              </Button>
            ))}
            <Button variant="secondary" width={60} height={28} onClick={() => coinsMutation.mutate({ amount: 100, type: 'deduct' })}>
              −100
            </Button>
            <Button variant="danger" width={60} height={28} onClick={() => coinsMutation.mutate({ amount: user.coins ?? 0, type: 'deduct' })}>
              Reset
            </Button>
          </div>
        </div>

        <DialogFooter className="justify-between">
          <Button
            variant="danger"
            width={90}
            height={34}
            onClick={() => {
              if (confirm(`Delete ${user.username}? This cannot be undone.`)) deleteMutation.mutate()
            }}
          >
            Delete
          </Button>
          <div className="flex gap-2">
            <Button variant="secondary" width={60} height={34} onClick={onClose}>Close</Button>
            <Button
              width={70}
              height={34}
              onClick={() => { setSaving(true); updateMutation.mutate(); setTimeout(() => setSaving(false), 600) }}
              loading={saving}
            >
              Save
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function AdminUsersPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.admin.users,
    queryFn: () => adminListUsers(500, 0),
  })

  const users = useMemo(() => {
    const list = Array.isArray(data?.users) ? data!.users : []
    if (!search) return list
    return list.filter(
      (u) =>
        u.username.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
    )
  }, [data, search])

  const columns: Column<User>[] = [
    {
      label: 'User',
      width: 'flex-1 min-w-0',
      render: (user) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-md overflow-hidden shrink-0">
            <Avatar size={36} name={user.username || 'user'} variant="beam" colors={['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981']} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-medium text-[var(--fg)] truncate">{user.username}</p>
              {user.is_admin && <HugeiconsIcon icon={CrownIcon} className="w-3.5 h-3.5 text-yellow-500 shrink-0" />}
            </div>
            <p className="text-xs text-[var(--fg-muted)] truncate">{user.email}</p>
          </div>
        </div>
      ),
    },
    {
      label: 'Role',
      width: 'w-24 text-center',
      render: (user) => (
        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${user.is_admin ? 'bg-yellow-500/10 text-yellow-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
          {user.is_admin ? 'Admin' : 'User'}
        </span>
      ),
    },
    {
      label: 'Coins',
      width: 'w-24 text-right',
      render: (user) => <span className="text-sm text-[var(--fg)]">{user.coins ?? 0}</span>,
    },
  ]

  return (
    <AdminLayout title="Users" description="Manage user accounts across the system.">
      <DataTable
        data={users}
        columns={columns}
        searchValue={search}
        onSearch={(v) => { setSearch(v); setPage(1) }}
        onRowClick={setSelectedUser}
        rowMenu={(user) => (
          <RowMenuButton>
            <RowMenuItem
              icon={<HugeiconsIcon icon={PencilEdit01Icon} className="h-4 w-4" />}
              label="View details"
              onClick={() => setSelectedUser(user)}
            />
            <RowMenuItem
              icon={<HugeiconsIcon icon={DeleteIcon} className="h-4 w-4" />}
              label="Delete"
              destructive
              onClick={() => setSelectedUser(user)}
            />
          </RowMenuButton>
        )}
        loading={isLoading}
        emptyMessage="No users found"
        entityName="user"
        pagination={{
          currentPage: page,
          totalPages: Math.max(1, Math.ceil(users.length / 20)),
          total: users.length,
          onPageChange: setPage,
        }}
      />

      {selectedUser && <UserDetailDialog user={selectedUser} open={selectedUser !== null} onClose={() => setSelectedUser(null)} />}
    </AdminLayout>
  )
}
