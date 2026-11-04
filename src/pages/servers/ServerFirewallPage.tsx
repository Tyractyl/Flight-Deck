import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Button from '../../components/Button'
import Heading from '../../components/ui/Heading'
import { Spinner } from '../../components/ui/Spinner'
import { Card, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '../../components/ui/alert-dialog'
import type { ServerContext } from './ServerConsolePage'
import type { FirewallRule } from '../../types/server'

function RuleRow({ rule, serverId }: { rule: FirewallRule; serverId: string }) {
  const [deleting, setDeleting] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const queryClient = useQueryClient()

  const deleteRule = useMutation({
    mutationFn: async (ruleId: string) => { const res = await fetch(`/api/servers/${serverId}/firewall/${ruleId}`, { method: 'DELETE' }); if (!res.ok) throw new Error('Failed') },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['server', serverId, 'firewall'] }); setDeleting(false); setShowDelete(false) },
  })

  return (
    <>
      <div className="grid grid-cols-[4rem_5rem_1fr_auto] items-center gap-4 px-6 py-3 hover:bg-[var(--bg-elevated)]/30 transition-colors">
        <span className="text-sm font-medium text-[var(--fg)]">
          {rule.action === 'allow' ? 'Allow' : 'Deny'}
        </span>
        <span className="text-xs font-mono text-[var(--fg-muted)] uppercase">{rule.protocol || 'TCP'}</span>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-[var(--fg)]">{rule.ip}</span>
            <span className="text-[var(--fg-muted)]">:</span>
            <span className="text-sm font-medium text-[var(--fg)]">{rule.port}</span>
          </div>
          {rule.note && <p className="text-xs text-[var(--fg-muted)] mt-0.5 truncate">{rule.note}</p>}
        </div>
        <Button variant="danger" width="auto" height={28} onClick={() => setShowDelete(true)} disabled={deleting}>
          Delete
        </Button>
      </div>

      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete rule</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this firewall rule? Traffic matching this rule will no longer be filtered.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowDelete(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setDeleting(true); deleteRule.mutate(rule.id) }}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export default function ServerFirewallPage() {
  const { server } = useOutletContext<ServerContext>()

  const { data: rules, isLoading } = useQuery<FirewallRule[]>({
    queryKey: ['server', server.id, 'firewall'],
    queryFn: async () => { const res = await fetch(`/api/servers/${server.id}/firewall`); if (!res.ok) throw new Error('Failed'); return res.json() },
  })

  return (
    <div className="space-y-6">
      <Heading title="Firewall" description="Manage inbound and outbound firewall rules for this server." />

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Default policy</CardTitle>
          <CardDescription>All inbound and outbound connections are permitted unless a rule below blocks them.</CardDescription>
        </CardHeader>
      </Card>

      <Card className="overflow-hidden [&>[data-slot=card-inner]]:py-0">
        <div className="grid grid-cols-[4rem_5rem_1fr_auto] gap-4 px-6 py-2.5 text-xs font-medium text-[var(--fg-muted)] border-b border-[var(--border)]">
          <span>Action</span>
          <span>Protocol</span>
          <span>Rule</span>
          <span></span>
        </div>
        {isLoading ? (
          <div className="text-center py-12">
            <Spinner className="mx-auto size-5 text-[var(--fg-muted)]" />
            <p className="text-sm text-[var(--fg-muted)] mt-3">Loading rules...</p>
          </div>
        ) : rules && rules.length > 0 ? (
          <div className="divide-y divide-[var(--border)]">
            {rules.map((rule) => (
              <RuleRow key={rule.id} rule={rule} serverId={String(server.id)} />
            ))}
          </div>
        ) : (
          <div className="px-6 py-12 text-center">
            <p className="text-sm text-[var(--fg-muted)]">No rules — all traffic is allowed.</p>
          </div>
        )}
      </Card>
    </div>
  )
}
