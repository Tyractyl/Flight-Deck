import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '../../api/queryKeys'
import { listTransactions } from '../../api/coins'
import { HugeiconsIcon } from '@hugeicons/react'
import { CircleDollarSignIcon, ArrowUpRight01Icon, Shield01Icon, GamepadIcon, Store01Icon } from '@hugeicons/core-free-icons'

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  if (diffSec < 60) return 'just now'
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  const diffDay = Math.floor(diffHr / 24)
  return `${diffDay}d ago`
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

interface TransactionConfig {
  label: string
  icon: typeof CircleDollarSignIcon
  color: string
  showAmount: boolean
}

const transactionConfig: Record<string, TransactionConfig> = {
  AFK_REWARD: {
    label: 'AFK Session',
    icon: GamepadIcon,
    color: 'text-green-500',
    showAmount: true,
  },
  USER_TRANSFER: {
    label: 'Transfer',
    icon: ArrowUpRight01Icon,
    color: 'text-blue-500',
    showAmount: true,
  },
  STORE_PURCHASE: {
    label: 'Store Purchase',
    icon: Store01Icon,
    color: 'text-purple-500',
    showAmount: true,
  },
  ADMIN_GRANT: {
    label: 'Admin Grant',
    icon: Shield01Icon,
    color: 'text-yellow-500',
    showAmount: true,
  },
  ADMIN_DEDUCT: {
    label: 'Admin Deduct',
    icon: Shield01Icon,
    color: 'text-red-500',
    showAmount: true,
  },
}

export function ActivityLog() {
  const { data: transactions, isLoading } = useQuery({
    queryKey: queryKeys.coins.transactions,
    queryFn: () => listTransactions(10, 0),
  })

  return (
    <div className="bg-[var(--bg-card)] rounded-xl border border-theme p-5">
      <h3 className="text-base font-semibold text-[var(--fg)] mb-4">Recent Activity</h3>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-[var(--bg-elevated)]" />
              <div className="flex-1 space-y-1">
                <div className="h-3 w-24 bg-[var(--bg-elevated)] rounded" />
                <div className="h-2 w-16 bg-[var(--bg-elevated)] rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : !Array.isArray(transactions) || transactions.length === 0 ? (
        <p className="text-sm text-[var(--fg-muted)] text-center py-6">No activity yet</p>
      ) : (
        <div className="space-y-2">
          {transactions.slice(0, 8).map((tx) => {
            const config = transactionConfig[tx.type] || { label: tx.type, icon: CircleDollarSignIcon, color: 'text-[var(--fg-muted)]', showAmount: true }
            const Icon = config.icon
            const isPositive = tx.amount > 0

            return (
              <div key={tx.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--bg-elevated)] transition-colors">
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${isPositive ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                  <HugeiconsIcon icon={Icon} size={16} className={config.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-[var(--fg)]">{config.label}</span>
                    {config.showAmount && (
                      <span className={`text-sm font-semibold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                        {isPositive ? '+' : ''}{tx.amount}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[var(--fg-muted)]">
                    <span>{formatTimeAgo(tx.created_at)}</span>
                    <span>at {formatTime(tx.created_at)}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
