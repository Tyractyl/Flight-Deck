import { useState, type ReactNode } from 'react'

interface TooltipProps {
  content: string
  children: ReactNode
  className?: string
}

export function Tooltip({ content, children, className = '' }: TooltipProps) {
  const [show, setShow] = useState(false)

  return (
    <div
      className={`relative inline-flex ${className}`}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs text-[var(--fg)] bg-[var(--bg-elevated)] border border-theme rounded-md whitespace-nowrap z-50 pointer-events-none">
          {content}
        </div>
      )}
    </div>
  )
}
