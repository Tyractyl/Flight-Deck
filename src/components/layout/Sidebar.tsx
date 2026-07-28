import { Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { cn } from '../../utils/cn'

const navItems = [
  { label: 'Home', path: '/', icon: '🏠' },
  { label: 'Servers', path: '/servers', icon: '🖥️' },
  { label: 'Store', path: '/store', icon: '🛒' },
  { label: 'AFK', path: '/afk', icon: '⏰' },
]

const adminItems = [
  { label: 'Admin', path: '/admin', icon: '⚙️' },
]

export function Sidebar() {
  const location = useLocation()
  const user = useAuthStore((s) => s.user)

  return (
    <aside className="flex flex-col w-[120px] h-screen bg-[var(--bg-input)] border-r border-theme">
      <div className="flex items-center justify-center py-4">
        <div className="w-[50px] h-[50px] rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
          <span className="text-[var(--fg)] font-bold text-lg">T</span>
        </div>
      </div>

      <nav className="flex-1 px-2 py-4 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              'flex flex-col items-center gap-1 px-2 py-3 rounded-lg text-[10px] font-sans transition-colors',
              location.pathname === item.path
                ? 'bg-white/10 text-[var(--fg)]'
                : 'text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-white/5'
            )}
          >
            <span className="text-sm">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="px-2 pb-4 space-y-1">
        {user?.is_admin && adminItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              'flex flex-col items-center gap-1 px-2 py-3 rounded-lg text-[10px] font-sans transition-colors',
              location.pathname.startsWith(item.path)
                ? 'bg-white/10 text-[var(--fg)]'
                : 'text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-white/5'
            )}
          >
            <span className="text-sm">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </div>
    </aside>
  )
}
