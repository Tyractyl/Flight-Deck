import api from './client'

export interface Subuser {
  id: string
  server_id: string
  user_id: string
  username: string
  email: string
  permissions: string[]
  created_at: string
}

export async function listSubusers(serverId: string) {
  const { data } = await api.get(`/servers/${serverId}/users`)
  return data as Subuser[]
}

export async function addSubuser(serverId: string, email: string, permissions: string[]) {
  const { data } = await api.post(`/servers/${serverId}/users`, { email, permissions })
  return data
}

export async function updateSubuserPermissions(serverId: string, subuserId: string, permissions: string[]) {
  await api.patch(`/servers/${serverId}/users/${subuserId}`, { permissions })
}

export async function removeSubuser(serverId: string, subuserId: string) {
  await api.delete(`/servers/${serverId}/users/${subuserId}`)
}
