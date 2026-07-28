import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { cn } from '../../utils/cn'

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
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [hovered, setHovered] = useState<string | null>(null)

  const close = () => setMobileOpen(false)

  return (
    <>
      {/* Mobile open toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-[var(--bg-card)] text-[var(--fg)] border border-[var(--border-strong)] shadow-lg flex items-center justify-center hover:bg-[var(--bg-elevated)] transition-all"
        aria-label="Open admin navigation"
      >
        <svg width="20" height="14" viewBox="0 0 20 14" fill="none">
          <path d="M1 1H19M1 7H19M1 13H19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>

      {/* Sidebar shell */}
      <aside
        className={cn(
          'w-64 shrink-0 flex flex-col h-full bg-black/40',
          'max-lg:fixed max-lg:inset-y-0 max-lg:left-0 max-lg:z-40 max-lg:transition-transform max-lg:duration-300 max-lg:ease-out',
          mobileOpen ? 'max-lg:translate-x-0' : 'max-lg:-translate-x-full',
        )}
      >
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between h-11 px-3">
          <h2 className="text-[13px] font-sans font-semibold text-[var(--fg)] tracking-tight">
            Administration
          </h2>
          <button
            onClick={close}
            className="lg:hidden w-7 h-7 rounded-lg flex items-center justify-center text-[#555] hover:text-[var(--fg)] hover:bg-white/[0.06] transition-all"
            aria-label="Close admin navigation"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 space-y-2.5" style={{ scrollbarWidth: 'thin', scrollbarColor: '#222 transparent' }}>
          <div className="space-y-1">
            <p className="text-[9px] font-sans font-medium text-[#555] uppercase tracking-widest px-1 pt-1">
              Menu
            </p>
            {links.map((link, i) => {
              const active =
                link.to === '/admin'
                  ? location.pathname === '/admin'
                  : location.pathname.startsWith(link.to)
              const isHovered = hovered === link.to
              const showChevron = active || isHovered

              return (
                <div
                  key={link.to}
                  className="relative"
                  style={{
                    animation: `slideUpFade 0.25s cubic-bezier(0.16, 1, 0.3, 1) ${i * 0.03}s forwards`,
                    opacity: 0,
                  }}
                >
                  <Link
                    to={link.to}
                    onClick={close}
                    onMouseEnter={() => setHovered(link.to)}
                    onMouseLeave={() => setHovered(null)}
                    className={cn(
                      'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-all duration-200',
                      active
                        ? 'bg-white/[0.1] scale-[1.02]'
                        : isHovered
                          ? 'bg-white/[0.08] scale-[1.02]'
                          : 'bg-white/[0.02] hover:bg-white/[0.05]',
                    )}
                  >
                    <span
                      className={cn(
                        'text-[12px] font-sans font-medium transition-colors flex-1 min-w-0 truncate',
                        active || isHovered ? 'text-[var(--fg)]' : 'text-[var(--fg-secondary)]',
                      )}
                    >
                      {link.label}
                    </span>

                    <div
                      className={cn(
                        'transition-all duration-200',
                        showChevron ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2',
                      )}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </div>
                  </Link>
                </div>
              )
            })}
          </div>
        </div>

        {/* Bottom actions */}
        <div className="shrink-0 px-3 py-2.5 space-y-1.5 border-t border-white/[0.06]">
          <button
            onClick={() => navigate('/')}
            className="w-full flex items-center justify-center gap-1.5 h-9 rounded-lg border border-dashed border-white/[0.1] text-[#888] hover:text-[var(--fg)] hover:border-white/[0.2] hover:bg-white/[0.06] transition-all font-sans text-[12px] font-medium"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              <path d="M9 22V12h6v10" />
            </svg>
            Back to panel
          </button>
        </div>
      </aside>

      {/* Backdrop for mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 lg:hidden"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={close}
        />
      )}
    </>
  )
}
