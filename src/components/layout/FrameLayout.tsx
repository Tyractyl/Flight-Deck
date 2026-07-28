import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { useBrandingStore } from '../../store/brandingStore';
import { useAdminSidebar } from '../admin/AdminSidebarContext';
import { HugeiconsIcon } from '@hugeicons/react';
import { CircleDollarSignIcon, UserIcon } from '@hugeicons/core-free-icons';
import { sileo } from 'sileo';
import api from '../../api/client';
import Avatar from 'boring-avatars';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

export function FrameLayout({ children }: { children?: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { theme, setTheme } = useThemeStore();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const mobileNavRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const { settings: branding, fetch: fetchBranding } = useBrandingStore();
  const [navHover, setNavHover] = useState({ left: 0, width: 0, opacity: 0 });
  const [dropdownHover, setDropdownHover] = useState({ top: 0, height: 0, opacity: 0, variant: 'default' });
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

  useEffect(() => {
    fetchBranding();
  }, [fetchBranding]);

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

  const handleDropdownItemHover = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const parent = el.closest('[data-slot="dropdown-menu-content"]');
    const variant = el.getAttribute('data-variant') || 'default';
    if (!parent) return;
    const parentRect = parent.getBoundingClientRect();
    const rect = el.getBoundingClientRect();
    setDropdownHover({
      top: rect.top - parentRect.top,
      height: rect.height,
      opacity: 1,
      variant,
    });
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
              className="group relative flex items-center gap-3 shrink-0 rounded-xl"
            >
            <div className="relative w-14 h-14">
              {/* Shape-following ring behind the logo */}
              {branding.logo_ring_enabled && (
                <div
                  className="absolute inset-0 z-0 opacity-0 transition-all duration-300 group-hover:opacity-100 pointer-events-none"
                  style={{
                    backgroundColor: branding.logo_ring_color || '#ffffff',
                    maskImage: `url('/2353329381.png')`,
                    maskSize: 'contain',
                    maskRepeat: 'no-repeat',
                    maskPosition: 'center',
                    WebkitMaskImage: `url('/2353329381.png')`,
                    WebkitMaskSize: 'contain',
                    WebkitMaskRepeat: 'no-repeat',
                    WebkitMaskPosition: 'center',
                    transform: 'scale(1.04)',
                  }}
                />
              )}
              <img
                src="/2353329381.png"
                className="w-14 h-14 object-contain relative z-10"
                alt="Tyractyl"
              />
            </div>
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
                  className="absolute right-0 top-full mt-2 bg-[var(--bg-card)] rounded-2xl border border-[var(--border-strong)] py-2 min-w-[160px] z-50 shadow-2xl"
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

            <div className="rounded-lg bg-linear-[180deg,#272727_0%,#232323_0.01%,#000_100%] flex items-center gap-2 pl-3 pr-1 h-9">
              <span className="font-sans text-sm font-medium text-[#D3D3D3]">
                {user?.coins ?? 0}
              </span>
              <HugeiconsIcon icon={CircleDollarSignIcon} className="w-4 h-4 text-[#D3D3D3]" />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="rounded-lg overflow-hidden flex items-center justify-center w-7 h-7 transition-all duration-200 active:scale-90 hover:ring-[3px] hover:ring-white/30"
                    aria-haspopup="menu"
                  >
                    <Avatar
                      size={28}
                      name={user?.username || 'user'}
                      variant="beam"
                      colors={['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981']}
                    />
                  </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  align="end"
                  className="w-[210px] bg-[var(--bg-card)] border-[var(--border-strong)] shadow-2xl p-1 relative"
                  onMouseLeave={() => setDropdownHover(p => ({ ...p, opacity: 0 }))}
                >
                  <div
                    className={`absolute left-1 right-1 rounded-md pointer-events-none z-0 ${
                      dropdownHover.variant === 'destructive'
                        ? 'bg-[var(--destructive)]/20'
                        : 'bg-[var(--accent)]/15'
                    }`}
                    style={{
                      top: `${dropdownHover.top}px`,
                      height: `${dropdownHover.height}px`,
                      opacity: dropdownHover.opacity,
                      transition: 'all 0.25s cubic-bezier(0.22, 1, 0.36, 1)',
                    }}
                  />

                  <DropdownMenuLabel className="px-3 py-2.5 relative z-10">
                    <p className="text-[var(--fg)] text-sm font-semibold truncate">
                      {user?.username}
                    </p>
                    <p className="text-[var(--fg-muted)] text-[11px] truncate mt-0.5 opacity-70">
                      {user?.email}
                    </p>
                  </DropdownMenuLabel>

                  <DropdownMenuSeparator className="bg-[var(--border-strong)] relative z-10" />

                  <DropdownMenuItem asChild onMouseEnter={handleDropdownItemHover}>
                    <Link to="/account" className="w-full cursor-pointer">Account</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild onMouseEnter={handleDropdownItemHover}>
                    <Link to="/afk" className="w-full cursor-pointer">AFK Farm</Link>
                  </DropdownMenuItem>
                  {user?.is_admin && (
                    <>
                      <DropdownMenuItem asChild onMouseEnter={handleDropdownItemHover}>
                        <Link to="/admin" className="w-full cursor-pointer">Admin</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild onMouseEnter={handleDropdownItemHover}>
                        <Link to="/admin/activity" className="w-full cursor-pointer">Activity Log</Link>
                      </DropdownMenuItem>
                    </>
                  )}

                  <DropdownMenuItem onClick={handleLogout} variant="destructive" className="cursor-pointer" onMouseEnter={handleDropdownItemHover}>
                    Logout
                  </DropdownMenuItem>

                  <div className="flex items-center gap-1 ml-2 mt-1 mb-1 relative z-10">
                    {(['light', 'dark', 'system'] as const).map((t) => (
                      <button
                        key={t}
                        onClick={(e) => {
                          e.stopPropagation();
                          setTheme(t);
                        }}
                        className={`relative p-1.5 flex items-center justify-center rounded-md transition-all duration-200 ${
                          theme === t
                            ? 'bg-[var(--bg-elevated)] text-[var(--fg)] shadow-sm border border-[var(--border)]'
                            : 'text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-black/5 dark:hover:bg-white/5'
                        }`}
                      >
                        {t === 'light' && (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>
                        )}
                        {t === 'dark' && (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
                        )}
                        {t === 'system' && (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/></svg>
                        )}
                      </button>
                    ))}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Main content — raw card shell with concave border gap. Children own the layout. */}
      <main className="flex-1 min-h-0 px-1.5 pb-1.5 sm:px-3 sm:pb-3 flex flex-col" aria-label="Main content area">
        <div className="bg-[var(--bg-card)] rounded-xl overflow-hidden flex-1 min-h-0 flex flex-col">
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
