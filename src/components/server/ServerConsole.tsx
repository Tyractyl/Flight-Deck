import { useEffect, useRef, useState, useCallback } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import '@xterm/xterm/css/xterm.css'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  RamMemoryIcon, CpuIcon, HardDriveIcon,
} from '@hugeicons/core-free-icons'

interface ServerConsoleProps {
  serverId: string
}

type ResourceUsage = {
  cpuPercent: number
  memoryMib: number
  memoryLimitMib: number
  memoryPercent: number
  diskMib: number
  diskPercent: number
  running: boolean
}

function formatPercent(value: number): string {
  return `${value.toFixed(1).replace(/\.0$/, '')}%`
}

function formatMib(value: number): string {
  if (value >= 1024) return `${(value / 1024).toFixed(value >= 10240 ? 0 : 1).replace(/\.0$/, '')} GiB`
  if (value >= 10) return `${Math.round(value)} MiB`
  return `${value.toFixed(1).replace(/\.0$/, '')} MiB`
}

function ResourceCard({
  title,
  usage,
  percent,
  icon,
}: {
  title: string
  usage: string
  percent: number
  icon: typeof RamMemoryIcon
}) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-xl border border-theme-strong bg-[var(--bg-card)] px-1 py-1">
      <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[var(--bg)] text-[var(--fg-muted)] shadow-xs ring-1 ring-theme-strong">
        <HugeiconsIcon icon={icon} className="relative h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1 pl-2">
        <p className="text-xs font-medium text-[var(--fg-muted)]">{title}</p>
        <p className="truncate text-sm font-medium text-[var(--fg)]">{usage}</p>
        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[var(--bg-elevated)]">
          <div
            className="h-full rounded-full bg-[var(--accent)] transition-all duration-500"
            style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
          />
        </div>
      </div>
      <span className="pr-3 text-xs font-medium text-[var(--fg-muted)]">
        {formatPercent(percent)}
      </span>
    </div>
  )
}

export default function ServerConsole({ serverId }: ServerConsoleProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const terminalRef = useRef<Terminal | null>(null)
  const fitAddonRef = useRef<FitAddon | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const [connected, setConnected] = useState(false)
  const [consolePhase, setConsolePhase] = useState<'connecting' | 'loading' | 'ready'>('connecting')
  const [command, setCommand] = useState('')
  const [usage, setUsage] = useState<ResourceUsage>({
    cpuPercent: 0, memoryMib: 0, memoryLimitMib: 1024, memoryPercent: 0,
    diskMib: 0, diskPercent: 0, running: false,
  })

  const connect = useCallback(() => {
    if (!containerRef.current) return

    // Clean up previous
    if (terminalRef.current) {
      terminalRef.current.dispose()
      terminalRef.current = null
    }
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }

    setConsolePhase('connecting')

    const terminal = new Terminal({
      theme: {
        background: '#0D0D0D',
        foreground: '#e4e4e7',
        cursor: '#a1a1aa',
        selectionBackground: '#3b82f633',
        black: '#27272a',
        red: '#f87171',
        green: '#4ade80',
        yellow: '#fbbf24',
        blue: '#60a5fa',
        magenta: '#c084fc',
        cyan: '#22d3ee',
        white: '#e4e4e7',
        brightBlack: '#71717a',
        brightWhite: '#fafafa',
      },
      fontFamily: '"Geist Mono", "JetBrains Mono", "Fira Code", monospace',
      fontSize: 12,
      lineHeight: 1.5,
      cursorBlink: true,
      cursorStyle: 'bar',
      disableStdin: false,
      scrollback: 2000,
      convertEol: true,
    })

    const fitAddon = new FitAddon()
    terminal.loadAddon(fitAddon)
    terminal.open(containerRef.current)
    fitAddon.fit()
    terminalRef.current = terminal
    fitAddonRef.current = fitAddon

    // Resize observer
    const observer = new ResizeObserver(() => {
      try { fitAddon.fit() } catch {}
    })
    observer.observe(containerRef.current)

    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
    const ws = new WebSocket(`${protocol}://${window.location.host}/api/servers/${serverId}/console`)
    wsRef.current = ws

    ws.onopen = () => {
      setConnected(true)
      setConsolePhase('loading')
      setTimeout(() => setConsolePhase('ready'), 800)
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.event === 'console output' || data.event === 'install output') {
          terminal.write(data.data || '')
        } else if (data.event === 'stats') {
          // Update resource usage from stats
          const stats = data.data
          if (stats) {
            setUsage(prev => ({
              ...prev,
              running: stats.running ?? prev.running,
              cpuPercent: stats.cpu_percent ?? prev.cpuPercent,
              memoryMib: stats.memory_mb ?? prev.memoryMib,
              diskMib: stats.disk_mb ?? prev.diskMib,
              diskPercent: stats.disk_percent ?? prev.diskPercent,
            }))
          }
        } else if (data.event === 'status') {
          setUsage(prev => ({ ...prev, running: data.data === 'running' }))
        } else {
          terminal.write(typeof data === 'string' ? event.data : (data.data || ''))
        }
      } catch {
        terminal.write(event.data)
      }
    }

    ws.onclose = () => {
      setConnected(false)
      setConsolePhase('connecting')
      terminal.write('\r\n\x1b[31m[Disconnected — reconnecting...]\x1b[0m\r\n')
      // Auto-reconnect
      setTimeout(() => connect(), 3000)
    }

    ws.onerror = () => {
      setConnected(false)
    }

    terminal.onData((data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data)
      }
    })

    return () => {
      observer.disconnect()
      ws.close()
      terminal.dispose()
    }
  }, [serverId])

  useEffect(() => {
    const cleanup = connect()
    return cleanup
  }, [connect])

  // Fit on window resize
  useEffect(() => {
    const handleResize = () => {
      try { fitAddonRef.current?.fit() } catch {}
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = command.trim()
    if (!trimmed || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return
    wsRef.current.send(JSON.stringify({ event: 'send command', args: [trimmed] }))
    setCommand('')
  }

  const overlayTitle = consolePhase === 'connecting' ? 'Connecting...' : 'Loading logs...'
  const overlayDesc = consolePhase === 'connecting'
    ? 'Opening the websocket connection.'
    : 'Loading recent console output.'

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Resource cards */}
      <div className="grid gap-3 sm:grid-cols-3 shrink-0">
        <ResourceCard
          title="Memory"
          usage={`${formatMib(usage.memoryMib)} / ${formatMib(usage.memoryLimitMib)}`}
          percent={usage.memoryPercent}
          icon={RamMemoryIcon}
        />
        <ResourceCard
          title="CPU"
          usage={`${formatPercent(usage.cpuPercent)} used`}
          percent={usage.cpuPercent}
          icon={CpuIcon}
        />
        <ResourceCard
          title="Disk"
          usage={usage.diskMib > 0 ? `${formatMib(usage.diskMib)} used` : '—'}
          percent={usage.diskPercent}
          icon={HardDriveIcon}
        />
      </div>

      {/* Console terminal */}
      <div className="flex-1 min-h-0 overflow-hidden rounded-xl border border-theme-strong bg-[var(--bg)] shadow-sm relative">
        <div
          ref={containerRef}
          className="h-full w-full"
        />

        {/* Overlay while connecting/loading */}
        {consolePhase !== 'ready' && (
          <div className="absolute inset-0 flex items-center justify-center bg-[var(--bg)]/80 backdrop-blur-sm z-10">
            <div className="flex items-center gap-3 rounded-lg border border-theme-strong bg-[var(--bg-card)] px-4 py-3 shadow-sm">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--fg-muted)] border-t-[var(--accent)]" />
              <div className="space-y-0.5 text-sm">
                <p className="font-medium text-[var(--fg)]">{overlayTitle}</p>
                <p className="text-[var(--fg-muted)]">{overlayDesc}</p>
              </div>
            </div>
          </div>
        )}

        {/* Command input at bottom */}
        <form onSubmit={handleCommandSubmit} className="absolute bottom-0 inset-x-0 border-t border-theme-strong bg-[var(--bg-card)]/95 backdrop-blur-sm px-3 py-2">
          <div className="flex items-center gap-2">
            <span className="text-[var(--fg-muted)] text-xs font-mono shrink-0">$</span>
            <input
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              disabled={!connected || consolePhase !== 'ready'}
              placeholder={connected && consolePhase === 'ready' ? 'Type a command and press enter...' : 'Console is connecting...'}
              className="flex-1 bg-transparent text-sm text-[var(--fg)] outline-none placeholder:text-[var(--fg-muted)] disabled:cursor-not-allowed font-mono"
              autoComplete="off"
              spellCheck={false}
            />
          </div>
        </form>
      </div>
    </div>
  )
}
