import { useState, useEffect } from 'react'
import { useBrandingStore } from '../../store/brandingStore'
import { AdminLayout } from '../../components/admin/AdminLayout'
import Button from '../../components/Button'
import { sileo } from 'sileo'

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
        checked ? 'bg-[var(--fg)]' : 'bg-[var(--border-strong)]'
      }`}
    >
      <span
        className={`inline-block h-5 w-5 rounded-full bg-[var(--bg-card)] shadow transition-transform duration-200 ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  )
}

export default function AdminBrandingPage() {
  const { settings, update, isLoading } = useBrandingStore()
  const [enabled, setEnabled] = useState(settings.logo_ring_enabled)
  const [color, setColor] = useState(settings.logo_ring_color)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setEnabled(settings.logo_ring_enabled)
    setColor(settings.logo_ring_color)
  }, [settings.logo_ring_enabled, settings.logo_ring_color])

  const handleSave = async () => {
    setSaving(true)
    try {
      await update({ logo_ring_enabled: enabled, logo_ring_color: color })
      sileo.success({ description: 'Branding settings saved', icon: false })
    } catch {
      sileo.error({ description: 'Failed to save branding settings', icon: false })
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    setEnabled(settings.logo_ring_enabled)
    setColor(settings.logo_ring_color)
  }

  return (
    <AdminLayout title="Branding" description="Customize the panel appearance.">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(260px,360px)] max-w-5xl">
        {/* Controls */}
        <div className="rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-card)] p-6 shadow-sm">
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-[var(--fg)]">Logo ring</h3>
            <p className="text-xs text-[var(--fg-muted)] mt-1">Show a colored ring around the logo on hover.</p>
          </div>

          <div className="flex items-center justify-between py-4 border-b border-[var(--border)]">
            <span className="text-sm text-[var(--fg)]">Enable ring</span>
            <Toggle checked={enabled} onChange={setEnabled} />
          </div>

          <div className="py-4">
            <label className="block text-xs font-medium text-[var(--fg-muted)] mb-2">Ring color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-10 w-16 cursor-pointer rounded-lg border border-[var(--border-strong)] bg-transparent p-1"
              />
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-10 flex-1 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-elevated)] px-3 text-sm text-[var(--fg)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4">
            <Button variant="secondary" height={34} onClick={handleReset}>
              Reset
            </Button>
            <Button height={34} onClick={handleSave} loading={saving || isLoading}>
              Save changes
            </Button>
          </div>
        </div>

        {/* Preview */}
        <div className="rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-card)] p-6 shadow-sm flex flex-col items-center justify-center">
          <p className="text-xs font-medium text-[var(--fg-muted)] uppercase tracking-wider mb-6">Preview</p>
          <div className="group relative w-28 h-28">
            {enabled && (
              <div
                className="absolute inset-0 z-0 opacity-100 transition-opacity duration-300 pointer-events-none"
                style={{
                  backgroundColor: color || '#ffffff',
                  maskImage: `url('/2353329381.png')`,
                  maskSize: 'contain',
                  maskRepeat: 'no-repeat',
                  maskPosition: 'center',
                  WebkitMaskImage: `url('/2353329381.png')`,
                  WebkitMaskSize: 'contain',
                  WebkitMaskRepeat: 'no-repeat',
                  WebkitMaskPosition: 'center',
                  transform: 'scale(1.04)',
                }}
              />
            )}
            <img
              src="/2353329381.png"
              className="w-full h-full object-contain relative z-10"
              alt="Logo preview"
            />
          </div>
          <p className="mt-4 text-xs text-[var(--fg-muted)] text-center">
            Hover the logo in the preview to see the ring.
          </p>
        </div>
      </div>
    </AdminLayout>
  )
}
