import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '../../api/queryKeys'
import { adminListTransactions } from '../../api/admin'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowUpRightIcon, ArrowDownLeftIcon } from '@hugeicons/core-free-icons'
import { AdminLayout } from '../../components/admin/AdminLayout'
import { DataTable } from '../../components/DataTable'
import type { Column } from '../../components/DataTable'
import type { CoinTransaction } from '../../types/server'

export default function AdminCoinsPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.admin.transactions,
    queryFn: () => adminListTransactions(500, 0),
  })

  const transactions = Array.isArray(data?.transactions) ? data!.transactions : []

  const columns: Column<CoinTransaction>[] = [
    {
      label: 'Type',
      width: 'w-40',
      render: (tx) => (
        <div className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${
            tx.amount > 0 ? 'bg-emerald-500/10' : 'bg-red-500/10'
          }`}>
            <HugeiconsIcon
              icon={tx.amount > 0 ? ArrowDownLeftIcon : ArrowUpRightIcon}
              className={`w-3.5 h-3.5 ${tx.amount > 0 ? 'text-emerald-500' : 'text-red-400'}`}
            />
          </div>
          <span className="text-sm text-[var(--fg)] capitalize">{tx.type.replace(/_/g, ' ')}</span>
        </div>
      ),
    },
    {
      label: 'From',
      width: 'w-32',
      render: (tx) => (
        <span className="text-sm text-[var(--fg-secondary)] truncate block">{tx.sender_username ?? '—'}</span>
      ),
    },
    {
      label: 'To',
      width: 'w-32',
      render: (tx) => (
        <span className="text-sm text-[var(--fg-secondary)] truncate block">{tx.receiver_username}</span>
      ),
    },
    {
      label: 'Amount',
      width: 'w-24 text-right',
      render: (tx) => (
        <span className={`text-sm font-medium ${tx.amount > 0 ? 'text-emerald-500' : 'text-red-400'}`}>
          {tx.amount > 0 ? '+' : ''}{tx.amount}
        </span>
      ),
    },
    {
      label: 'Note',
      width: 'flex-1 min-w-0',
      render: (tx) => (
        <span className="text-sm text-[var(--fg-muted)] truncate block">{tx.note ?? '—'}</span>
      ),
    },
    {
      label: 'Date',
      width: 'w-28 text-right',
      render: (tx) => (
        <span className="text-xs text-[var(--fg-muted)]">
          {new Date(tx.created_at).toLocaleDateString()}
        </span>
      ),
    },
  ]

  return (
    <AdminLayout title="Coin Transactions" description="View all coin transaction history.">
      <DataTable
        data={transactions}
        columns={columns}
        searchValue={search}
        onSearch={(v) => { setSearch(v); setPage(1) }}
        loading={isLoading}
        emptyMessage="No transactions recorded yet"
        entityName="transaction"
        pagination={{
          currentPage: page,
          totalPages: Math.max(1, Math.ceil(transactions.length / 20)),
          total: transactions.length,
          onPageChange: setPage,
        }}
      />
    </AdminLayout>
  )
}
