import type { ReactNode } from 'react'

export function AdminLayout({
  title,
  description,
  actions,
  children,
}: {
  title: string
  description: string
  actions?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="space-y-6 flex-1 flex flex-col h-full min-h-0">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-[var(--fg)] text-2xl font-semibold">{title}</h1>
          <p className="text-[var(--fg-muted)] text-sm mt-1">{description}</p>
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      <div className="flex-1 min-h-0 overflow-auto">
        {children}
      </div>
    </div>
  )
}
