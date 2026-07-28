import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '../../api/queryKeys'
import { adminListUsers, adminListServers, adminListNodes } from '../../api/admin'
import { Skeleton } from 'parthenon-ui/components'
import { CpuIcon, UserIcon, PlayIcon, McpServerIcon, HardDriveIcon } from '@hugeicons/core-free-icons'
import { AdminLayout } from '../../components/admin/AdminLayout'
import { StatCard } from '../../components/dashboard/StatCard'
import { SimpleBarChart } from '../../components/dashboard/SimpleBarChart'
import { RingChart } from '../../components/dashboard/RingChart'
import { Gauge } from '../../components/dashboard/Gauge'
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
  const totalMemory = servers.reduce((sum, s) => sum + s.memory_mb, 0)
  const totalDisk = servers.reduce((sum, s) => sum + s.disk_mb, 0)

  const loading = usersLoading || serversLoading || nodesLoading

  const statusRing = [
    { name: 'Running', value: running },
    { name: 'Stopped', value: stopped },
    { name: 'Installing', value: installing },
  ].filter((d) => d.value > 0)

  const nodeBarData = nodeList.map((n) => ({
    name: n.name,
    memory: n.total_memory,
  }))

  return (
    <AdminLayout title="Dashboard" description="System overview and health.">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {loading ? (
            <>
              <Skeleton className="h-28 rounded-xl" />
              <Skeleton className="h-28 rounded-xl" />
              <Skeleton className="h-28 rounded-xl" />
              <Skeleton className="h-28 rounded-xl" />
            </>
          ) : (
            <>
              <StatCard title="Users" value={usersData?.total ?? 0} icon={UserIcon} />
              <StatCard title="Servers" value={servers.length} icon={McpServerIcon} />
              <StatCard title="Running" value={running} icon={PlayIcon} />
              <StatCard title="Online Nodes" value={`${onlineNodes}/${nodeList.length}`} icon={CpuIcon} />
            </>
          )}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {loading ? (
            <>
              <Skeleton className="h-80 rounded-xl lg:col-span-2" />
              <Skeleton className="h-80 rounded-xl" />
            </>
          ) : (
            <>
              <SimpleBarChart
                title="Node Memory (MB)"
                data={nodeBarData}
                dataKey="memory"
                xDataKey="name"
                className="lg:col-span-2"
              />
              <div className="space-y-4">
                <RingChart title="Server Status" data={statusRing} />
                <Gauge title="Node Uptime" value={nodeList.length ? Math.round((onlineNodes / nodeList.length) * 100) : 0} label={`${onlineNodes} of ${nodeList.length} online`} />
              </div>
            </>
          )}
        </div>

        {/* Resource summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <StatCard title="Total Memory" value={`${totalMemory} MB`} icon={CpuIcon} />
          <StatCard title="Total Disk" value={`${totalDisk} MB`} icon={HardDriveIcon} />
        </div>
      </div>
    </AdminLayout>
  )
}
