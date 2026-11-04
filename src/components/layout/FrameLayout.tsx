import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { useAdminSidebar } from '../admin/AdminSidebarContext';
import { HugeiconsIcon } from '@hugeicons/react';
import { CircleDollarSignIcon, UserIcon } from '@hugeicons/core-free-icons';
import { sileo } from 'sileo';
import api from '../../api/client';
import { AccountMenu } from '../modules/account-menu';

export function FrameLayout({ children }: { children?: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { theme, setTheme } = useThemeStore();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const mobileNavRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const [navHover, setNavHover] = useState({ left: 0, width: 0, opacity: 0 });
  const admin = useAdminSidebar();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (mobileNavRef.current && !mobileNavRef.current.contains(e.target as Node)) {
        setMobileNavOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const snapToActive = () => {
    const activeLink = navLinks.find(link => isActive(link.to));
    if (!activeLink || !navRef.current) {
      setNavHover(prev => ({ ...prev, opacity: 0 }));
      return;
    }
    const el = navRef.current.querySelector(`[data-nav="${activeLink.to}"]`);
    if (!el) {
      setNavHover(prev => ({ ...prev, opacity: 0 }));
      return;
    }
    const navRect = navRef.current.getBoundingClientRect();
    const rect = el.getBoundingClientRect();
    setNavHover({
      left: rect.left - navRect.left,
      width: rect.width,
      opacity: 1,
    });
  };

  useEffect(() => {
    const timer = setTimeout(snapToActive, 300);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
      logout();
      navigate('/auth');
    } catch {
      sileo.error({ description: 'Failed to logout', icon: false });
    }
  };

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const navLinks = [
    { to: '/servers', label: 'Servers' },
    { to: '/store', label: 'Store' },
    { to: '/tenants', label: 'Tenants' },
  ];

  return (
    <div className="bg-[var(--bg)] text-[var(--fg)] w-full h-screen flex flex-col overflow-hidden overscroll-none">
      {/* Header */}
      <header className="relative z-[100] h-16 px-5 flex items-center shrink-0 bg-[var(--bg)]/80 backdrop-blur-md" aria-label="Top navigation">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            {admin && (
              <button
                onClick={() => admin?.toggle()}
                className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/[0.06] transition-colors text-[var(--fg)]"
                aria-label="Toggle admin navigation"
              >
                <svg width="18" height="14" viewBox="0 0 18 14" fill="none">
                  <path d="M1 1H17M1 7H17M1 13H17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            )}
            <Link
              to="/"
              className="flex items-center shrink-0 rounded-xl"
              aria-label="Tyractyl home"
            >
              <img
                src="/2353329381.png"
                className="w-14 h-14 object-contain"
                alt="Tyractyl"
              />
            </Link>
        </div>

        {/* Center nav - desktop */}
          <nav
            ref={navRef}
            className="hidden sm:flex items-center gap-1 relative"
            aria-label="Primary navigation"
            onMouseLeave={() => snapToActive()}
          >
            <div
              aria-hidden="true"
              className="absolute inset-y-0 rounded-lg bg-[var(--fg)]/10 pointer-events-none"
              style={{
                left: `${navHover.left}px`,
                width: `${navHover.width}px`,
                opacity: navHover.opacity,
                transition: 'all 0.25s cubic-bezier(0.22, 1, 0.36, 1)',
              }}
            />
            {navLinks.map((link) => {
              const active = isActive(link.to);
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  data-nav={link.to}
                  onMouseEnter={(e) => {
                    const nav = navRef.current;
                    if (!nav) return;
                    const rect = e.currentTarget.getBoundingClientRect();
                    const navRect = nav.getBoundingClientRect();
                    setNavHover({
                      left: rect.left - navRect.left,
                      width: rect.width,
                      opacity: 1,
                    });
                  }}
                  className={`font-sans text-sm font-medium px-3 py-1.5 rounded-lg transition-all duration-200 ${
                    active
                      ? 'text-[var(--fg)]'
                      : 'text-[var(--fg-muted)] hover:text-[var(--fg)] hover:scale-105'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-4 shrink-0">
            <div ref={mobileNavRef} className="sm:hidden relative">
              <button
                onClick={() => setMobileNavOpen(!mobileNavOpen)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--bg-elevated)] transition-colors"
                aria-expanded={mobileNavOpen}
                aria-label="Toggle navigation"
              >
                <svg width="18" height="14" viewBox="0 0 18 14" fill="none" className="text-[var(--fg)]">
                  <path d="M1 1H17M1 7H17M1 13H17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
              {mobileNavOpen && (
                <div
                  className="absolute right-0 top-full mt-2 bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] py-2 min-w-[160px] z-50 shadow-2xl"
                  style={{
                    animation: 'dropdownIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                    transformOrigin: 'top right',
                  }}
                >
                  {navLinks.map((link) => (
                    <Link
                      key={link.to}
                      to={link.to}
                      onClick={() => setMobileNavOpen(false)}
                      className={`block px-4 py-2.5 text-sm transition-all duration-200 ${
                        isActive(link.to)
                          ? 'text-[var(--fg)] bg-[var(--fg)]/5'
                          : 'text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--fg)]/5'
                      }`}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-lg bg-linear-[180deg,#272727_0%,#232323_0.01%,#000_100%] flex items-center gap-2 pl-3 pr-[5px] h-9">
              <span className="font-sans text-sm font-medium text-[#D3D3D3]">
                {user?.coins ?? 0}
              </span>
              <HugeiconsIcon icon={CircleDollarSignIcon} className="w-4 h-4 text-[#D3D3D3]" />

              <AccountMenu
                name={user?.username || 'User'}
                email={user?.email || ''}
                isAdmin={user?.is_admin}
                onLogout={handleLogout}
                theme={theme}
                setTheme={setTheme}
                avatarUrl={user?.avatar_url}
                align="end"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main content — raw card shell with concave border gap. Children own the layout. */}
      <main className="flex-1 min-h-0 px-1.5 pb-1.5 sm:px-3 sm:pb-3 flex flex-col" aria-label="Main content area">
        <div id="app-content-card" className="relative bg-[var(--bg-card)] rounded-xl overflow-hidden flex-1 min-h-0 flex flex-col">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="h-10 px-5 flex items-center justify-between shrink-0 bg-[var(--bg)]/80 backdrop-blur-md" aria-label="Status bar">
        {user?.is_admin ? (
          <Link to="/admin" className="flex items-center gap-2 text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors">
            <HugeiconsIcon icon={UserIcon} size={14} />
            <span className="font-sans text-xs font-medium">Admin</span>
          </Link>
        ) : <span />}
        <Link to="/afk" className="flex items-center gap-2 text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors">
          <HugeiconsIcon icon={CircleDollarSignIcon} size={14} />
          <span className="font-sans text-xs font-medium">AFK Farm</span>
        </Link>
      </footer>
    </div>
  );
}
