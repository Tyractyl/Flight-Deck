import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import Button from '../../components/Button'
import Heading from '../../components/ui/Heading'
import { Input } from '../../components/ui/Input'
import { Label } from '../../components/ui/Label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '../../components/ui/alert-dialog'
import type { ServerContext } from './ServerConsolePage'

export default function ServerSettingsPage() {
  const { server } = useOutletContext<ServerContext>()
  const [serverName, setServerName] = useState(server.name)
  const [saving, setSaving] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const queryClient = useQueryClient()

  const updateServer = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/servers/${server.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: serverName }),
      })
      if (!res.ok) throw new Error('Failed to update server')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servers'] })
      queryClient.invalidateQueries({ queryKey: ['server', server.id] })
      setSaving(false)
    },
  })

  const deleteServer = useMutation({
    mutationFn: async () => { const res = await fetch(`/api/servers/${server.id}`, { method: 'DELETE' }); if (!res.ok) throw new Error('Failed to delete server') },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['servers'] }); window.location.href = '/servers' },
  })

  return (
    <div className="space-y-6 max-w-2xl">
      <Heading title="Settings" description="Manage this server's general details and runtime startup configuration." />

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">General</CardTitle>
          <CardDescription>Change your server&apos;s name.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="server-name">Server name</Label>
            <Input id="server-name" value={serverName} onChange={(e) => setServerName(e.target.value)} />
          </div>
          <Button
            onClick={() => { setSaving(true); updateServer.mutate() }}
            loading={saving}
            disabled={saving || serverName === server.name}
          >
            Save changes
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Danger zone</CardTitle>
          <CardDescription>Permanently delete this server and all of its data.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="danger" width="auto" height={32} onClick={() => setShowDelete(true)}>
            Delete server
          </Button>
        </CardContent>
      </Card>

      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {server.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this server and all of its data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowDelete(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteServer.mutate()}>Delete server</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
