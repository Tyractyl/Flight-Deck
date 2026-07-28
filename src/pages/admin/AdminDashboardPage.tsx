import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '../../api/queryKeys'
import { adminListUsers, adminListServers, adminListNodes } from '../../api/admin'
import { Skeleton } from 'parthenon-ui/components'
import { HugeiconsIcon } from '@hugeicons/react'
import { CpuIcon, ComputerIcon, UserIcon, PlayIcon } from '@hugeicons/core-free-icons'
import { AdminLayout } from '../../components/admin/AdminLayout'
import { Card, CardHeader, CardContent, CardTitle } from '../../components/ui/Card'
import type { Server, Node } from '../../types/server'

export default function AdminDashboardPage() {
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: queryKeys.admin.users,
    queryFn: () => adminListUsers(1, 0),
  })

  const { data: serversData, isLoading: serversLoading } = useQuery({
    queryKey: queryKeys.admin.servers,
    queryFn: () => adminListServers(500, 0),
  })

  const { data: nodes, isLoading: nodesLoading } = useQuery({
    queryKey: queryKeys.admin.nodes,
    queryFn: adminListNodes,
  })

  const servers: Server[] = serversData?.servers ?? []
  const nodeList: Node[] = Array.isArray(nodes) ? nodes : []

  const running = servers.filter((s) => s.status.toLowerCase() === 'running').length
  const stopped = servers.filter((s) => ['stopped', 'offline'].includes(s.status.toLowerCase())).length
  const installing = servers.filter((s) => s.status.toLowerCase() === 'installing').length
  const onlineNodes = nodeList.filter((n) => n.is_online).length

  const loading = usersLoading || serversLoading || nodesLoading

  return (
    <AdminLayout title="Dashboard" description="System overview and health.">
      <div className="space-y-4">
        {/* Key metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Users', value: usersData?.total, icon: UserIcon },
            { label: 'Servers', value: servers.length, icon: ComputerIcon },
            { label: 'Running', value: running, icon: PlayIcon },
            { label: 'Online Nodes', value: `${onlineNodes}/${nodeList.length}`, icon: CpuIcon },
          ].map((m) => (
            <Card key={m.label}>
              <CardContent className="space-y-1">
                <div className="flex items-center gap-2">
                  <HugeiconsIcon icon={m.icon} className="w-3.5 h-3.5 text-[var(--fg-muted)]" />
                  <span className="text-[var(--fg-muted)] font-sans text-xs">{m.label}</span>
                </div>
                {loading ? (
                  <Skeleton className="h-7 w-12" />
                ) : (
                  <p className="text-[var(--fg)] font-sans text-2xl font-semibold">{m.value}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Server status + Node health */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Server Status</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ) : servers.length === 0 ? (
                <p className="text-[var(--fg-muted)] font-sans text-sm">No servers yet.</p>
              ) : (
                <div className="space-y-3">
                  {[
                    { label: 'Running', count: running, color: 'bg-emerald-500' },
                    { label: 'Stopped', count: stopped, color: 'bg-neutral-500' },
                    { label: 'Installing', count: installing, color: 'bg-blue-500' },
                  ].map((s) => (
                    <div key={s.label} className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${s.color}`} />
                      <span className="text-[var(--fg)] font-sans text-sm flex-1">{s.label}</span>
                      <span className="text-[var(--fg-muted)] font-sans text-sm">{s.count}</span>
                      <div className="w-24 h-1.5 rounded-full bg-white/5 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${s.color} transition-all duration-500`}
                          style={{ width: `${(s.count / servers.length) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Node Health</CardTitle>
            </CardHeader>
            <CardContent>
              {nodesLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ) : nodeList.length === 0 ? (
                <p className="text-[var(--fg-muted)] font-sans text-sm">No nodes configured.</p>
              ) : (
                <div className="space-y-2">
                  {nodeList.map((n) => (
                    <div key={n.id} className="flex items-center gap-3 py-1">
                      <div className={`w-2 h-2 rounded-full ${n.is_online ? 'bg-emerald-500' : 'bg-red-500'}`} />
                      <span className="text-[var(--fg)] font-sans text-sm flex-1 truncate">{n.name}</span>
                      <span className="text-[var(--fg-muted)] font-sans text-xs">
                        {n.total_memory}MB · {n.total_disk}MB
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}
