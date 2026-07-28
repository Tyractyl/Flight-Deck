import api from './client'
import type { Tenant, TenantMember } from '../types/tenant'

export async function listTenants(): Promise<Tenant[]> {
  const { data } = await api.get('/tenants')
  return data
}

export async function createTenant(name: string): Promise<Tenant> {
  const { data } = await api.post('/tenants', { name })
  return data
}

export async function getTenant(id: string): Promise<Tenant> {
  const { data } = await api.get(`/tenants/${id}`)
  return data
}

export async function deleteTenant(id: string): Promise<void> {
  await api.delete(`/tenants/${id}`)
}

export async function listTenantMembers(tenantId: string): Promise<TenantMember[]> {
  const { data } = await api.get(`/tenants/${tenantId}/members`)
  return data
}

export async function addTenantMember(tenantId: string, userId: string): Promise<TenantMember> {
  const { data } = await api.post(`/tenants/${tenantId}/members`, { user_id: userId })
  return data
}

export async function removeTenantMember(tenantId: string, userId: string): Promise<void> {
  await api.delete(`/tenants/${tenantId}/members/${userId}`)
}

export async function updateMemberRole(tenantId: string, userId: string, role: string): Promise<void> {
  await api.patch(`/tenants/${tenantId}/members/${userId}`, { role })
}
