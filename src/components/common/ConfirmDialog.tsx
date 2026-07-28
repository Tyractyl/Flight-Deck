import { useEffect, useState, type ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { AlertCircleIcon } from '@hugeicons/core-free-icons'

interface ConfirmDialogProps {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'default'
  icon?: ReactNode
  onConfirm: () => void
  onCancel: () => void
  /** If true, shows a loading spinner on the confirm button */
  loading?: boolean
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  icon,
  onConfirm,
  onCancel,
  loading,
}: ConfirmDialogProps) {
  const [visible, setVisible] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    if (open) {
      setMounted(true)
      requestAnimationFrame(() => setVisible(true))
      document.body.style.overflow = 'hidden'
    } else {
      setVisible(false)
      const timer = setTimeout(() => {
        setMounted(false)
        document.body.style.overflow = ''
      }, 200)
      return () => clearTimeout(timer)
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) onCancel()
    }
    if (open) window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [open, onCancel, loading])

  if (!mounted) return null

  const isDanger = variant === 'danger'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 transition-all duration-300 ${
          visible ? 'bg-black/70 backdrop-blur-sm' : 'bg-black/0 backdrop-blur-0'
        }`}
        onClick={loading ? undefined : onCancel}
      />

      {/* Dialog */}
      <div
        className={`relative w-full max-w-sm mx-4 transition-all duration-200 ${
          visible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-2'
        }`}
      >
        <div className="relative overflow-hidden rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-card)] shadow-2xl">
          {/* Colored top accent */}
          <div className={`h-1 w-full ${isDanger ? 'bg-red-500' : 'bg-[var(--accent)]'}`} />

          <div className="p-6 space-y-4">
            {/* Header with icon */}
            <div className="flex items-start gap-4">
              <div
                className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
                  isDanger
                    ? 'bg-red-500/10 text-red-400'
                    : 'bg-[var(--accent)]/10 text-[var(--accent)]'
                }`}
              >
                {icon || (isDanger ? (
                  <HugeiconsIcon icon={AlertCircleIcon} className="w-5 h-5" />
                ) : (
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="13" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                ))}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-semibold text-[var(--fg)] font-sans">
                  {title}
                </h2>
                <p className="mt-1 text-sm text-[var(--fg-muted)] font-sans leading-relaxed">
                  {description}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-1">
              <button
                onClick={onCancel}
                disabled={loading}
                className="px-4 py-2 rounded-[8px] text-sm font-medium text-[var(--fg-muted)] bg-white/5 hover:bg-white/10 hover:text-[var(--fg)] transition-all duration-150 disabled:opacity-50 border border-[var(--border-strong)]"
              >
                {cancelLabel}
              </button>
              <button
                onClick={onConfirm}
                disabled={loading}
                className={`px-4 py-2 rounded-[8px] text-sm font-medium text-white transition-all duration-150 disabled:opacity-50 flex items-center gap-2 ${
                  isDanger
                    ? 'bg-red-600 hover:bg-red-500 shadow-lg shadow-red-600/20'
                    : 'bg-[var(--accent)] hover:brightness-110 shadow-lg shadow-[var(--accent)]/20'
                }`}
              >
                {loading && (
                  <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                )}
                {confirmLabel}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
