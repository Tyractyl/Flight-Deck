import { useMemo, useState } from 'react'
import { useParams, Outlet, useLocation, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Home01Icon,
  Folder01Icon,
  DatabaseIcon,
  Archive01Icon,
  GlobeIcon,
  UserMultipleIcon,
  Rocket01Icon,
  Clock01Icon,
  Settings01Icon,
  Activity01Icon,
  PackageIcon,
  Copy01Icon,
  Tick02Icon,
  ServerStack01Icon,
} from '@hugeicons/core-free-icons'
import { getServer } from '../../api/servers'
import { queryKeys } from '../../api/queryKeys'
import { Spinner } from '../ui/Spinner'
import ServerStatusIndicator from './ServerStatusIndicator'
import Button from '../Button'
import { cn } from '../../lib/utils'

/*
 * ServerLayout — sidebar + content for a single server.
 *
 * The sidebar is transparent so it merges with the app-shell surface (it is
 * not a separate panel), and the content column owns the ServerConsole card.
 *
 * Desktop sidebar (>= lg):
 *   - 11 nav items (Home … Software)
 *   - server-ID pill with a copy-to-clipboard button
 * The brand logo and the Admin / AFK links live in the app shell, not here.
 *
 * Mobile collapses into a horizontal tab strip just under the FrameLayout header.
 */

type ServerNavTab = {
  label: string
  href: string
  icon: typeof Home01Icon
}

const NAV_ITEMS: ServerNavTab[] = [
  { label: 'Home', href: '/servers', icon: Home01Icon },
  { label: 'Files', href: 'files', icon: Folder01Icon },
  { label: 'Database', href: 'database', icon: DatabaseIcon },
  { label: 'Backups', href: 'backups', icon: Archive01Icon },
  { label: 'Networking', href: 'allocations', icon: GlobeIcon },
  { label: 'Users', href: 'users', icon: UserMultipleIcon },
  { label: 'Startup', href: 'startup', icon: Rocket01Icon },
  { label: 'Schedule', href: 'schedule', icon: Clock01Icon },
  { label: 'Settings', href: 'settings', icon: Settings01Icon },
  { label: 'Activity', href: 'activity', icon: Activity01Icon },
  { label: 'Software', href: 'software', icon: PackageIcon },
]

export default function ServerLayout() {
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const [copied, setCopied] = useState(false)

  const { data: server, isLoading } = useQuery({
    queryKey: queryKeys.servers.detail(id!),
    queryFn: () => getServer(id!),
    enabled: !!id,
  })

  const isTabActive = useMemo(() => {
    return (href: string) => {
      if (!id) return false
      if (href === '/servers') {
        return location.pathname === '/servers' || location.pathname === '/servers/'
      }
      const fullHref = `/servers/${id}/${href}`
      if (href === 'files') {
        return location.pathname === fullHref || location.pathname === `/servers/${id}/files/`
      }
      return location.pathname === fullHref
    }
  }, [id, location.pathname])

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner className="size-8 text-[var(--fg-muted)]" />
      </div>
    )
  }

  if (!server) return null

  const fullHref = (href: string) =>
    href === '/servers' ? href : `/servers/${id}/${href}`

  const serverId = server.id || id || ''

  const copyServerId = async () => {
    try {
      await navigator.clipboard.writeText(serverId)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col lg:flex-row overflow-hidden">
      {/* Desktop sidebar — transparent so it merges with the app shell */}
      <aside className="hidden lg:flex w-[200px] shrink-0 flex-col py-6 pr-3 overflow-y-auto">
        <nav className="flex flex-col gap-0.5 px-2">
          {NAV_ITEMS.map((tab) => {
            const active = isTabActive(tab.href)
            return (
              <Link
                key={tab.href}
                to={fullHref(tab.href)}
                className={cn(
                  'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-[15px] font-medium transition-colors',
                  active
                    ? 'bg-white/10 text-white'
                    : 'text-white/60 hover:bg-white/5 hover:text-white',
                )}
              >
                <HugeiconsIcon
                  icon={tab.icon}
                  className={cn(
                    'size-[18px] shrink-0 transition-colors',
                    active ? 'text-white' : 'text-white/55 group-hover:text-white',
                  )}
                />
                <span className="truncate">{tab.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="flex-1" />

        {/* Server ID pill — copy to join */}
        <div className="px-3 pt-4">
          <div className="flex items-center gap-2 rounded-lg bg-white/[0.04] py-1.5 pl-3 pr-1.5">
            <HugeiconsIcon icon={ServerStack01Icon} className="size-4 shrink-0 text-white/45" />
            <span className="min-w-0 flex-1 truncate font-mono text-[12px] font-medium text-white/85">
              {serverId}
            </span>
            <span aria-hidden className="h-4 w-px shrink-0 bg-white/10" />
            <Button
              variant="ghost"
              size="icon"
              className="size-[26px] rounded-md text-white/50 hover:bg-white/10 hover:text-white"
              onClick={() => void copyServerId()}
              aria-label="Copy server ID"
            >
              <HugeiconsIcon icon={copied ? Tick02Icon : Copy01Icon} className="size-[15px]" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Main column: connects directly to the app shell — the ServerConsole
          renders its own card inside. */}
      <div className="flex flex-1 min-h-0 min-w-0 flex-col">
        {/* Mobile: server header strip */}
        <div className="flex lg:hidden items-center gap-2 border-b border-white/5 px-4 py-2.5 shrink-0 bg-black/30">
          <Link
            to="/servers"
            className="shrink-0 text-[11px] text-white/55 hover:text-white transition-colors px-2 py-1 rounded-md hover:bg-white/5"
          >
            ← Servers
          </Link>
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <h1 className="truncate text-sm font-semibold text-white">{server.name}</h1>
            <ServerStatusIndicator status={server.status ?? 'STOPPED'} className="h-2 w-2" bare />
          </div>
        </div>

        <div className="flex lg:hidden items-center gap-1 overflow-x-auto border-b border-white/5 px-4 py-2 shrink-0 bg-black/30">
          {NAV_ITEMS.map((tab) => {
            const active = isTabActive(tab.href)
            return (
              <Link
                key={tab.href}
                to={fullHref(tab.href)}
                className={cn(
                  'shrink-0 rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors',
                  active
                    ? 'bg-white/10 text-white'
                    : 'text-white/55 hover:text-white hover:bg-white/5',
                )}
              >
                {tab.label}
              </Link>
            )
          })}
        </div>

        <div className="flex-1 min-h-0 overflow-auto">
          <Outlet context={{ server }} />
        </div>
      </div>
    </div>
  )
}
