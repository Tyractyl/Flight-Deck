import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listTenants, createTenant, deleteTenant, listTenantMembers, removeTenantMember } from '../../api/tenants'

import Button from '../../components/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { Modal } from '../../components/ui/Modal'
import { Input } from '../../components/ui/Input'
import { Skeleton } from 'parthenon-ui/components'
import { sileo } from 'sileo'
import { useAuthStore } from '../../store/authStore'

export default function TenantsPage() {
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newTenantName, setNewTenantName] = useState('')
  const [selectedTenant, setSelectedTenant] = useState<string | null>(null)

  const { data: tenants, isLoading } = useQuery({
    queryKey: ['tenants'],
    queryFn: listTenants,
  })

  const { data: members } = useQuery({
    queryKey: ['tenants', selectedTenant, 'members'],
    queryFn: () => listTenantMembers(selectedTenant!),
    enabled: !!selectedTenant,
  })

  const createMutation = useMutation({
    mutationFn: (name: string) => createTenant(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] })
      setShowCreateModal(false)
      setNewTenantName('')
      sileo.success({ description: 'Tenant created', icon: false })
    },
    onError: () => sileo.error({ description: 'Failed to create tenant', icon: false }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteTenant(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] })
      setSelectedTenant(null)
      sileo.success({ description: 'Tenant deleted', icon: false })
    },
    onError: () => sileo.error({ description: 'Failed to delete tenant', icon: false }),
  })

  const removeMemberMutation = useMutation({
    mutationFn: ({ tenantId, userId }: { tenantId: string; userId: string }) =>
      removeTenantMember(tenantId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants', selectedTenant, 'members'] })
      sileo.success({ description: 'Member removed', icon: false })
    },
    onError: () => sileo.error({ description: 'Failed to remove member', icon: false }),
  })

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-[var(--fg)]">Tenants</h1>
        <Button width={130} height={36} onClick={() => setShowCreateModal(true)}>
          Create Tenant
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : !Array.isArray(tenants) || tenants.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-[var(--fg-muted)] mb-4">No tenants yet</p>
            <Button width={150} height={36} onClick={() => setShowCreateModal(true)}>
              Create your first tenant
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tenants.map((tenant) => (
            <Card
              key={tenant.id}
              className={`cursor-pointer transition-colors hover:bg-[var(--bg-card-hover)] ${
                selectedTenant === tenant.id ? 'ring-2 ring-[var(--accent)]' : ''
              }`}
            >
              <CardContent onClick={() => setSelectedTenant(tenant.id)}>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-[var(--fg)]">{tenant.name}</h3>
                    <p className="text-sm text-[var(--fg-muted)] mt-1">
                      {tenant.member_count || 1} member{(tenant.member_count || 1) !== 1 ? 's' : ''}
                    </p>
                    <p className="text-xs text-[var(--fg-faint)] mt-2">
                      Created {new Date(tenant.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  {tenant.owner_id === user?.id && (
                    <span className="text-xs px-2 py-1 rounded-full bg-[var(--accent)]/10 text-[var(--accent)]">
                      Owner
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedTenant && Array.isArray(members) && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Members</CardTitle>
              {tenants?.find((t) => t.id === selectedTenant)?.owner_id === user?.id && (
                <Button
                  width={80}
                  height={28}
                  onClick={() => deleteMutation.mutate(selectedTenant)}
                  className="text-[var(--destructive)]"
                >
                  Delete
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {members.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-input)]">
                  <div>
                    <p className="text-sm font-medium text-[var(--fg)]">{member.username || member.email}</p>
                    <p className="text-xs text-[var(--fg-muted)]">{member.role}</p>
                  </div>
                  {member.role !== 'owner' && (
                    <Button
                      width={60}
                      height={28}
                      onClick={() => removeMemberMutation.mutate({ tenantId: selectedTenant, userId: member.user_id })}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Modal open={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create Tenant">
        <div className="space-y-4">
          <div>
            <label className="text-xs text-[var(--fg-muted)] block mb-1">Tenant Name</label>
            <Input
              value={newTenantName}
              onChange={(e) => setNewTenantName(e.target.value)}
              placeholder="My Tenant"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button width={80} height={36} onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button
              width={100}
              height={36}
              onClick={() => createMutation.mutate(newTenantName)}
              disabled={!newTenantName.trim() || createMutation.isPending}
            >
              {createMutation.isPending ? 'Creating...' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
