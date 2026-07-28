import { Link } from 'react-router-dom';
import api from '@/api/client';
import { CheckIcon, ChevronLeft, ChevronRight, MinusIcon, Search, Trash2, XIcon } from 'lucide-react';
import { Skeleton } from 'parthenon-ui/components';
import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Checkbox as CheckboxPrimitive } from 'radix-ui';
import { PlaceholderPattern } from '@/components/ui/PlaceholderPattern';

// ─── Minimal inline utilities ────────────────────────────────────────────────

function cn(...inputs: (string | undefined | null | false)[]) {
    return inputs.filter(Boolean).join(' ');
}

const toast = {
    success: (message: string) => console.log(message),
    error: (message: string) => console.error(message),
};

// ─── Inline UI primitives ───────────────────────────────────────────────────

function Spinner({ className, ...props }: React.ComponentProps<'svg'>) {
    return (
        <svg
            role="status"
            aria-label="Loading"
            viewBox="0 0 24 24"
            fill="none"
            className={cn('size-4 animate-spin', className)}
            {...props}
        >
            <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
            />
            <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
        </svg>
    );
}

function Button({
    className,
    variant = 'default',
    size = 'default',
    ...props
}: React.ComponentProps<'button'> & {
    variant?: 'default' | 'destructive' | 'outline' | 'ghost';
    size?: 'default' | 'table';
}) {
    return (
        <button
            type="button"
            className={cn(
                'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
                variant === 'default' && 'bg-primary text-primary-foreground hover:bg-primary/90',
                variant === 'destructive' && 'bg-destructive text-white hover:bg-destructive/90',
                variant === 'outline' && 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
                variant === 'ghost' && 'hover:bg-accent hover:text-accent-foreground',
                size === 'default' && 'h-9 px-4 py-2',
                size === 'table' && 'h-7 rounded-md px-2.5 text-xs',
                className,
            )}
            {...props}
        />
    );
}

function Checkbox({
    className,
    ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
    return (
        <CheckboxPrimitive.Root
            data-slot="checkbox"
            className={cn(
                'peer size-4 shrink-0 border border-input/70 bg-muted/80 text-transparent shadow-[0_1px_2px_rgba(0,0,0,0.06)] transition-all outline-none data-[state=checked]:border-transparent data-[state=checked]:bg-brand data-[state=checked]:text-brand-foreground data-[state=indeterminate]:border-transparent data-[state=indeterminate]:bg-brand data-[state=indeterminate]:text-brand-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50',
                className,
            )}
            style={{ borderRadius: 6 }}
            {...props}
        >
            <CheckboxPrimitive.Indicator
                data-slot="checkbox-indicator"
                className="flex items-center justify-center text-current transition-none"
            >
                {props.checked === 'indeterminate' ? (
                    <MinusIcon className="size-3" strokeWidth={3} />
                ) : (
                    <CheckIcon className="size-3" strokeWidth={3} />
                )}
            </CheckboxPrimitive.Indicator>
        </CheckboxPrimitive.Root>
    );
}

function Input({
    className,
    variant = 'default',
    ...props
}: React.ComponentProps<'input'> & { variant?: 'default' | 'table' }) {
    return (
        <input
            className={cn(
                'w-full min-w-0 rounded-md border border-input bg-transparent shadow-xs transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
                variant === 'default' && 'h-9 px-3 py-1 text-base md:text-sm',
                variant === 'table' && 'h-7 px-2.5 py-0.5 text-xs',
                className,
            )}
            {...props}
        />
    );
}

// ─── Alert Dialog primitives ─────────────────────────────────────────────────

const AlertDialogContext = createContext<
    | {
          open: boolean;
          onOpenChange: (open: boolean) => void;
      }
    | null
>(null);

function useAlertDialog() {
    const ctx = useContext(AlertDialogContext);
    if (!ctx) {
        throw new Error('AlertDialog components must be used within an AlertDialog');
    }
    return ctx;
}

function AlertDialog({
    open,
    onOpenChange,
    children,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    children: React.ReactNode;
}) {
    return (
        <AlertDialogContext.Provider value={{ open, onOpenChange }}>
            {children}
        </AlertDialogContext.Provider>
    );
}

function AlertDialogContent({ children, className }: { children: React.ReactNode; className?: string }) {
    const { open, onOpenChange } = useAlertDialog();
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => onOpenChange(false)}
                aria-hidden="true"
            />
            <div className={cn('relative z-50 w-full max-w-lg rounded-lg border bg-background p-6 shadow-xl', className)}>
                <button
                    type="button"
                    onClick={() => onOpenChange(false)}
                    className="absolute top-4 right-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none"
                    aria-label="Close"
                >
                    <XIcon className="size-4" />
                </button>
                {children}
            </div>
        </div>
    );
}

function AlertDialogHeader(props: React.ComponentProps<'div'>) {
    return <div className={cn('flex flex-col gap-2 text-center sm:text-left', props.className)} {...props} />;
}

function AlertDialogFooter(props: React.ComponentProps<'div'>) {
    return <div className={cn('flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', props.className)} {...props} />;
}

function AlertDialogTitle(props: React.ComponentProps<'h2'>) {
    return <h2 className={cn('text-lg font-semibold', props.className)} {...props} />;
}

function AlertDialogDescription(props: React.ComponentProps<'p'>) {
    return <p className={cn('text-sm text-muted-foreground', props.className)} {...props} />;
}

function AlertDialogAction({ className, onClick, ...props }: React.ComponentProps<'button'>) {
    return (
        <button
            type="button"
            className={cn(
                'inline-flex items-center justify-center rounded-md bg-destructive px-4 py-2 text-sm font-medium text-white hover:bg-destructive/90 focus:outline-none disabled:opacity-50',
                className,
            )}
            onClick={onClick}
            {...props}
        />
    );
}

function AlertDialogCancel({ className, onClick, ...props }: React.ComponentProps<'button'>) {
    const { onOpenChange } = useAlertDialog();
    return (
        <button
            type="button"
            className={cn(
                'inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground focus:outline-none disabled:opacity-50',
                className,
            )}
            onClick={(e) => {
                onOpenChange(false);
                onClick?.(e);
            }}
            {...props}
        />
    );
}

// ─── Types ───────────────────────────────────────────────────────────────────

export type PaginationLink = {
    active: boolean;
    label: string;
    url: string | null;
};

export type PaginatedData<T> = {
    data: T[];
    links: PaginationLink[];
    current_page: number;
    from: number | null;
    last_page: number;
    per_page: number;
    to: number | null;
    total: number;
};

export type Column<T> = {
    label: string;
    width: string;
    render: (item: T) => ReactNode;
};

export type PaginationInfo = {
    currentPage: number;
    totalPages: number;
    total: number;
    onPageChange: (page: number) => void;
};

type DataTableProps<T extends { id: string | number }> = {
    data: PaginatedData<T> | T[];
    columns: Column<T>[];
    searchValue: string;
    onSearch: (value: string) => void;
    onRowClick?: (item: T) => void;
    rowMenu?: (item: T) => ReactNode;
    actions?: ReactNode;
    bulkDeleteUrl?: string;
    emptyMessage?: string;
    emptySearchMessage?: string;
    entityName?: string;
    selectable?: boolean;
    selectedIds?: Set<T['id']>;
    onSelectedIdsChange?: (ids: Set<T['id']>) => void;
    loading?: boolean;
    pagination?: PaginationInfo;
};

// ─── Pagination ──────────────────────────────────────────────────────────────

type VisiblePaginationItem =
    | {
          key: string;
          page: number;
          type: 'page';
          url: string | null;
          active: boolean;
      }
    | {
          key: string;
          type: 'ellipsis';
      };

function visiblePaginationItems(
    data: PaginatedData<unknown>,
): VisiblePaginationItem[] {
    const pageLinks = data.links.slice(1, -1).map((link, index) => ({
        active: link.active,
        page: index + 1,
        url: link.url,
    }));

    if (pageLinks.length === 0) {
        return [
            {
                active: true,
                key: 'page-1',
                page: Math.max(data.current_page, 1),
                type: 'page',
                url: null,
            },
        ];
    }

    if (pageLinks.length <= 7) {
        return pageLinks.map((link) => ({
            ...link,
            key: `page-${link.page}`,
            type: 'page' as const,
        }));
    }

    const pages = new Set([
        1,
        data.current_page - 1,
        data.current_page,
        data.current_page + 1,
        data.last_page,
    ]);

    const sortedPages = [...pages]
        .filter((page) => page >= 1 && page <= data.last_page)
        .sort((left, right) => left - right);

    const items: VisiblePaginationItem[] = [];

    sortedPages.forEach((page, index) => {
        const previousPage = sortedPages[index - 1];

        if (previousPage && page - previousPage > 1) {
            items.push({
                key: `ellipsis-${previousPage}-${page}`,
                type: 'ellipsis',
            });
        }

        const link = pageLinks[page - 1];

        if (link) {
            items.push({
                ...link,
                key: `page-${page}`,
                type: 'page',
            });
        }
    });

    return items;
}

function ButtonPagination({
    pagination,
    entityName = 'item',
}: {
    pagination: PaginationInfo;
    entityName?: string;
}) {
    const { currentPage, totalPages, total, onPageChange } = pagination;

    const pages: (number | 'ellipsis')[] = [];
    if (totalPages <= 7) {
        for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
        pages.push(1);
        if (currentPage > 3) pages.push('ellipsis');
        for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
            pages.push(i);
        }
        if (currentPage < totalPages - 2) pages.push('ellipsis');
        pages.push(totalPages);
    }

    return (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
                {total} {entityName}{total === 1 ? '' : 's'}
            </p>

            <nav className="flex items-center justify-center gap-0.5" aria-label="Pagination">
                <button
                    type="button"
                    onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage <= 1}
                    className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-all duration-150 ease-out hover:bg-muted hover:text-foreground active:scale-95 active:duration-0 disabled:pointer-events-none disabled:opacity-30"
                >
                    <ChevronLeft className="h-3.5 w-3.5" />
                </button>

                {pages.map((p, i) =>
                    p === 'ellipsis' ? (
                        <span
                            key={`ellipsis-${i}`}
                            className="flex h-7 w-7 items-center justify-center text-[11px] text-muted-foreground"
                        >
                            …
                        </span>
                    ) : (
                        <button
                            key={p}
                            type="button"
                            onClick={() => onPageChange(p)}
                            className={cn(
                                'flex h-7 min-w-7 items-center justify-center rounded-md px-1.5 text-[11px] font-medium transition-all duration-150 ease-out active:scale-95 active:duration-0',
                                p === currentPage
                                    ? 'bg-muted text-foreground'
                                    : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                            )}
                        >
                            {p}
                        </button>
                    )
                )}

                <button
                    type="button"
                    onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage >= totalPages}
                    className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-all duration-150 ease-out hover:bg-muted hover:text-foreground active:scale-95 active:duration-0 disabled:pointer-events-none disabled:opacity-30"
                >
                    <ChevronRight className="h-3.5 w-3.5" />
                </button>
            </nav>
        </div>
    );
}

function DataTablePagination({ data }: { data: PaginatedData<unknown> }) {
    const items = visiblePaginationItems(data);
    const previousLink = data.links[0]?.url ?? null;
    const nextLink = data.links[data.links.length - 1]?.url ?? null;

    return (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
                Showing {data.from ?? 0}-{data.to ?? 0} of {data.total}
            </p>

            <nav
                className="flex items-center justify-center gap-0.5"
                aria-label="Pagination"
            >
                <Link
                    to={previousLink ?? '#'}
                    className={cn(
                        'flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-all duration-150 ease-out active:scale-95 active:duration-0',
                        previousLink
                            ? 'hover:bg-muted hover:text-foreground'
                            : 'pointer-events-none opacity-30',
                    )}
                >
                    <ChevronLeft className="h-3.5 w-3.5" />
                </Link>

                {items.map((item) => {
                    if (item.type === 'ellipsis') {
                        return (
                            <span
                                key={item.key}
                                className="flex h-7 w-7 items-center justify-center text-[11px] text-muted-foreground"
                            >
                                …
                            </span>
                        );
                    }

                    return (
                        <Link
                            key={item.key}
                            to={item.url ?? '#'}
                            className={cn(
                                'flex h-7 min-w-7 items-center justify-center rounded-md px-1.5 text-[11px] font-medium transition-all duration-150 ease-out active:scale-95 active:duration-0',
                                item.active
                                    ? 'bg-muted text-foreground'
                                    : item.url
                                      ? 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                                      : 'pointer-events-none opacity-30',
                            )}
                        >
                            {item.page}
                        </Link>
                    );
                })}

                <Link
                    to={nextLink ?? '#'}
                    className={cn(
                        'flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-all duration-150 ease-out active:scale-95 active:duration-0',
                        nextLink
                            ? 'hover:bg-muted hover:text-foreground'
                            : 'pointer-events-none opacity-30',
                    )}
                >
                    <ChevronRight className="h-3.5 w-3.5" />
                </Link>
            </nav>
        </div>
    );
}

// ─── Bulk action bar ─────────────────────────────────────────────────────────

function BulkActionBar({
    count,
    entityName = 'item',
    onDelete,
    onCancel,
}: {
    count: number;
    entityName?: string;
    onDelete: () => void;
    onCancel: () => void;
}) {
    const plural = count === 1 ? entityName : `${entityName}s`;

    return (
        <>
            {/* Subtle bottom gradient */}
            <div
                aria-hidden="true"
                className={cn(
                    'pointer-events-none fixed inset-x-0 bottom-0 z-40 h-24 bg-gradient-to-t from-background/80 to-transparent transition-opacity duration-300 ease-out',
                    count > 0 ? 'opacity-100' : 'opacity-0',
                )}
            />

            {/* Action bar */}
            <div
                className={cn(
                    'pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center transition-all duration-300 ease-out',
                    count > 0
                        ? 'translate-y-0 opacity-100'
                        : 'translate-y-full opacity-0',
                )}
            >
                <div className="pointer-events-auto mb-6 flex items-center gap-3 rounded-xl border border-border/70 bg-background px-4 py-2.5 shadow-lg">
                    <span className="text-xs font-medium text-muted-foreground">
                        {count} {plural} selected
                    </span>
                    <div className="h-4 w-px bg-border" />
                    <Button
                        size="table"
                        variant="destructive"
                        className="cursor-pointer"
                        onClick={onDelete}
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                    </Button>
                    <button
                        type="button"
                        onClick={onCancel}
                        className="cursor-pointer text-xs text-muted-foreground transition-colors hover:text-foreground"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </>
    );
}

// ─── Confirm delete dialog ───────────────────────────────────────────────────

export function ConfirmDeleteDialog({
    open,
    onOpenChange,
    title,
    description,
    onConfirm,
    loading,
    confirmLabel = 'Delete',
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: string;
    onConfirm: () => void;
    loading: boolean;
    confirmLabel?: string;
}) {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {description}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={loading}>
                        Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                        className="bg-destructive text-white hover:bg-destructive/90"
                        disabled={loading}
                        onClick={(e) => {
                            e.preventDefault();
                            onConfirm();
                        }}
                    >
                        {loading && <Spinner />}
                        {confirmLabel}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

// ─── Data table row ──────────────────────────────────────────────────────────

function DataTableRow<T extends { id: string | number }>({
    item,
    columns,
    isSelected,
    onToggle,
    onClick,
    menu,
    selectable,
}: {
    item: T;
    columns: Column<T>[];
    isSelected: boolean;
    onToggle: () => void;
    onClick?: () => void;
    menu?: ReactNode;
    selectable: boolean;
}) {
    return (
        <div
            className={cn(
                'group relative overflow-hidden rounded-lg transition-colors duration-150 ease-out',
                isSelected
                    ? 'bg-brand/15 dark:bg-brand/25 ring-2 ring-inset ring-brand/60'
                    : ''
            )}
        >
            <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-lg opacity-0 transition-opacity group-hover:opacity-100">
                <PlaceholderPattern
                    patternSize={6}
                    className="size-full stroke-neutral-900/10 dark:stroke-neutral-100/10"
                />
            </div>
            <div
                className={cn(
                    'relative flex items-center px-3 py-2',
                    onClick && 'cursor-pointer',
                )}
                onClick={onClick}
            >
                {selectable ? (
                    <div
                        className="mr-3 flex items-center"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Checkbox
                            checked={isSelected}
                            onCheckedChange={onToggle}
                            aria-label="Select row"
                        />
                    </div>
                ) : null}

                {columns.map((col, i) => (
                    <div key={i} className={col.width}>
                        {col.render(item)}
                    </div>
                ))}

                {menu && (
                    <div
                        className="ml-auto flex items-center"
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                    >
                        {menu}
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Main data table ─────────────────────────────────────────────────────────

export function DataTable<T extends { id: string | number }>({
    data,
    columns,
    searchValue,
    onSearch,
    onRowClick,
    rowMenu,
    actions,
    bulkDeleteUrl,
    emptyMessage = 'No items found',
    emptySearchMessage = 'Try a different search term.',
    entityName = 'item',
    selectable = true,
    selectedIds,
    onSelectedIdsChange,
    loading = false,
    pagination,
}: DataTableProps<T>) {
    const normalizedData: PaginatedData<T> = Array.isArray(data)
        ? {
              data,
              links: [],
              current_page: 1,
              from: data.length > 0 ? 1 : null,
              last_page: 1,
              per_page: data.length,
              to: data.length,
              total: data.length,
          }
        : data;

    const [uncontrolledSelected, setUncontrolledSelected] = useState<
        Set<T['id']>
    >(new Set());
    const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
    const [bulkDeleting, setBulkDeleting] = useState(false);

    const selected = selectedIds ?? uncontrolledSelected;
    const setSelected = (value: Set<T['id']>): void => {
        if (selectedIds === undefined) {
            setUncontrolledSelected(value);
        }

        onSelectedIdsChange?.(value);
    };

    const allSelected =
        normalizedData.data.length > 0 && selected.size === normalizedData.data.length;
    const someSelected = selected.size > 0 && !allSelected;

    const toggleAll = () => {
        if (allSelected) {
            setSelected(new Set());
        } else {
            setSelected(new Set(normalizedData.data.map((item) => item.id)));
        }
    };

    const toggleOne = (id: T['id']) => {
        const next = new Set(selected);
        if (next.has(id)) {
            next.delete(id);
        } else {
            next.add(id);
        }
        setSelected(next);
    };

    // Clear selection on data change
    useEffect(() => {
        setSelected(new Set());
    }, [normalizedData.current_page, normalizedData.data]);

    // Smooth height animation
    const tableBodyRef = useRef<HTMLDivElement>(null);
    const innerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const outer = tableBodyRef.current;
        const inner = innerRef.current;
        if (!outer || !inner) {
            return;
        }

        const newHeight = inner.scrollHeight;
        const oldHeight = outer.offsetHeight;

        if (!oldHeight || Math.abs(newHeight - oldHeight) < 1) {
            outer.style.height = `${newHeight}px`;
            return;
        }

        outer.style.transition = 'none';
        outer.style.height = `${oldHeight}px`;
        void outer.offsetHeight;
        outer.style.transition = 'height 300ms ease-in-out';
        outer.style.height = `${newHeight}px`;
    });

    return (
        <>
            {/* Connected card: top toolbar, body, bottom toolbar */}
            <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-muted/80 shadow-sm">
                {/* Top toolbar: labels + actions */}
                <div className="flex flex-col gap-2 px-4 py-2 pb-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 flex-1 items-center">
                        {selectable ? (
                            <div className="mr-3 flex items-center">
                                <Checkbox
                                    checked={
                                        allSelected
                                            ? true
                                            : someSelected
                                              ? 'indeterminate'
                                              : false
                                    }
                                    onCheckedChange={toggleAll}
                                    aria-label="Select all"
                                />
                            </div>
                        ) : null}
                        {columns.map((col, i) => (                                <span
                                key={i}
                                className={cn(
                                    'block text-xs font-medium text-muted-foreground/80',
                                    col.width,
                                )}
                            >
                                {col.label}
                            </span>
                        ))}
                        {rowMenu ? <div className="ml-auto w-7 shrink-0" /> : null}
                    </div>
                    {actions && <div className="ml-auto flex shrink-0 items-center gap-2 pl-4">{actions}</div>}
                </div>

                {/* Body */}
                <div
                    ref={tableBodyRef}
                    className="relative z-10 -my-2 mx-0 overflow-hidden rounded-xl bg-background px-1"
                >
                    <div ref={innerRef} className="flex flex-col gap-1 py-1">
                        {loading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <Skeleton key={i} className="h-12 w-full rounded-lg" />
                            ))
                        ) : normalizedData.data.length > 0 ? (
                            normalizedData.data.map((item) => (
                                <DataTableRow
                                    key={item.id}
                                    item={item}
                                    columns={columns}
                                    isSelected={selected.has(item.id)}
                                    onToggle={() => toggleOne(item.id)}
                                    onClick={
                                        onRowClick
                                            ? () => onRowClick(item)
                                            : undefined
                                    }
                                    menu={rowMenu?.(item)}
                                    selectable={selectable}
                                />
                            ))
                        ) : (
                            <div className="px-4 py-12 text-center">
                                <p className="text-sm font-medium text-foreground">
                                    {emptyMessage}
                                </p>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    {searchValue
                                        ? emptySearchMessage
                                        : `${entityName.charAt(0).toUpperCase() + entityName.slice(1)}s will appear here.`}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Bottom toolbar: search + pagination */}
                <div className="flex flex-col gap-2 px-4 py-2 pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="relative flex w-full items-center sm:w-auto">
                        <Search className="absolute top-1/2 left-2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            variant="table"
                            value={searchValue}
                            onChange={(e) => onSearch(e.target.value)}
                            placeholder="Search..."
                            aria-label="Search"
                            className="w-full pl-7 sm:w-44"
                        />
                    </div>
                    {pagination ? (
                    <ButtonPagination pagination={pagination} entityName={entityName} />
                ) : (
                    <DataTablePagination data={normalizedData} />
                )}
                </div>
            </div>

            {bulkDeleteUrl && selected.size > 0 && <div className="h-16" />}

            {bulkDeleteUrl && (
                <>
                    <BulkActionBar
                        count={selected.size}
                        entityName={entityName}
                        onDelete={() => setConfirmBulkDelete(true)}
                        onCancel={() => setSelected(new Set())}
                    />

                    <ConfirmDeleteDialog
                        open={confirmBulkDelete}
                        onOpenChange={setConfirmBulkDelete}
                        title={`Delete ${selected.size} ${selected.size === 1 ? entityName : `${entityName}s`}?`}
                        description="This action cannot be undone. The selected items will be permanently removed."
                        loading={bulkDeleting}
                        onConfirm={() => {
                            setBulkDeleting(true);
                            (async () => {
                                try {
                                    await api.delete(bulkDeleteUrl, {
                                        data: { ids: Array.from(selected) },
                                    });
                                    toast.success(
                                        `${selected.size} ${selected.size === 1 ? entityName : `${entityName}s`} deleted`,
                                    );
                                    setSelected(new Set());
                                    setConfirmBulkDelete(false);
                                } catch {
                                    toast.error('Failed to delete selected items.');
                                } finally {
                                    setBulkDeleting(false);
                                }
                            })();
                        }}
                    />
                </>
            )}
        </>
    );
}
