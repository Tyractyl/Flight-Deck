import { useEffect, useRef, useState, type ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Search01Icon, ArrowLeft01Icon, ArrowRight01Icon, MoreVerticalIcon } from '@hugeicons/core-free-icons'
import { Skeleton } from 'parthenon-ui/components'
import { PlaceholderPattern } from '../ui/PlaceholderPattern'
import { Input } from '../ui/Input'

// ─── Types ───────────────────────────────────────────────────────────────────

export type Column<T> = {
  label: string
  width: string
  render: (item: T) => ReactNode
}

export type AdminDataTableProps<T> = {
  data: T[]
  columns: Column<T>[]
  searchValue: string
  onSearch: (value: string) => void
  onRowClick?: (item: T) => void
  rowMenu?: (item: T) => ReactNode
  actions?: ReactNode
  loading?: boolean
  emptyMessage?: string
  emptySearchMessage?: string
  entityName?: string
  getItemKey?: (item: T, index: number) => string | number
  /** Client-side pagination */
  pageSize?: number
  page?: number
  onPageChange?: (page: number) => void
  totalCount?: number
  /** Server-side pagination info (if data is already paginated) */
  paginationInfo?: { page: number; totalPages: number; onPageChange: (p: number) => void }
}

// ─── Pagination ──────────────────────────────────────────────────────────────

function PaginationBar({
  page,
  totalPages,
  onPageChange,
  totalCount,
  entityName,
}: {
  page: number
  totalPages: number
  onPageChange: (p: number) => void
  totalCount?: number
  entityName?: string
}) {
  if (totalPages <= 1) return null

  // Generate visible page numbers with ellipsis
  const pages: (number | 'ellipsis')[] = []
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i)
  } else {
    pages.push(1)
    if (page > 3) pages.push('ellipsis')
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
      pages.push(i)
    }
    if (page < totalPages - 2) pages.push('ellipsis')
    pages.push(totalPages)
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      {totalCount !== undefined ? (
        <p className="text-sm text-[var(--fg-muted)]">
          {totalCount} {entityName ?? 'item'}{totalCount !== 1 ? 's' : ''}
        </p>
      ) : (
        <p className="text-sm text-[var(--fg-muted)]">
          Page {page} of {totalPages}
        </p>
      )}

      <nav className="flex items-center justify-center gap-0.5" aria-label="Pagination">
        <button
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="flex h-8 w-8 items-center justify-center rounded-md text-[var(--fg-muted)] transition-all duration-150 ease-out hover:bg-[var(--bg-elevated)] hover:text-[var(--fg)] active:scale-95 active:duration-0 disabled:pointer-events-none disabled:opacity-30"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} className="h-4 w-4" />
        </button>

        {pages.map((p, i) =>
          p === 'ellipsis' ? (
            <span key={`ellipsis-${i}`} className="flex h-8 w-8 items-center justify-center text-xs text-[var(--fg-muted)]">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-xs font-medium transition-all duration-150 ease-out active:scale-95 active:duration-0 ${
                p === page
                  ? 'bg-[var(--bg-elevated)] text-[var(--fg)]'
                  : 'text-[var(--fg-muted)] hover:bg-[var(--bg-elevated)]/60 hover:text-[var(--fg)]'
              }`}
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          className="flex h-8 w-8 items-center justify-center rounded-md text-[var(--fg-muted)] transition-all duration-150 ease-out hover:bg-[var(--bg-elevated)] hover:text-[var(--fg)] active:scale-95 active:duration-0 disabled:pointer-events-none disabled:opacity-30"
        >
          <HugeiconsIcon icon={ArrowRight01Icon} className="h-4 w-4" />
        </button>
      </nav>
    </div>
  )
}

// ─── Row Menu (3-dot dropdown) ───────────────────────────────────────────────

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

// ─── Main Data Table ─────────────────────────────────────────────────────────

export function AdminDataTable<T>({
  data,
  columns,
  searchValue,
  onSearch,
  onRowClick,
  rowMenu,
  actions,
  loading = false,
  emptyMessage = 'No items found',
  emptySearchMessage = 'Try a different search term.',
  entityName = 'item',
  getItemKey,
  pageSize = 20,
  page: controlledPage,
  onPageChange: controlledPageChange,
  totalCount,
  paginationInfo,
}: AdminDataTableProps<T>) {
  // Client-side pagination state
  const [internalPage, setInternalPage] = useState(1)
  const page = paginationInfo?.page ?? controlledPage ?? internalPage
  const pageChange = paginationInfo?.onPageChange ?? controlledPageChange ?? setInternalPage

  // Reset to page 1 on search
  const lastSearchRef = useRef(searchValue)
  useEffect(() => {
    if (searchValue !== lastSearchRef.current) {
      lastSearchRef.current = searchValue
      if (!paginationInfo && !controlledPage) setInternalPage(1)
    }
  }, [searchValue, paginationInfo, controlledPage])

  // Calculate pagination
  const total = totalCount ?? data.length
  const totalPages = paginationInfo?.totalPages ?? Math.max(1, Math.ceil(data.length / pageSize))
  const displayData = paginationInfo
    ? data // Server-side paginated: data is already sliced
    : data.slice((page - 1) * pageSize, page * pageSize)

  // Smooth height animation
  const bodyRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const outer = bodyRef.current
    const inner = innerRef.current
    if (!outer || !inner) return

    const newHeight = inner.scrollHeight
    const oldHeight = outer.offsetHeight

    if (!oldHeight || Math.abs(newHeight - oldHeight) < 1) {
      outer.style.height = `${newHeight}px`
      return
    }

    outer.style.transition = 'none'
    outer.style.height = `${oldHeight}px`
    void outer.offsetHeight
    outer.style.transition = 'height 300ms ease-in-out'
    outer.style.height = `${newHeight}px`
  }, [displayData.length, loading])

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-lg bg-[var(--bg-elevated)]">
        {/* Header toolbar */}
        <div className="flex flex-col gap-2 px-4 py-2.5 sm:flex-row sm:items-center">
          {/* Column headers (desktop) */}
          <div className="hidden flex-1 items-center sm:flex">
            {columns.map((col, i) => (
              <span
                key={i}
                className={`block text-sm font-medium text-[var(--fg-muted)] ${col.width}`}
              >
                {col.label}
              </span>
            ))}
            <div className="w-7 shrink-0" />
          </div>

          {/* Search + actions */}
          <div className="flex items-center gap-2 sm:ml-auto">
            <div className="relative flex-1 sm:flex-none">
              <HugeiconsIcon
                icon={Search01Icon}
                className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--fg-muted)]"
              />
              <Input
                value={searchValue}
                onChange={(e) => onSearch(e.target.value)}
                placeholder="Search..."
                className="sm:w-44 h-7 text-xs pl-7"
              />
            </div>
            {actions}
          </div>
        </div>

        {/* Body */}
        <div ref={bodyRef} className="overflow-hidden rounded-lg border border-[var(--border-strong)] bg-[var(--bg-card)]">
          <div ref={innerRef} className="flex flex-col gap-1 p-1">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-md" />
              ))
            ) : displayData.length > 0 ? (
              displayData.map((item, index) => (
                <div
                  key={getItemKey ? getItemKey(item, index) : index}
                  className={`group relative overflow-hidden rounded-md transition-colors duration-150 ease-out ${onRowClick ? 'cursor-pointer' : ''}`}
                  onClick={onRowClick ? () => onRowClick(item) : undefined}
                >
                  <PlaceholderPattern
                    patternSize={6}
                    className="absolute inset-0 size-full opacity-0 transition-opacity group-hover:opacity-100 stroke-[var(--fg)]/[0.06]"
                  />
                  <div className="relative flex items-center px-3 py-2.5">
                    {columns.map((col, i) => (
                      <div key={i} className={col.width}>
                        {col.render(item)}
                      </div>
                    ))}

                    {rowMenu && (
                      <div className="ml-auto flex items-center" onClick={(e) => e.stopPropagation()}>
                        {rowMenu(item)}
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="px-4 py-12 text-center">
                <p className="text-sm font-medium text-[var(--fg)]">{emptyMessage}</p>
                <p className="mt-1 text-sm text-[var(--fg-muted)]">
                  {searchValue ? emptySearchMessage : `${entityName.charAt(0).toUpperCase() + entityName.slice(1)}s will appear here.`}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pagination */}
      <PaginationBar
        page={page}
        totalPages={totalPages}
        onPageChange={pageChange}
        totalCount={total}
        entityName={entityName}
      />
    </div>
  )
}
