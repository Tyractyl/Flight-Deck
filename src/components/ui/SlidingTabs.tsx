import { useCallback, useEffect, useRef, useState } from 'react'

export type Tab = {
  id: string
  label: string
}

export function SlidingTabs({
  tabs,
  active,
  onChange,
  className = '',
}: {
  tabs: Tab[]
  active: string
  onChange: (id: string) => void
  className?: string
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [indicator, setIndicator] = useState({ left: 0, width: 0, opacity: 0 })

  const updateIndicator = useCallback(() => {
    const container = containerRef.current
    if (!container) return

    const activeIndex = tabs.findIndex((t) => t.id === active)
    const activeEl = container.querySelector<HTMLElement>(
      `[data-tab-index="${activeIndex}"]`
    )
    if (!activeEl) return

    setIndicator({
      left: activeEl.offsetLeft,
      width: activeEl.offsetWidth,
      opacity: 1,
    })
  }, [active, tabs])

  useEffect(() => {
    updateIndicator()
  }, [updateIndicator])

  return (
    <div
      ref={containerRef}
      className={`relative inline-flex select-none rounded-lg bg-[var(--bg-elevated)] p-0.5 ${className}`}
    >
      {/* Sliding indicator */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-0.5 bottom-0.5 z-0 rounded-md bg-[var(--bg-card)] shadow-sm"
        style={{
          left: `${indicator.left}px`,
          width: `${indicator.width}px`,
          opacity: indicator.opacity,
          transition: 'all 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      />
      {tabs.map((tab, index) => (
        <button
          key={tab.id}
          type="button"
          data-tab-index={index}
          onClick={() => onChange(tab.id)}
          className={`relative z-10 cursor-pointer rounded-md px-3.5 py-1.5 text-sm font-medium transition-all duration-150 ease-out active:scale-95 active:duration-0 ${
            active === tab.id
              ? 'text-[var(--fg)]'
              : 'text-[var(--fg-muted)] hover:text-[var(--fg)]'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
