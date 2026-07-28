import api from './client'

export interface Backup {
  id: string
  server_id: string
  name: string
  size_bytes: number
  checksum: string | null
  status: 'creating' | 'completed' | 'failed' | 'restoring'
  error: string | null
  completed_at: string | null
  created_at: string
}

export async function listBackups(serverId: string) {
  const { data } = await api.get(`/servers/${serverId}/backups`)
  return data as Backup[]
}

export async function createBackup(serverId: string, name: string) {
  const { data } = await api.post(`/servers/${serverId}/backups`, { name })
  return data as Backup
}

export async function deleteBackup(serverId: string, backupId: string) {
  await api.delete(`/servers/${serverId}/backups/${backupId}`)
}

export async function restoreBackup(serverId: string, backupId: string) {
  await api.post(`/servers/${serverId}/backups/${backupId}/restore`)
}

export async function downloadBackup(serverId: string, backupId: string) {
  const { data } = await api.get(`/servers/${serverId}/backups/${backupId}/download`, {
    responseType: 'blob',
  })
  return data
}
