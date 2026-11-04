import { useOutletContext } from 'react-router-dom'
import ServerConsole from '../../components/server/ServerConsole'
import type { Server } from '../../types/server'

export type ServerContext = {
  server: Server
}

export default function ServerConsolePage() {
  const ctx = useOutletContext<ServerContext>()
  if (!ctx?.server) return null
  const server = ctx.server
  return (
    <div className="h-full min-h-0">
      <ServerConsole
      serverId={String(server.id)}
      server={{
        id: Number(server.id),
        name: server.name,
        status: server.status,
        memory_mib: server.memory_mb,
        disk_mib: server.disk_mb,
      }}
    />
    </div>
  )
}
