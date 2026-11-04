import {
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  MemoryStickIcon,
  CpuIcon,
  HardDriveIcon,
  PlayIcon,
  Refresh01Icon,
  Square01Icon,
  PowerIcon,
} from '@hugeicons/core-free-icons'
import Loader from '../Loader'
import Button from '../Button'
import { sileo } from 'sileo'
import { getAccessToken } from '../../api/client'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '../ui/alert-dialog'

interface ServerConsoleProps {
  serverId: string
  server?: {
    id: number
    name: string
    status: string
    cpu_limit?: number
    disk_mib?: number
    memory_mib?: number
    egg_name?: string
    node_name?: string
  }
}

type ServerPowerSignal = 'kill' | 'restart' | 'start' | 'stop'
type ConfirmedSignal = 'kill'

type ResourceUsage = {
  cpuPercent: number
  diskMib: number
  diskPercent: number
  memoryMib: number
  memoryPercent: number
  networkPercent: number
  running: boolean
}

type ConsoleLineTone = 'default' | 'error' | 'input' | 'system'

type ConsoleLine = {
  id: number
  text: string
  tone: ConsoleLineTone
}

type SocketPayload = {
  event: string
  args?: unknown[]
}

type AnsiSegment = {
  className: string
  text: string
}

const MAX_CONSOLE_LINES = 50

function powerActionsForState(status: string) {
  const s = (status ?? '').toLowerCase()
  const running = s === 'running'
  const stopped = s === 'stopped' || s === 'offline' || s === 'error'
  const transitioning = s === 'starting' || s === 'stopping' || s === 'restarting'
  return { start: stopped && !transitioning, stop: running && !transitioning, restart: running && !transitioning, kill: transitioning || running }
}

const ANSI_ESCAPE_PATTERN = /\[[0-?]*[ -/]*[@-~]/g
const ANSI_SGR_SEGMENT_PATTERN = /(\[[0-9;]*m)/g
const ANSI_SGR_PATTERN = /^\[([0-9;]*)m$/

function formatPercent(value: number): string {
  return `${value.toFixed(1).replace(/\.0$/, '')}%`
}

function formatMib(value: number): string {
  if (value >= 1024) {
    return `${(value / 1024).toFixed(value >= 10240 ? 0 : 1).replace(/\.0$/, '')} GiB`
  }
  if (value >= 10) {
    return `${Math.round(value)} MiB`
  }
  return `${value.toFixed(1).replace(/\.0$/, '')} MiB`
}

function stripAnsi(text: string): string {
  return text.replace(ANSI_ESCAPE_PATTERN, '')
}

function splitConsoleLines(text: string): string[] {
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const lines = normalized.split('\n')
  if (lines.length > 0 && lines[lines.length - 1] === '') {
    lines.pop()
  }
  return lines.length > 0 ? lines : ['']
}

const ANSI_FG_MAP: Record<number, string> = {
  30: 'text-zinc-500',
  31: 'text-rose-400',
  32: 'text-emerald-400',
  33: 'text-amber-300',
  34: 'text-sky-400',
  35: 'text-fuchsia-400',
  36: 'text-cyan-300',
  37: 'text-[var(--fg)]',
  39: 'text-[var(--fg)]',
  90: 'text-[var(--fg-muted)]',
  91: 'text-rose-400',
  92: 'text-emerald-400',
  93: 'text-amber-300',
  94: 'text-sky-400',
  95: 'text-fuchsia-400',
  96: 'text-cyan-300',
  97: 'text-[var(--fg)]',
}

function ansiClassName(codes: number[]): string {
  const classNames: string[] = []
  if (codes.includes(1)) classNames.push('font-semibold')
  if (codes.includes(3)) classNames.push('italic')
  if (codes.includes(4)) classNames.push('underline')
  if (codes.includes(9)) classNames.push('line-through')

  let fgClass = ''
  for (let i = codes.length - 1; i >= 0; i--) {
    const mapped = ANSI_FG_MAP[codes[i]]
    if (mapped) {
      fgClass = mapped
      break
    }
  }
  classNames.push(fgClass || 'text-[var(--fg)]')
  return classNames.join(' ')
}

function ansiSegments(text: string): AnsiSegment[] {
  const parts = text.split(ANSI_SGR_SEGMENT_PATTERN)
  let activeCodes: number[] = []
  const segments: AnsiSegment[] = []

  for (const part of parts) {
    if (part.length === 0) continue
    const match = part.match(ANSI_SGR_PATTERN)
    if (match) {
      const codes = (match[1] || '0')
        .split(';')
        .filter((value) => value.length > 0)
        .map((value) => Number.parseInt(value, 10))
        .filter((value) => !Number.isNaN(value))

      if (codes.length === 0 || codes.includes(0)) {
        activeCodes = codes.filter((c) => c !== 0)
      } else {
        const newFg = codes.find((c) => (c >= 30 && c <= 39) || (c >= 90 && c <= 97))
        if (newFg !== undefined) {
          activeCodes = activeCodes.filter((c) => !((c >= 30 && c <= 39) || (c >= 90 && c <= 97)))
        }
        if (codes.includes(22)) activeCodes = activeCodes.filter((c) => c !== 1)
        if (codes.includes(23)) activeCodes = activeCodes.filter((c) => c !== 3)
        if (codes.includes(24)) activeCodes = activeCodes.filter((c) => c !== 4)
        activeCodes = [...activeCodes, ...codes.filter((c) => c !== 22 && c !== 23 && c !== 24)]
      }
      continue
    }

    segments.push({
      className: ansiClassName(activeCodes),
      text: part,
    })
  }

  return segments.length > 0
    ? segments
    : [{ className: 'text-[var(--fg)]', text: stripAnsi(text) }]
}

function ConsoleLineText({ text }: { text: string }) {
  const segments = ansiSegments(text)
  let segmentOffset = 0

  if (stripAnsi(text).length === 0) {
    return <span> </span>
  }

  return (
    <>
      {segments.map((segment) => {
        const key = `${segmentOffset}-${segment.className}-${segment.text}`
        segmentOffset += segment.text.length
        return (
          <span key={key} className={segment.className}>
            {segment.text}
          </span>
        )
      })}
    </>
  )
}

function consoleLineClasses(tone: ConsoleLineTone): string {
  switch (tone) {
    case 'error':
      return 'text-rose-600 dark:text-rose-400'
    case 'system':
      return 'text-[var(--fg-muted)]'
    case 'input':
      return 'text-[var(--fg)]'
    default:
      return 'text-[var(--fg)]'
  }
}

function ConsoleRenderedLine({ line }: { line: ConsoleLine }) {
  return (
    <div className={`wrap-break-word whitespace-pre-wrap ${consoleLineClasses(line.tone)}`}>
      {line.tone === 'system' ? '[Panel]: ' : null}
      {line.tone === 'input' ? '> ' : null}
      <ConsoleLineText text={line.text} />
    </div>
  )
}

export default function ServerConsole({ serverId, server }: ServerConsoleProps) {
  const availability = useMemo(() => powerActionsForState(server?.status ?? 'offline'), [server?.status])
  const runtimeStateRef = useRef(server?.status ?? 'offline')
  const [submittingAction, setSubmittingAction] = useState<ServerPowerSignal | null>(null)
  const [confirmingSignal, setConfirmingSignal] = useState<ConfirmedSignal | null>(null)
  const [socketConnected, setSocketConnected] = useState(false)
  const [consolePhase, setConsolePhase] = useState<'connecting' | 'requesting-logs' | 'ready'>('connecting')
  const [socketError, setSocketError] = useState<string | null>(null)
  const [consoleLines, setConsoleLines] = useState<ConsoleLine[]>([])
  const [runtimeUsage, setRuntimeUsage] = useState<ResourceUsage>({
    cpuPercent: 0,
    diskMib: 0,
    diskPercent: 0,
    memoryMib: 0,
    memoryPercent: 0,
    networkPercent: 0,
    running: server?.status === 'running',
  })
  const [command, setCommand] = useState('')
  const [commandHistory, setCommandHistory] = useState<string[]>(() => {
    if (typeof window === 'undefined') return []
    try {
      const stored = window.localStorage.getItem(`server-console-history:${serverId}`)
      return stored ? (JSON.parse(stored) as string[]) : []
    } catch {
      return []
    }
  })
  const [historyIndex, setHistoryIndex] = useState(-1)
  const submittingActionRef = useRef<ServerPowerSignal | null>(null)
  const socketRef = useRef<WebSocket | null>(null)
  const reconnectTimeout = useRef<number | null>(null)
  const consoleViewportRef = useRef<HTMLDivElement | null>(null)
  const nextConsoleLineIdRef = useRef(0)
  const skipNextCloseRef = useRef(false)
  const consolePhaseTimeoutRef = useRef<number | null>(null)
  const lastMessageAtRef = useRef<number>(Date.now())
  const heartbeatIntervalRef = useRef<number | null>(null)

  const cpuUsageLabel = (server?.cpu_limit ?? 0) === 0
    ? `${formatPercent(runtimeUsage.cpuPercent)} / Unlimited`
    : `${formatPercent(runtimeUsage.cpuPercent)} / ${server?.cpu_limit}%`
  const memoryUsageLabel = `${formatMib(runtimeUsage.memoryMib)} / ${formatMib(server?.memory_mib ?? 1024)}`
  const diskUsageLabel = runtimeUsage.diskMib > 0
    ? `${formatMib(runtimeUsage.diskMib)} / ${formatMib(server?.disk_mib ?? 0)}`
    : 'No data'

  const consoleOverlayTitle = socketError
    ? 'Cannot reach Talon'
    : consolePhase === 'connecting'
      ? 'Connecting...'
      : 'Requesting console logs...'
  const consoleOverlayDescription = socketError
    ? 'Waiting for connectivity...'
    : consolePhase === 'connecting'
      ? 'Opening the websocket connection.'
      : 'Loading recent console output.'
  const consoleInputPlaceholder = 'Type your command here'

  const appendConsoleLine = useCallback(
    (text: string, tone: ConsoleLineTone = 'default') => {
      const nextLines = splitConsoleLines(text)
      setConsoleLines((currentLines) => {
        const appendedLines = nextLines.map((line) => ({
          id: ++nextConsoleLineIdRef.current,
          text: line,
          tone,
        }))
        return [...currentLines, ...appendedLines].slice(-MAX_CONSOLE_LINES)
      })
    },
    [],
  )

  const finishConsoleLoading = useCallback(() => {
    if (consolePhaseTimeoutRef.current) {
      window.clearTimeout(consolePhaseTimeoutRef.current)
      consolePhaseTimeoutRef.current = null
    }
    setConsolePhase('ready')
  }, [])

  const requestSocketSync = useCallback(() => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) return
    socketRef.current.send(JSON.stringify({ event: 'send stats', args: [] }))
    socketRef.current.send(JSON.stringify({ event: 'send logs', args: [] }))
  }, [])

  const updateRuntimeState = useCallback((nextState: string) => {
    if (
      (submittingActionRef.current === 'stop' || submittingActionRef.current === 'restart') &&
      nextState === 'running'
    ) {
      return
    }
    runtimeStateRef.current = nextState
    setSubmittingAction(null)
  }, [])

  const handleSocketPayload = useCallback(
    (payload: SocketPayload) => {
      lastMessageAtRef.current = Date.now()

      switch (payload.event) {
        case 'auth success': {
          setSocketConnected(true)
          setSocketError(null)
          nextConsoleLineIdRef.current = 0
          setConsoleLines([])
          setRuntimeUsage({
            cpuPercent: 0,
            diskMib: 0,
            diskPercent: 0,
            memoryMib: 0,
            memoryPercent: 0,
            networkPercent: 0,
            running: false,
          })
          setConsolePhase('requesting-logs')
          requestSocketSync()

          if (consolePhaseTimeoutRef.current) {
            window.clearTimeout(consolePhaseTimeoutRef.current)
          }
          consolePhaseTimeoutRef.current = window.setTimeout(() => {
            setConsolePhase('ready')
            consolePhaseTimeoutRef.current = null
          }, 1200)
          return
        }
        case 'auth error':
        case 'jwt error': {
          setSocketConnected(false)
          setConsolePhase('connecting')
          setSocketError('Console authentication failed.')
          appendConsoleLine('Console authentication failed.', 'error')
          return
        }
        case 'status': {
          const nextState = String(payload.args?.[0] ?? 'offline')
          updateRuntimeState(nextState)
          return
        }
        case 'stats': {
          const snapshot = payload.args?.[0] as
            | {
                disk_bytes?: number
                running?: boolean
                state?: string
                stats?: {
                  CPUPerc?: string
                  MemUsage?: string
                }
              }
            | undefined

          const running = Boolean(snapshot?.running)
          const cpuPercent = running ? Number.parseFloat((snapshot?.stats?.CPUPerc ?? '0').replace('%', '')) : 0
          const memUsageStr = snapshot?.stats?.MemUsage ?? '0 MiB / 0 MiB'
          const memoryMib = Number.parseFloat(memUsageStr.split('/')[0]?.trim() ?? '0')
          const diskMib = (snapshot?.disk_bytes ?? 0) / (1024 * 1024)
          const serverDiskMib = server?.disk_mib ?? 0
          const serverMemoryMib = server?.memory_mib ?? 1024

          const nextUsage: ResourceUsage = {
            cpuPercent,
            diskMib,
            diskPercent: serverDiskMib > 0 ? Math.min(100, Math.max(0, (diskMib / serverDiskMib) * 100)) : 0,
            memoryMib,
            memoryPercent: serverMemoryMib > 0 ? Math.min(100, Math.max(0, (memoryMib / serverMemoryMib) * 100)) : 0,
            networkPercent: 0,
            running,
          }

          setRuntimeUsage(nextUsage)
          updateRuntimeState(String(snapshot?.state ?? 'offline'))
          return
        }
        case 'console output':
        case 'install output':
        case 'transfer logs': {
          finishConsoleLoading()
          appendConsoleLine(String(payload.args?.[0] ?? ''))
          return
        }
        case 'daemon message': {
          finishConsoleLoading()
          appendConsoleLine(String(payload.args?.[0] ?? ''), 'system')
          return
        }
        case 'daemon error': {
          finishConsoleLoading()
          appendConsoleLine(String(payload.args?.[0] ?? ''), 'error')
          return
        }
        case 'transfer status': {
          if (String(payload.args?.[0] ?? '') === 'failure') {
            appendConsoleLine('Transfer has failed.', 'error')
          }
          return
        }
        default: {
          return
        }
      }
    },
    [appendConsoleLine, finishConsoleLoading, requestSocketSync, server, updateRuntimeState],
  )

  const connect = useCallback(async () => {
    if (reconnectTimeout.current) {
      window.clearTimeout(reconnectTimeout.current)
      reconnectTimeout.current = null
    }

    if (socketRef.current) {
      skipNextCloseRef.current = true
      socketRef.current.close()
      socketRef.current = null
    }

    setSocketConnected(false)
    setConsolePhase('connecting')

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
      const socket = new WebSocket(
        `${protocol}://${window.location.host}/api/servers/${serverId}/console`,
        // Browsers cannot set an Authorization header on WebSocket, so the
        // access token travels in the subprotocol channel.
        ['access_token', getAccessToken() || ''],
      )
      socketRef.current = socket

      socket.addEventListener('open', () => {
        setSocketError(null)
        lastMessageAtRef.current = Date.now()

        if (heartbeatIntervalRef.current) {
          window.clearInterval(heartbeatIntervalRef.current)
        }

        heartbeatIntervalRef.current = window.setInterval(() => {
          const elapsed = Date.now() - lastMessageAtRef.current

          if (elapsed > 15_000) {
            socket.close()
            return
          }

          if (socket.readyState === WebSocket.OPEN && elapsed > 5_000) {
            socket.send(JSON.stringify({ event: 'send stats', args: [] }))
          }
        }, 5_000)
      })

      socket.addEventListener('message', (event) => {
        try {
          const payload = JSON.parse(event.data) as SocketPayload
          handleSocketPayload(payload)
        } catch {
          appendConsoleLine('Received an unreadable console payload.', 'error')
        }
      })

      socket.addEventListener('close', () => {
        setSocketConnected(false)
        setConsolePhase('connecting')
        socketRef.current = null

        if (heartbeatIntervalRef.current) {
          window.clearInterval(heartbeatIntervalRef.current)
          heartbeatIntervalRef.current = null
        }

        if (skipNextCloseRef.current) {
          skipNextCloseRef.current = false
          return
        }

        if (!reconnectTimeout.current) {
          reconnectTimeout.current = window.setTimeout(() => {
            reconnectTimeout.current = null
            void connect()
          }, 3000)
        }
      })

      socket.addEventListener('error', () => {
        setSocketConnected(false)
        setConsolePhase('connecting')
        setSocketError('Console connection lost. Reconnecting…')
      })
    } catch {
      setSocketConnected(false)
      setConsolePhase('connecting')
      setSocketError('Console connection failed. Reconnecting…')

      if (!reconnectTimeout.current) {
        reconnectTimeout.current = window.setTimeout(() => {
          reconnectTimeout.current = null
          void connect()
        }, 3000)
      }
    }
  }, [appendConsoleLine, handleSocketPayload, serverId])

  useEffect(() => {
    submittingActionRef.current = submittingAction
  }, [submittingAction])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(
      `server-console-history:${serverId}`,
      JSON.stringify(commandHistory.slice(0, 32)),
    )
  }, [commandHistory, serverId])

  useEffect(() => {
    void connect()

    return () => {
      if (socketRef.current) {
        skipNextCloseRef.current = true
        socketRef.current.close()
        socketRef.current = null
      }
      if (reconnectTimeout.current) {
        window.clearTimeout(reconnectTimeout.current)
        reconnectTimeout.current = null
      }
      if (consolePhaseTimeoutRef.current) {
        window.clearTimeout(consolePhaseTimeoutRef.current)
        consolePhaseTimeoutRef.current = null
      }
      if (heartbeatIntervalRef.current) {
        window.clearInterval(heartbeatIntervalRef.current)
        heartbeatIntervalRef.current = null
      }
    }
  }, [connect])

  const lastConsoleLineId = consoleLines.length > 0 ? consoleLines[consoleLines.length - 1].id : 0

  useEffect(() => {
    const viewport = consoleViewportRef.current
    if (!viewport) return
    viewport.scrollTop = viewport.scrollHeight
    requestAnimationFrame(() => {
      viewport.scrollTop = viewport.scrollHeight
    })
  }, [lastConsoleLineId])

  const sendPowerSignal = async (signal: ServerPowerSignal) => {
    setSubmittingAction(signal)

    try {
      const response = await fetch(`/api/servers/${serverId}/power`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ signal }),
      })

      const payload = (await response.json().catch(() => null)) as {
        message?: string
      } | null

      if (!response.ok) {
        throw new Error(payload?.message || 'The power action could not be sent.')
      }

      if (signal === 'start') {
        runtimeStateRef.current = 'starting'
      } else if (signal === 'stop') {
        runtimeStateRef.current = 'offline'
      } else if (signal === 'restart') {
        runtimeStateRef.current = 'starting'
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'The power action could not be sent.'
      sileo.error({ description: 'Power action failed: ' + message })
      setSubmittingAction(null)
    }
  }

  const sendConsoleCommand = (nextCommand: string) => {
    const trimmedCommand = nextCommand.trim()
    if (
      trimmedCommand.length === 0 ||
      !socketRef.current ||
      socketRef.current.readyState !== WebSocket.OPEN
    ) {
      return
    }

    socketRef.current.send(
      JSON.stringify({
        event: 'send command',
        args: [trimmedCommand],
      }),
    )

    appendConsoleLine(trimmedCommand, 'input')
    setCommandHistory((currentHistory) =>
      [trimmedCommand, ...currentHistory.filter((entry) => entry !== trimmedCommand)].slice(0, 32),
    )
    setHistoryIndex(-1)
    setCommand('')
  }

  const handleCommandSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    sendConsoleCommand(command)
  }

  return (
    <div className="flex h-full min-h-0 flex-col rounded-[22px] bg-white/[0.025] p-1">
      {/* Unified card — a #1E1E1E frame in a transparent thick ring, sitting
          flush against the app shell. Proportions follow the Figma
          (32% / 52% / 13%). */}
      <div className="relative flex flex-1 min-h-0 flex-col gap-[8px] overflow-hidden rounded-[18px] bg-[#1E1E1E] p-[8px]">
        {/* Power controls — top-right, floating over the stat band. Big,
            borderless icon buttons in a plain group. */}
        <div className="absolute right-[10px] top-[10px] z-10">
          <div className="flex h-[40px] items-center gap-[4px] rounded-[14px] bg-[#161616] px-[7px]">
            <Button
              variant="ghost"
              size="icon"
              className="size-[32px] rounded-[9px] text-white/75 transition-colors hover:bg-white/10 hover:text-white disabled:border-transparent disabled:opacity-30 disabled:[background-image:none]"
              onClick={() => void sendPowerSignal('start')}
              disabled={!availability.start || submittingAction !== null}
              aria-label="Start server"
            >
              <HugeiconsIcon icon={PlayIcon} className="size-[19px]" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-[32px] rounded-[9px] text-white/75 transition-colors hover:bg-white/10 hover:text-white disabled:border-transparent disabled:opacity-30 disabled:[background-image:none]"
              onClick={() => void sendPowerSignal('restart')}
              disabled={!availability.restart || submittingAction !== null}
              aria-label="Restart server"
            >
              <HugeiconsIcon icon={Refresh01Icon} className="size-[19px]" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-[32px] rounded-[9px] text-white/75 transition-colors hover:bg-white/10 hover:text-white disabled:border-transparent disabled:opacity-30 disabled:[background-image:none]"
              onClick={() => void sendPowerSignal('stop')}
              disabled={!availability.stop || submittingAction !== null}
              aria-label="Stop server"
            >
              <HugeiconsIcon icon={Square01Icon} className="size-[16px]" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-[32px] rounded-[9px] text-white/75 transition-colors hover:bg-rose-500/20 hover:text-rose-300 disabled:border-transparent disabled:opacity-30 disabled:[background-image:none]"
              onClick={() => setConfirmingSignal('kill')}
              disabled={!availability.kill || submittingAction !== null}
              aria-label="Kill server"
            >
              <HugeiconsIcon icon={PowerIcon} className="size-[19px]" />
            </Button>
          </div>
        </div>

        {/* Stat band — #0D0D0D, ~32% of the card (Rectangle 16) */}
        <div className="flex-[32] min-h-[120px] rounded-[11px] bg-[#0D0D0D] p-[8px]">
          <div className="grid h-full grid-cols-3 gap-[8px]">
            <ResourceStatCard
              value={memoryUsageLabel}
              accent="blue"
              icon={<HugeiconsIcon icon={MemoryStickIcon} className="size-[56px] text-sky-200/30" />}
            />
            <ResourceStatCard
              value={cpuUsageLabel}
              accent="red"
              icon={<HugeiconsIcon icon={CpuIcon} className="size-[56px] text-rose-200/30" />}
            />
            <ResourceStatCard
              value={diskUsageLabel}
              accent="amber"
              icon={<HugeiconsIcon icon={HardDriveIcon} className="size-[56px] text-amber-200/30" />}
            />
          </div>
        </div>

        {/* Console band — #0D0D0D, ~52% of the card (Rectangle 15) */}
        <div className="relative flex-[52] min-h-0 overflow-hidden rounded-[11px] bg-[#0D0D0D]">
          <div
            ref={consoleViewportRef}
            className="h-full overflow-y-auto px-[10px] py-[7px] text-[15px] leading-[20px] text-[#F6A72D]"
          >
            {consoleLines.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-white/40">
                Waiting for console output…
              </div>
            ) : (
              <div className="space-y-px">
                {consoleLines.map((line) => (
                  <ConsoleRenderedLine key={line.id} line={line} />
                ))}
              </div>
            )}
          </div>

          {consolePhase !== 'ready' ? (
            <div className="absolute inset-0 flex items-center justify-center bg-black/70 px-6 backdrop-blur-sm">
              <div className="w-auto min-w-[280px] max-w-sm rounded-md border border-white/10 bg-black shadow-2xl px-5 py-4">
                <div className="flex items-center gap-4">
                  <div className="size-12">
                    <Loader size={48} color="#888" />
                  </div>
                  <div className="text-sm">
                    <p className="font-semibold text-white">{consoleOverlayTitle}</p>
                    <p className="text-xs text-white/55">{consoleOverlayDescription}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Command row — below the console band, on the card's #1E1E1E (~13%) */}
        <div className="flex flex-[13] min-h-[48px] items-center px-[16px]">
          <form onSubmit={handleCommandSubmit} className="w-full">
            <input
              value={command}
              onChange={(event) => setCommand(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'ArrowUp') {
                  const nextIndex = Math.min(historyIndex + 1, commandHistory.length - 1)
                  if (nextIndex >= 0) {
                    setHistoryIndex(nextIndex)
                    setCommand(commandHistory[nextIndex] ?? '')
                  }
                  event.preventDefault()
                }
                if (event.key === 'ArrowDown') {
                  const nextIndex = Math.max(historyIndex - 1, -1)
                  setHistoryIndex(nextIndex)
                  setCommand(nextIndex >= 0 ? (commandHistory[nextIndex] ?? '') : '')
                  event.preventDefault()
                }
              }}
              disabled={!socketConnected || consolePhase !== 'ready'}
              placeholder={consoleInputPlaceholder}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              className="w-full border-0 bg-transparent text-[15px] text-white/90 outline-hidden placeholder:text-white/60 focus:outline-hidden disabled:cursor-not-allowed disabled:text-white/25 disabled:placeholder:text-white/25"
            />
          </form>
        </div>
      </div>

      {/* Kill confirmation dialog */}
      <AlertDialog open={confirmingSignal !== null} onOpenChange={() => setConfirmingSignal(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kill {server?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will forcibly terminate the server process immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmingSignal(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!confirmingSignal) return
                const signal = confirmingSignal
                setConfirmingSignal(null)
                void sendPowerSignal(signal)
              }}
            >
              Kill server
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

type StatAccent = 'blue' | 'red' | 'amber'

const ACCENT_GRADIENT: Record<StatAccent, string> = {
  blue: 'linear-gradient(180deg, #1E1E1E 38.46%, #1E2853 100%)',
  red: 'linear-gradient(180deg, #1E1E1E 50%, #4F1616 100%)',
  amber: 'linear-gradient(180deg, #1E1E1E 0%, #23231E 50%, #764D00 100%)',
}

function ResourceStatCard({
  value,
  accent,
  icon,
}: {
  value: string
  accent: StatAccent
  icon: React.ReactNode
}) {
  return (
    <div
      className="relative h-full overflow-hidden rounded-[11px]"
      style={{ background: ACCENT_GRADIENT[accent] }}
    >
      <p className="absolute left-[14px] top-[9px] max-w-[calc(100%-28px)] truncate text-[30px] leading-[38px] font-normal tabular-nums text-white/70">
        {value}
      </p>
      {/* Accent glyph anchored bottom-left, flush with the card bottom (Figma). */}
      <div className="pointer-events-none absolute bottom-0 left-[8px]">
        {icon}
      </div>
    </div>
  )
}
