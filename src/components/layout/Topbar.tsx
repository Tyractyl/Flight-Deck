import { useState, useRef, useEffect } from 'react'
import { useLocation, Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { sileo } from 'sileo'
import api from '../../api/client'
import { useQuery } from '@tanstack/react-query'
import { getBalance } from '../../api/coins'
import { queryKeys } from '../../api/queryKeys'

export function Topbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const { data: balanceData } = useQuery({
    queryKey: queryKeys.coins.balance,
    queryFn: getBalance,
  })

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout')
      logout()
      navigate('/auth')
    } catch {
      sileo.error({ description: 'Failed to logout', icon: false })
    }
  }

  return (
    <header className="relative bg-black" style={{ width: '678px', height: '49px' }}>
      {/* Logo - 50x50 at left-7 top-1 */}
      <Link to="/" className="absolute" style={{ left: '7px', top: '4px', width: '50px', height: '50px' }}>
        <div className="w-full h-full flex items-center justify-center">
          <span className="text-[var(--fg)] font-sans font-bold text-lg">T</span>
        </div>
      </Link>

      {/* Servers - left-[289px] top-[19px] */}
      <Link
        to="/servers"
        className="absolute font-sans text-[11px] font-medium"
        style={{
          left: '289px',
          top: '19px',
          color: location.pathname.startsWith('/servers') ? '#cecece' : '#555',
        }}
      >
        Servers
      </Link>

      {/* Store - left-[357px] top-5 */}
      <Link
        to="/store"
        className="absolute font-sans text-[11px] font-medium"
        style={{
          left: '357px',
          top: '20px',
          color: location.pathname.startsWith('/store') ? '#cecece' : '#555',
        }}
      >
        Store
      </Link>

      {/* Settings icon - left-[560px] top-4, 17x17 */}
      <button
        className="absolute hover:opacity-80 transition-opacity"
        style={{ left: '560px', top: '16px', width: '17px', height: '17px' }}
        title="Settings"
      >
        <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
          <path d="M8.5 1.5C5.5 1.5 3.5 4 3.5 6.5V9.5L2 11.5H15L13.5 9.5V6.5C13.5 4 11.5 1.5 8.5 1.5Z" stroke="white" strokeWidth="1" strokeLinejoin="round"/>
          <path d="M7 12.5C7 13.3 7.7 14 8.5 14C9.3 14 10 13.3 10 12.5" stroke="white" strokeWidth="1" strokeLinecap="round"/>
        </svg>
      </button>

      {/* Coin count - left-[595px] top-[17px] */}
      <span
        className="absolute font-sans text-xs font-medium"
        style={{ left: '595px', top: '17px', color: '#d3d3d3' }}
      >
        {balanceData?.balance ?? 0}
      </span>

      {/* Coin icon - left-[622px] top-[18px], 13x13 */}
      <div
        className="absolute"
        style={{ left: '622px', top: '18px', width: '13px', height: '13px' }}
      >
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
          <circle cx="6.5" cy="6.5" r="5.5" stroke="#d3d3d3" strokeWidth="1"/>
          <text x="6.5" y="9" textAnchor="middle" fill="#d3d3d3" fontSize="8">$</text>
        </svg>
      </div>

      {/* Avatar - left-[642px] top-[9px], 29x29 */}
      <div ref={menuRef} className="absolute" style={{ left: '642px', top: '9px' }}>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="rounded-[7px] bg-[var(--bg-card)] flex items-center justify-center text-[var(--fg-secondary)] hover:text-[var(--fg)] transition-colors overflow-hidden"
          style={{ width: '29px', height: '29px' }}
        >
          {user?.avatar_url ? (
            <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : user?.username ? (
            <span className="font-sans text-sm font-medium">
              {user.username[0]?.toUpperCase()}
            </span>
          ) : (
            <span className="font-sans text-sm font-medium">?</span>
          )}
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-full mt-1 bg-[var(--bg-card)] rounded-lg border border-theme-strong py-1 min-w-[140px] z-50 shadow-lg">
            <div className="px-3 py-2 border-b border-theme-strong">
              <p className="text-[var(--fg)] text-xs font-medium truncate">{user?.username}</p>
              <p className="text-[#888] text-[10px] truncate">{user?.email}</p>
            </div>
            <Link
              to="/account"
              onClick={() => setMenuOpen(false)}
              className="block px-3 py-2 text-[#ccc] text-xs hover:bg-[#2a2a2a] transition-colors"
            >
              Account
            </Link>
            <Link
              to="/afk"
              onClick={() => setMenuOpen(false)}
              className="block px-3 py-2 text-[#ccc] text-xs hover:bg-[#2a2a2a] transition-colors"
            >
              AFK Farm
            </Link>
            {user?.is_admin && (
              <Link
                to="/admin"
                onClick={() => setMenuOpen(false)}
                className="block px-3 py-2 text-[#ccc] text-xs hover:bg-[#2a2a2a] transition-colors"
              >
                Admin
              </Link>
            )}
            <button
              onClick={handleLogout}
              className="block w-full text-left px-3 py-2 text-[#ff6b6b] text-xs hover:bg-[#2a2a2a] transition-colors"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
