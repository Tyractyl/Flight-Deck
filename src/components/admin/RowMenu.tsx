import { useEffect, useRef, useState, type ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { MoreVerticalIcon } from '@hugeicons/core-free-icons'

export function RowMenuButton({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={ref} className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-[var(--fg-muted)] opacity-0 transition-all duration-150 ease-out hover:bg-[var(--bg-elevated)] hover:text-[var(--fg)] group-hover:opacity-100 data-[open=true]:opacity-100"
        data-open={open || undefined}
      >
        <HugeiconsIcon icon={MoreVerticalIcon} className="h-4 w-4" />
      </button>
      {open && (
        <div
          className="absolute right-0 top-full z-50 mt-1 min-w-[160px] rounded-lg border border-[var(--border-strong)] bg-[var(--bg-card)] p-1 shadow-xl"
          onClick={() => setOpen(false)}
        >
          {children}
        </div>
      )}
    </div>
  )
}

export function RowMenuItem({
  icon,
  label,
  onClick,
  destructive = false,
}: {
  icon?: ReactNode
  label: string
  onClick: () => void
  destructive?: boolean
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      className={`flex w-full cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-sm transition-colors ${
        destructive
          ? 'text-red-400 hover:bg-red-500/10'
          : 'text-[var(--fg-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--fg)]'
      }`}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {label}
    </button>
  )
}
