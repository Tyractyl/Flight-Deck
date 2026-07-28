import { create } from 'zustand'
import { getPublicSettings, updateBrandingSettings, type BrandingSettings } from '../api/settings'

interface BrandingState {
  settings: BrandingSettings
  isLoading: boolean
  error: string | null
  fetch: () => Promise<void>
  update: (settings: Partial<BrandingSettings>) => Promise<void>
}

const defaultSettings: BrandingSettings = {
  logo_ring_enabled: true,
  logo_ring_color: '#ffffff',
}

export const useBrandingStore = create<BrandingState>((set, get) => ({
  settings: { ...defaultSettings },
  isLoading: false,
  error: null,

  fetch: async () => {
    set({ isLoading: true, error: null })
    try {
      const settings = await getPublicSettings()
      set({ settings, isLoading: false })
    } catch (err) {
      set({ error: 'Failed to load branding settings', isLoading: false })
    }
  },

  update: async (updates) => {
    await updateBrandingSettings(updates)
    const current = get().settings
    set({ settings: { ...current, ...updates } })
  },
}))
