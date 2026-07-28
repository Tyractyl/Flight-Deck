import api from './client'

export interface BrandingSettings {
  logo_ring_enabled: boolean
  logo_ring_color: string
  show_status_card: boolean
  announcement_enabled: boolean
  announcement_text: string
}

export async function getPublicSettings() {
  const { data } = await api.get('/settings')
  return data as BrandingSettings
}

export async function updateBrandingSettings(settings: Partial<BrandingSettings>) {
  const { data } = await api.put('/admin/settings', settings)
  return data as { message: string }
}
