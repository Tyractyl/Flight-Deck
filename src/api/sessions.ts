import api from './client'
import { isDemoMode } from '../store/authStore'

export interface UserSession {
  id: string
  user_id: string
  ip_address: string
  user_agent: string
  is_current: boolean
  expires_at: string
  created_at: string
}

const DEMO_SESSIONS: UserSession[] = [
  {
    id: 'demo-session-1',
    user_id: 'demo-user',
    ip_address: '127.0.0.1',
    user_agent: navigator.userAgent,
    is_current: true,
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
  },
]

export async function listSessions() {
  try {
    const { data } = await api.get('/sessions')
    return data as UserSession[]
  } catch {
    if (isDemoMode()) return DEMO_SESSIONS
    return [] as UserSession[]
  }
}

export async function revokeSession(id: string) {
  await api.delete(`/sessions/${id}`)
}

export async function revokeAllSessions() {
  await api.delete('/sessions')
}
