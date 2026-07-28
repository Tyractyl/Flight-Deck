import api from './client'

export interface BrandingSettings {
  logo_ring_enabled: boolean
  logo_ring_color: string
}

export async function getPublicSettings() {
  const { data } = await api.get('/settings')
  return data as BrandingSettings
}

export async function updateBrandingSettings(settings: Partial<BrandingSettings>) {
  const payload: Partial<BrandingSettings> = {}
  if (typeof settings.logo_ring_enabled !== 'undefined') {
    payload.logo_ring_enabled = settings.logo_ring_enabled
  }
  if (typeof settings.logo_ring_color !== 'undefined') {
    payload.logo_ring_color = settings.logo_ring_color
  }
  const { data } = await api.put('/admin/settings', payload)
  return data as { message: string }
}
