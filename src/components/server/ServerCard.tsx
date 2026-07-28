import { useState } from 'react'
import { Play, Square, RotateCw, Copy, Check } from 'lucide-react'
import type { Server, ServerStatus } from '../../types/server'
import { formatBytes } from '../../utils/formatBytes'

const statusGradients: Record<ServerStatus, string> = {
  RUNNING: 'linear-gradient(180deg, #4bda04 0%, #287402 100%)',
  STOPPED: 'linear-gradient(180deg, #d4351d 21.15%, #6e1c0f 100%)',
  STARTING: 'linear-gradient(180deg, #e66e11 37.5%, #803d0a 100%)',
  STOPPING: 'linear-gradient(180deg, #e66e11 37.5%, #803d0a 100%)',
  ERROR: 'linear-gradient(180deg, #d4351d 21.15%, #6e1c0f 100%)',
  INSTALLING: 'linear-gradient(180deg, #3b82f6 0%, #1e40af 100%)',
}

function StorageIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect x="2" y="2" width="16" height="7" rx="2" stroke="#b1b2ae" strokeWidth="1.2"/>
      <rect x="2" y="11" width="16" height="7" rx="2" stroke="#b1b2ae" strokeWidth="1.2"/>
      <circle cx="6.5" cy="5.5" r="1.3" fill="#b1b2ae"/>
      <circle cx="6.5" cy="14.5" r="1.3" fill="#b1b2ae"/>
    </svg>
  )
}

function CpuIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect x="4" y="4" width="12" height="12" rx="2" stroke="#b1b2ae" strokeWidth="1.2"/>
      <rect x="7" y="7" width="6" height="6" rx="1" fill="#b1b2ae"/>
      <path d="M7 2V4.5M13 2V4.5M7 15.5V18M13 15.5V18M2 7H4.5M2 13H4.5M15.5 7H18M15.5 13H18" stroke="#b1b2ae" strokeWidth="1"/>
    </svg>
  )
}

function RamIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <rect x="2" y="7" width="18" height="11" rx="2.5" stroke="#b1b2ae" strokeWidth="1.2"/>
      <rect x="5" y="3" width="3" height="5" rx="1" stroke="#b1b2ae" strokeWidth="1"/>
      <rect x="9.5" y="3" width="3" height="5" rx="1" stroke="#b1b2ae" strokeWidth="1"/>
      <rect x="14" y="3" width="3" height="5" rx="1" stroke="#b1b2ae" strokeWidth="1"/>
      <path d="M5 14H8.5M13.5 14H17" stroke="#b1b2ae" strokeWidth="0.9"/>
    </svg>
  )
}

function GlobeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6" stroke="white" strokeWidth="1"/>
      <ellipse cx="8" cy="8" rx="3" ry="6" stroke="white" strokeWidth="1"/>
      <path d="M2 8H14M3 5H13M3 11H13" stroke="white" strokeWidth="0.8"/>
    </svg>
  )
}

interface ServerCardProps {
  server: Server
  onClick: () => void
  onStart?: (e: React.MouseEvent) => void
  onStop?: (e: React.MouseEvent) => void
  onRestart?: (e: React.MouseEvent) => void
}

const darkGradient = 'linear-gradient(180deg, rgba(39,39,39,0.7) 0%, rgba(35,35,35,0.7) 0.01%, rgba(0,0,0,0.7) 100%)'

export function ServerCard({ server, onClick, onStart, onStop, onRestart }: ServerCardProps) {
  const [copied, setCopied] = useState(false)

  const primaryAlloc = server.port_bindings?.[0]
  const ipDisplay = primaryAlloc
    ? `0.0.0.0:${primaryAlloc.host_port}`
    : null

  const copyIp = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!ipDisplay) return
    navigator.clipboard.writeText(ipDisplay)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <button
      onClick={onClick}
      className="relative text-left group"
      style={{ width: '340px', height: '200px' }}
      aria-label={server.name}
    >
      {/* Background */}
      <div
        className="absolute inset-0 bg-[#3b3b3b]"
        style={{ borderRadius: '14px' }}
      />

      {/* Hover state */}
      <div
        className="absolute inset-0 bg-[#313131] group-hover:bg-[#363636] transition-colors"
        style={{ borderRadius: '14px' }}
      />

      {/* Inner content area */}
      <div
        className="absolute bg-[#3c3c3c] group-hover:bg-[#424242] transition-colors"
        style={{
          left: '5px',
          top: '48px',
          right: '5px',
          bottom: '5px',
          borderRadius: '12px',
        }}
      />

      {/* Server name */}
      <h2
        className="absolute font-sans font-normal text-[var(--fg)] text-lg leading-normal whitespace-nowrap truncate"
        style={{ left: '16px', top: '10px', maxWidth: '260px' }}
      >
        {server.name}
      </h2>

      {/* Host address bar */}
      <div
        className="absolute flex items-center gap-2 px-3"
        style={{
          left: '16px',
          top: '56px',
          width: '190px',
          height: '32px',
          background: darkGradient,
          borderRadius: '8px',
        }}
        onClick={copyIp}
        title="Click to copy IP"
      >
        <GlobeIcon />
        <div className="w-px h-5 bg-[#4c4c4c] rounded-[1px]" />
        {ipDisplay ? (
          <span className="font-sans font-medium text-[var(--fg)] text-xs leading-normal whitespace-nowrap truncate">
            {ipDisplay}
          </span>
        ) : (
          <span className="font-sans font-medium text-[var(--fg-muted)] text-xs leading-normal">
            No allocation
          </span>
        )}
        {ipDisplay && (
          copied ? (
            <Check size={12} className="text-green-400 ml-auto shrink-0" />
          ) : (
            <Copy size={12} className="text-[var(--fg-faint)] ml-auto shrink-0" />
          )
        )}
      </div>

      {/* Status indicator */}
      <div
        className="absolute"
        style={{
          left: '300px',
          top: '56px',
          width: '28px',
          height: '28px',
          background: statusGradients[server.status],
          borderRadius: '8px',
        }}
        aria-hidden="true"
      />

      {/* Disk */}
      <div className="absolute flex items-center gap-2" style={{ left: '18px', top: '128px' }}>
        <StorageIcon />
        <span className="font-sans font-medium text-[#b1b2ae] text-sm">
          {formatBytes(server.disk_mb)}
        </span>
      </div>

      {/* CPU */}
      <div className="absolute flex items-center gap-2" style={{ left: '18px', top: '154px' }}>
        <CpuIcon />
        <span className="font-sans font-medium text-[#b1b2ae] text-sm">
          {server.cpu_percent}%
        </span>
      </div>

      {/* RAM */}
      <div className="absolute flex items-center gap-2" style={{ left: '16px', top: '178px' }}>
        <RamIcon />
        <span className="font-sans font-medium text-[#b1b2ae] text-sm">
          {formatBytes(server.memory_mb)}
        </span>
      </div>

      {/* Action buttons */}
      <div
        className="absolute flex items-center gap-1.5 px-2"
        style={{
          left: '190px',
          top: '154px',
          width: '136px',
          height: '38px',
          background: darkGradient,
          borderRadius: '8px',
        }}
      >
        {server.status === 'STOPPED' ? (
          onStart && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onStart(e) }}
              className="w-[30px] h-[30px] flex items-center justify-center rounded-md hover:bg-white/10 transition-colors"
              aria-label={`Start ${server.name}`}
            >
              <Play size={16} className="text-[var(--fg)] ml-0.5" />
            </button>
          )
        ) : (
          <>
            {onStop && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onStop(e) }}
                className="w-[30px] h-[30px] flex items-center justify-center rounded-md hover:bg-white/10 transition-colors"
                aria-label={`Stop ${server.name}`}
              >
                <Square size={14} className="text-[var(--fg)]" />
              </button>
            )}
            {onRestart && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onRestart(e) }}
                className="w-[30px] h-[30px] flex items-center justify-center rounded-md hover:bg-white/10 transition-colors"
                aria-label={`Restart ${server.name}`}
              >
                <RotateCw size={14} className="text-[var(--fg)]" />
              </button>
            )}
          </>
        )}
      </div>
    </button>
  )
}
