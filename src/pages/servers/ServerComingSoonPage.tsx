import { useOutletContext } from 'react-router-dom'
import type { Server } from '../../types/server'
import type { LucideIcon } from 'lucide-react'

export type ServerContext = {
  server: Server
}

/*
 * Generic placeholder for server tabs that don't have a full implementation
 * yet (Database, Startup, Schedule, Activity, Software). Keeps the link
 * alive in the redesigned sidebar without breaking navigation.
 */
interface Props {
  title: string
  description: string
  icon: LucideIcon
}

export default function ServerComingSoonPage({ title, description, icon: Icon }: Props) {
  const ctx = useOutletContext<ServerContext>()
  if (!ctx?.server) return null
  const server = ctx.server
  return (
    <div className="flex h-full min-h-0 flex-col gap-5">
      <div>
        <h1 className="text-xl font-semibold text-white">{title}</h1>
        <p className="mt-1 text-sm text-white/55">{server.name}</p>
      </div>
      <div className="flex flex-1 min-h-[280px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-black/30 px-6 text-center">
        <div className="grid size-14 place-items-center rounded-full bg-white/5 ring-1 ring-white/10">
          <Icon className="h-6 w-6 text-white/55" strokeWidth={1.5} />
        </div>
        <p className="mt-4 text-sm font-medium text-white/85">{title}</p>
        <p className="mt-1 max-w-md text-xs text-white/45 leading-relaxed">{description}</p>
      </div>
    </div>
  )
}