import { useMemo, useState } from 'react'
import Button from './Button'

interface CrashScreenProps {
  /** Preferred: pass one or more errors */
  errors?: Error[]
  /** Back-compat: a single error still works */
  error?: Error
  errorInfo?: React.ErrorInfo
  badge?: string
  onOpenFrame?: (location: string) => void
}

interface StackFrame {
  name: string
  location: string
}

// Very small, dependency-free highlighter for the code-frame body.
// Not a real parser — just enough token coloring to match the look.
function highlightLine(line: string) {
  const tokens = line.split(/(\s+|[{}()<>/.,;]|'[^']*'|"[^"]*")/g).filter(Boolean)
  const keywords = new Set([
    'import', 'from', 'export', 'default', 'function', 'return',
    'const', 'let', 'var', 'if', 'else', 'async', 'await',
  ])
  return tokens.map((t, i) => {
    if (keywords.has(t)) return <span key={i} className="text-[#ff79c6]">{t}</span>
    if (/^['"].*['"]$/.test(t)) return <span key={i} className="text-[#9ece6a]">{t}</span>
    if (/^[A-Z][A-Za-z0-9]*$/.test(t)) return <span key={i} className="text-[#f28fad]">{t}</span>
    if (/^[{}()<>/.,;]$/.test(t)) return <span key={i} className="text-neutral-500">{t}</span>
    return <span key={i} className="text-neutral-300">{t}</span>
  })
}

function parseStackFrames(stack?: string): StackFrame[] {
  if (!stack) return []
  return stack
    .split('\n')
    .slice(1)
    .map((line) => {
      const match = line.match(/at\s+([^\s]+)\s+\(?([^)]+)\)?/)
      if (!match) return null
      return { name: match[1], location: match[2].replace(/^\(|\)$/g, '') }
    })
    .filter((f): f is StackFrame => !!f)
}

export function CrashScreen({ errors, error, errorInfo, badge, onOpenFrame }: CrashScreenProps) {
  // Normalize the two accepted shapes into one list.
  const errorList = errors && errors.length > 0 ? errors : error ? [error] : []

  const [index, setIndex] = useState(0)
  const [copied, setCopied] = useState(false)
  const [showIgnored, setShowIgnored] = useState(false)
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null)

  const safeIndex = Math.min(index, Math.max(errorList.length - 1, 0))
  const current = errorList[safeIndex]

  const frames = useMemo(() => parseStackFrames(current?.stack), [current?.stack])
  const visibleFrames = showIgnored ? frames : frames.slice(0, 2)
  const ignoredCount = frames.length - visibleFrames.length

  if (!current) {
    return null
  }

  const debugInfo = [
    `Error: ${current.name}: ${current.message}`,
    `Stack: ${current.stack || 'No stack trace available'}`,
    errorInfo ? `Component stack: ${errorInfo.componentStack}` : '',
    `User Agent: ${navigator.userAgent}`,
    `URL: ${window.location.href}`,
    `Timestamp: ${new Date().toISOString()}`,
  ].filter(Boolean).join('\n')

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(debugInfo)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback: do nothing
    }
  }

  const handleRefresh = () => window.location.reload()
  const goPrev = () => setIndex((i) => Math.max(0, i - 1))
  const goNext = () => setIndex((i) => Math.min(errorList.length - 1, i + 1))

  return (
    // Overlay — ported from next.js Overlay/styles.tsx (.dialog-overlay / .dialog-backdrop):
    // fixed inset-0, flex column, items-center (horizontal only), pt-[10vh] with a
    // shorter-viewport fallback, and a light translucent backdrop (not a heavy scrim).
    <div className="fixed inset-0 z-[9999] flex flex-col items-center overflow-auto bg-[#111111]/20 px-4 pt-[10vh] max-[812px]:pt-4">
      {/* Dialog — ported from Dialog/styles.ts (.dialog): width 100%, margin auto,
          max-height calc(100% - 56px), responsive max-width caps at 540/720/960px,
          8px border-radius (their --size-gap token). */}
      <div className="flex max-h-[calc(100%-56px)] w-full flex-col overflow-hidden rounded-lg border border-[#2a2a2a] bg-[#0a0a0a] shadow-xl sm:max-w-[540px] md:max-w-[720px] lg:max-w-[960px]">
        {/* DialogContent — flex column, full height */}
        <div className="flex h-full flex-col overflow-y-hidden">

          {/* DialogHeader — shrink-0, own row, border-bottom */}
          <div className="flex shrink-0 items-center justify-between border-b border-[#1f1f1f] px-4 py-3">
            <div className="flex items-center gap-1 text-sm text-neutral-500">
              <button
                onClick={goPrev}
                disabled={safeIndex === 0}
                aria-label="Previous error"
                className="rounded-md p-1.5 hover:bg-[#1a1a1a] hover:text-neutral-200 disabled:opacity-30 disabled:hover:bg-transparent"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
              <span className="font-mono text-xs">{safeIndex + 1}/{errorList.length}</span>
              <button
                onClick={goNext}
                disabled={safeIndex === errorList.length - 1}
                aria-label="Next error"
                className="rounded-md p-1.5 hover:bg-[#1a1a1a] hover:text-neutral-200 disabled:opacity-30 disabled:hover:bg-transparent"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            </div>
            <div className="flex items-center gap-3">
              {badge && (
                <span className="flex items-center gap-1.5 rounded-md border border-[#242424] bg-[#141414] px-2.5 py-1 text-xs text-neutral-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#4ade80]" />
                  {badge}
                </span>
              )}
              <button
                onClick={handleCopy}
                aria-label="Copy debug info"
                className="rounded-md p-1.5 text-neutral-400 hover:bg-[#1a1a1a] hover:text-neutral-200"
              >
                {copied ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" />
                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* DialogBody — flex: 1, padding 16px (their --size-gap-double), scrolls independently */}
          <div className="flex-1 overflow-y-auto p-4">
            <span className="inline-block rounded-md border border-[#3a1a1a] bg-[#1a0e0e] px-2.5 py-1 font-mono text-xs font-medium text-[#f2777a]">
              Unhandled Runtime Error
            </span>

            <p className="mt-4 text-lg leading-7 text-[#f2777a]">
              Error: {current.message}
            </p>

            {errorInfo?.componentStack && (
              <p className="mt-3 text-sm text-[#f2777a]">
                Check the render method of{' '}
                <code className="rounded bg-[#1a0e0e] px-1 py-0.5 font-mono text-neutral-200">{current.name}</code>.
              </p>
            )}

            {current.stack && (
              <div className="mt-5 overflow-hidden rounded-lg border border-[#242424]">
                <div className="flex items-center justify-between border-b border-[#1f1f1f] bg-[#111111] px-4 py-2.5">
                  <span className="font-mono text-xs text-neutral-400">{current.name}</span>
                  <button
                    onClick={() => onOpenFrame?.(frames[0]?.location ?? '')}
                    aria-label="Open in editor"
                    className="rounded p-1 text-neutral-500 hover:bg-[#1a1a1a] hover:text-neutral-300"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                      <path d="M15 3h6v6M10 14L21 3" />
                    </svg>
                  </button>
                </div>
                <div className="max-h-52 overflow-auto bg-[#0a0a0a] px-4 py-3 font-mono text-[13px] leading-6">
                  {current.stack.split('\n').map((line, i) => (
                    <div key={i} className="flex gap-3 whitespace-pre">
                      <span className="w-5 shrink-0 select-none text-right text-neutral-600">{i + 1}</span>
                      <span className="min-w-0 flex-1 break-words">{highlightLine(line)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {frames.length > 0 && (
              <div className="mt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-semibold text-neutral-100">Call Stack</h2>
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#1f1f1f] px-1.5 text-xs text-neutral-400">
                      {frames.length}
                    </span>
                  </div>
                  {ignoredCount > 0 && (
                    <button
                      onClick={() => setShowIgnored((v) => !v)}
                      className="flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-300"
                    >
                      {showIgnored ? 'Hide ignore-listed frames' : `Show ${ignoredCount} ignore-listed frames`}
                      <svg
                        width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                        className={`transition-transform duration-200 ${showIgnored ? 'rotate-180' : ''}`}
                      >
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                    </button>
                  )}
                </div>

                <div className="mt-3 divide-y divide-[#1a1a1a] border-t border-[#1a1a1a]">
                  {visibleFrames.map((frame, i) => (
                    <button
                      key={i}
                      onClick={() => onOpenFrame?.(frame.location)}
                      className="block w-full py-3 text-left"
                    >
                      <div className="group flex items-center gap-1.5">
                        <span className="text-sm font-medium text-neutral-100 group-hover:underline">{frame.name}</span>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-neutral-500">
                          <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                          <path d="M15 3h6v6M10 14L21 3" />
                        </svg>
                      </div>
                      <p className="mt-0.5 font-mono text-xs text-neutral-500">{frame.location}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Button onClick={handleRefresh} width={120} height={36}>Refresh page</Button>
              <Button onClick={handleCopy} variant="secondary" width={140} height={36}>
                {copied ? 'Copied!' : 'Copy debug info'}
              </Button>
            </div>
          </div>

          {/* Footer — feedback row */}
          <div className="flex shrink-0 items-center justify-end gap-3 border-t border-[#1a1a1a] px-4 py-3">
            <span className="text-sm text-neutral-500">Was this helpful?</span>
            <button
              onClick={() => setFeedback((f) => (f === 'up' ? null : 'up'))}
              aria-label="Yes, this was helpful"
              className={feedback === 'up' ? 'text-[#3b82f6]' : 'text-neutral-500 hover:text-neutral-300'}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill={feedback === 'up' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                <path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14z" />
              </svg>
            </button>
            <button
              onClick={() => setFeedback((f) => (f === 'down' ? null : 'down'))}
              aria-label="No, this wasn't helpful"
              className={feedback === 'down' ? 'text-[#3b82f6]' : 'text-neutral-500 hover:text-neutral-300'}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill={feedback === 'down' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                <path d="M10 15v4a3 3 0 003 3l4-9V2H5.72a2 2 0 00-2 1.7l-1.38 9a2 2 0 002 2.3H10z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
