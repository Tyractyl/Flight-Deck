import api from './client'
import { isDemoMode } from '../store/authStore'

export interface AuditLog {
  id: string
  user_id: string
  action: string
  metadata: Record<string, unknown> | null
  ip_address: string | null
  user_agent: string | null
  created_at: string
}

export interface AuditLogResponse {
  items: AuditLog[]
  meta: {
    total: number
    page: number
    limit: number
  }
}

const DEMO_AUDIT: AuditLogResponse = {
  items: [
    { id: 'demo-1', user_id: 'demo', action: 'auth.login', metadata: null, ip_address: '127.0.0.1', user_agent: navigator.userAgent, created_at: new Date().toISOString() },
    { id: 'demo-2', user_id: 'demo', action: 'auth.register', metadata: null, ip_address: '127.0.0.1', user_agent: navigator.userAgent, created_at: new Date(Date.now() - 3600000).toISOString() },
  ],
  meta: { total: 2, page: 1, limit: 20 },
}

export async function listAuditLogs(page = 1, limit = 20) {
  try {
    const { data } = await api.get('/audit', { params: { page, limit } })
    return data as AuditLogResponse
  } catch {
    if (isDemoMode()) return DEMO_AUDIT
    return { items: [], meta: { total: 0, page: 1, limit } } as AuditLogResponse
  }
}

export async function listServerAuditLogs(serverId: string, page = 1, limit = 20) {
  const { data } = await api.get(`/servers/${serverId}/audit`, { params: { page, limit } })
  return data as { items: AuditLog[]; meta: { page: number; limit: number } }
}
