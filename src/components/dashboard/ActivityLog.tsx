import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '../../api/queryKeys'
import { listTransactions } from '../../api/coins'

const typeLabels: Record<string, string> = {
  AFK_REWARD: 'AFK reward',
  USER_TRANSFER: 'Transfer',
  STORE_PURCHASE: 'Store purchase',
  ADMIN_GRANT: 'Admin grant',
  ADMIN_DEDUCT: 'Admin deduct',
}

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp)
  if (Number.isNaN(date.getTime())) return String(timestamp)
  const diffSeconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (diffSeconds < 45) return 'just now'
  if (diffSeconds < 90) return '1 min ago'
  const diffMinutes = Math.floor(diffSeconds / 60)
  if (diffMinutes < 60) return `${diffMinutes} min${diffMinutes === 1 ? '' : 's'} ago`
  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`
  return date.toLocaleString()
}

export function ActivityLog() {
  const { data: transactions, isLoading } = useQuery({
    queryKey: queryKeys.coins.transactions,
    queryFn: () => listTransactions(10, 0),
  })

  const [pageSize, setPageSize] = useState(3)

  const items = Array.isArray(transactions) ? transactions : []
  const displayed = items.slice(0, pageSize)

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-[var(--fg)]">Recent activity</h2>
          <p className="text-xs text-[var(--fg-muted)] mt-1">An activity log of recent actions</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-[var(--fg-muted)]">
          <span className="whitespace-nowrap">Rows</span>
          <div className="w-24">
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="w-full h-8 rounded-md border border-[var(--border)] bg-[var(--bg-card)] px-2 text-xs text-[var(--fg)] outline-none focus:ring-2 focus:ring-[var(--border-strong)]"
            >
              <option value={3}>3</option>
              <option value={5}>5</option>
              <option value={10}>10</option>
            </select>
          </div>
        </div>
      </div>

      {isLoading && items.length === 0 ? (
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-px bg-gradient-to-b from-[var(--border)] via-[var(--fg-muted)] to-[var(--border)]" />
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, idx) => (
              <div key={idx} className="relative flex gap-3 pl-10">
                <div className="absolute left-4 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-sm bg-[var(--fg-muted)] animate-pulse" />
                <div className="flex-1 rounded-md border border-[var(--border)]/80 bg-[var(--bg-card)]/60 p-3">
                  <div className="h-3 w-40 bg-[var(--bg-elevated)] rounded animate-pulse" />
                  <div className="mt-2 h-2.5 w-60 bg-[var(--bg-elevated)] rounded animate-pulse" />
                  <div className="mt-3 h-2 w-24 bg-[var(--bg-elevated)] rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : displayed.length === 0 ? (
        <div className="rounded-md border border-dashed border-[var(--border)] py-8 text-center">
          <p className="text-sm font-medium text-[var(--fg)]">No activity yet</p>
          <p className="text-xs text-[var(--fg-muted)] mt-1">Transactions and account updates will show up here.</p>
        </div>
      ) : (
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-px bg-gradient-to-b from-[var(--border)] via-[var(--fg-muted)] to-[var(--border)]" />
          <div className="space-y-3">
            {displayed.map((item) => (
              <div key={item.id} className="relative flex gap-3 pl-10">
                <div className="absolute left-4 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-sm bg-[var(--fg-muted)]" />
                <div className="flex-1 rounded-md border border-[var(--border)]/80 bg-[var(--bg-card)]/60 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-sm text-[var(--fg)] font-medium">
                      <span>{typeLabels[item.type] || item.type}</span>
                    </div>
                    <span className="text-xs text-[var(--fg-muted)]">{formatTimestamp(item.created_at)}</span>
                  </div>
                  {item.note && (
                    <p className="mt-1 text-xs text-[var(--fg-muted)]">{item.note}</p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] uppercase tracking-[0.3em] text-[var(--fg-muted)]">
                    <span>Amount {item.amount}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
