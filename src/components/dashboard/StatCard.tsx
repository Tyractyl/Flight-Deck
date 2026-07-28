import { HugeiconsIcon } from '@hugeicons/react'

type IconProp = React.ComponentProps<typeof HugeiconsIcon>['icon']

interface StatCardProps {
  title: string
  value: string | number
  icon?: IconProp | null
  trend?: { value: number; positive: boolean }
  className?: string
}

export function StatCard({ title, value, icon: Icon, trend, className = '' }: StatCardProps) {
  return (
    <div className={`bg-[var(--bg-card)] rounded-xl border border-theme p-5 ${className}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[var(--fg-muted)] font-sans text-xs font-medium uppercase tracking-wider">{title}</p>
          <p className="text-[var(--fg)] font-sans text-2xl font-semibold mt-1">{value}</p>
        </div>
        {Icon && (
          <div className="h-9 w-9 rounded-lg bg-[var(--bg-elevated)] flex items-center justify-center text-[var(--fg-muted)]">
            <HugeiconsIcon icon={Icon} size={18} />
          </div>
        )}
      </div>
      {trend && (
        <div className="mt-3 flex items-center gap-1.5 text-xs">
          <span className={trend.positive ? 'text-emerald-500' : 'text-red-500'}>
            {trend.positive ? '↑' : '↓'} {Math.abs(trend.value)}%
          </span>
          <span className="text-[var(--fg-muted)]">vs last period</span>
        </div>
      )}
    </div>
  )
}
