import { useState, useRef, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { cn } from '../../utils/cn'
import { useAdminSidebar } from './AdminSidebarContext'

const links = [
  { to: '/admin', label: 'Dashboard' },
  { to: '/admin/users', label: 'Users' },
  { to: '/admin/servers', label: 'Servers' },
  { to: '/admin/nodes', label: 'Nodes' },
  { to: '/admin/cargo', label: 'Eggs' },
  { to: '/admin/coins', label: 'Coins' },
  { to: '/admin/activity', label: 'Activity' },
  { to: '/admin/locations', label: 'Locations' },
  { to: '/admin/branding', label: 'Branding' },
]

export function AdminSidebar() {
  const location = useLocation()
  const admin = useAdminSidebar()
  const navRef = useRef<HTMLElement>(null)
  const [navHover, setNavHover] = useState({ top: 0, height: 0, opacity: 0 })

  const close = () => admin?.setOpen(false)

  const isActive = (path: string) => {
    if (path === '/admin') return location.pathname === '/admin'
    return location.pathname.startsWith(path)
  }

  const snapToActive = () => {
    const activeLink = links.find((l) => isActive(l.to))
    if (!activeLink || !navRef.current) {
      setNavHover((prev) => ({ ...prev, opacity: 0 }))
      return
    }
    const el = navRef.current.querySelector(`[data-nav="${activeLink.to}"]`)
    if (!el) {
      setNavHover((prev) => ({ ...prev, opacity: 0 }))
      return
    }
    const navRect = navRef.current.getBoundingClientRect()
    const rect = el.getBoundingClientRect()
    setNavHover({
      top: rect.top - navRect.top,
      height: rect.height,
      opacity: 1,
    })
  }

  useEffect(() => {
    const timer = setTimeout(snapToActive, 300)
    return () => clearTimeout(timer)
  }, [location.pathname])

  const handleMouseEnter = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const nav = navRef.current
    if (!nav) return
    const rect = e.currentTarget.getBoundingClientRect()
    const navRect = nav.getBoundingClientRect()
    setNavHover({
      top: rect.top - navRect.top,
      height: rect.height,
      opacity: 1,
    })
  }

  return (
    <>
      <aside
        className={cn(
          'relative w-64 shrink-0 h-full flex flex-col',
          'bg-[var(--bg)]/80 backdrop-blur-md',
          'max-lg:fixed max-lg:inset-y-0 max-lg:left-0 max-lg:z-40 max-lg:transition-transform max-lg:duration-300 max-lg:ease-out',
          admin?.open ? 'max-lg:translate-x-0' : 'max-lg:-translate-x-full',
        )}
      >
        {/* Concave notches on the right edge */}
        <div
          className="absolute right-0 top-0 h-6 w-6 rounded-br-full bg-[var(--bg-card)]"
          aria-hidden="true"
        />
        <div
          className="absolute right-0 bottom-0 h-6 w-6 rounded-tr-full bg-[var(--bg-card)]"
          aria-hidden="true"
        />

        {/* Mobile close */}
        <div className="shrink-0 flex items-center justify-end h-11 px-3 lg:hidden">
          <button
            onClick={close}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[#555] hover:text-[var(--fg)] hover:bg-white/[0.06] transition-all"
            aria-label="Close admin navigation"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav
          ref={navRef}
          className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-3 relative"
          aria-label="Admin navigation"
          onMouseLeave={() => snapToActive()}
        >
          {/* Floating hover/active pill */}
          <div
            aria-hidden="true"
            className="absolute left-3 right-3 rounded-lg bg-[var(--fg)]/10 pointer-events-none"
            style={{
              top: `${navHover.top}px`,
              height: `${navHover.height}px`,
              opacity: navHover.opacity,
              transition: 'all 0.25s cubic-bezier(0.22, 1, 0.36, 1)',
            }}
          />

          <div className="relative space-y-0.5">
            {links.map((link) => {
              const active = isActive(link.to)
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  data-nav={link.to}
                  onClick={close}
                  onMouseEnter={handleMouseEnter}
                  className={cn(
                    'relative z-10 block px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                    active
                      ? 'text-[var(--fg)]'
                      : 'text-[var(--fg-muted)] hover:text-[var(--fg)]',
                  )}
                >
                  {link.label}
                </Link>
              )
            })}
          </div>
        </nav>
      </aside>

      {admin?.open && (
        <div
          className="fixed inset-0 z-30 lg:hidden"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={close}
        />
      )}
    </>
  )
}
