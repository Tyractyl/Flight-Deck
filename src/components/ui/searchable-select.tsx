import { Check, ChevronsUpDown, Search } from "lucide-react"
import { useRef, useState } from "react"

import { useSlidingCaret } from "../../hooks/useSlidingCaret"
import { cn } from "../../utils/cn"
import { Popover, PopoverContent, PopoverTrigger } from "./popover"

export type SearchableSelectOption = {
  value: string
  label: string
  description?: string
}

export function SearchableSelect({
  options,
  value,
  onValueChange,
  placeholder = "Select…",
  searchPlaceholder = "Search…",
  emptyMessage = "No results found.",
  className,
  disabled,
  id,
}: {
  options: SearchableSelectOption[]
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  className?: string
  disabled?: boolean
  id?: string
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement | null>(null)
  const searchCaretRef = useSlidingCaret<HTMLDivElement>()
  const [hoverBox, setHoverBox] = useState({ top: 0, height: 0, opacity: 0 })
  // When this popover is open inside a modal dialog, the dialog's scroll lock
  // swallows wheel events aimed at the portaled list. A native non-passive
  // listener (attached in the ref callback, when the node actually mounts)
  // scrolls the options manually — React's onWheel is passive, so
  // preventDefault wouldn't stick there.
  const wheelHandlerRef = useRef<((e: WheelEvent) => void) | null>(null)
  const attachListRef = (node: HTMLDivElement | null) => {
    if (listRef.current && wheelHandlerRef.current) {
      listRef.current.removeEventListener('wheel', wheelHandlerRef.current)
    }
    listRef.current = node
    wheelHandlerRef.current = null
    if (node) {
      const handler = (e: WheelEvent) => {
        const canScroll = node.scrollHeight > node.clientHeight
        const up = e.deltaY < 0
        const atEdge = (up && node.scrollTop <= 0) || (!up && node.scrollTop + node.clientHeight >= node.scrollHeight)
        if (canScroll && !atEdge) {
          e.preventDefault()
          e.stopPropagation()
          node.scrollTop += e.deltaY
        }
      }
      wheelHandlerRef.current = handler
      node.addEventListener('wheel', handler, { passive: false })
    }
  }

  const selected = options.find((o) => o.value === value)
  const query = search.toLowerCase()
  const filtered = query
    ? options.filter(
        (o) =>
          o.label.toLowerCase().includes(query) ||
          (o.description?.toLowerCase().includes(query) ?? false),
      )
    : options

  const moveHighlight = (el: HTMLElement) => {
    const list = listRef.current
    if (!list) return
    const listRect = list.getBoundingClientRect()
    const rect = el.getBoundingClientRect()
    setHoverBox({ top: rect.top - listRect.top + list.scrollTop, height: rect.height, opacity: 1 })
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) {
          setSearch("")
        }
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          id={id}
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "flex h-9 w-full items-center justify-between gap-2 rounded-lg bg-input/50 dark:bg-input px-3 py-2 text-sm outline-none transition-[color,box-shadow] focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50",
            className,
          )}
        >
          <span
            className={cn(
              "truncate",
              !selected && "text-muted-foreground",
            )}
          >
            {selected ? selected.label : placeholder}
          </span>
          <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="p-0"
        onOpenAutoFocus={(e) => {
          e.preventDefault()
          inputRef.current?.focus()
        }}
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <div className="p-1">
          <div ref={searchCaretRef} className="relative flex items-center gap-2 rounded-md bg-[var(--fg)]/5 px-2.5 py-1">
            <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <input
              ref={inputRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="h-6 w-full bg-transparent text-sm text-[var(--fg)] placeholder:text-muted-foreground outline-none"
            />
          </div>
        </div>
        <div
          ref={attachListRef}
          className="relative max-h-60 overflow-y-auto p-1"
          onMouseLeave={() => setHoverBox((b) => ({ ...b, opacity: 0 }))}
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-1 rounded-md bg-[var(--fg)]/5"
            style={{
              top: hoverBox.top,
              height: hoverBox.height,
              opacity: hoverBox.opacity,
              transition: 'all 0.25s cubic-bezier(0.22, 1, 0.36, 1)',
            }}
          />
          {filtered.length === 0 ? (
            <p className="px-3 py-4 text-center text-xs text-muted-foreground">
              {emptyMessage}
            </p>
          ) : (
            filtered.map((option) => (
              <button
                key={option.value}
                type="button"
                onMouseEnter={(e) => moveHighlight(e.currentTarget)}
                onClick={() => {
                  onValueChange(option.value === value ? "" : option.value)
                  setOpen(false)
                  setSearch("")
                }}
                className="relative flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm"
              >
                <Check
                  className={cn(
                    "h-3.5 w-3.5 shrink-0",
                    option.value === value
                      ? "text-[var(--fg)]"
                      : "text-transparent",
                  )}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-[var(--fg)]">
                    {option.label}
                  </p>
                  {option.description && (
                    <p className="truncate text-xs text-muted-foreground">
                      {option.description}
                    </p>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
