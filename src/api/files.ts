import api from './client'

export interface FileEntry {
  name: string
  path: string
  is_dir: boolean
  size: number
  modified_at: string
}

export async function listFiles(serverId: string, path: string = '/') {
  const { data } = await api.get(`/servers/${serverId}/files`, { params: { path } })
  return data as FileEntry[]
}

export async function readFile(serverId: string, path: string) {
  const { data } = await api.get(`/servers/${serverId}/files/read`, { params: { path } })
  return data as { content: string; encoding?: string }
}

export async function writeFile(serverId: string, path: string, content: string) {
  await api.post(`/servers/${serverId}/files/write`, { path, content }, {
    headers: { 'Content-Type': 'text/plain' },
  })
}

export async function createFileOrFolder(serverId: string, path: string, type: 'file' | 'folder') {
  await api.post(`/servers/${serverId}/files/create`, { path, type })
}

export async function deleteFileOrFolder(serverId: string, path: string) {
  await api.delete(`/servers/${serverId}/files/${path}`)
}

export async function renameFileOrFolder(serverId: string, oldPath: string, newPath: string) {
  await api.put(`/servers/${serverId}/files/rename`, { old_path: oldPath, new_path: newPath })
}

export async function uploadFile(serverId: string, path: string, file: File) {
  const formData = new FormData()
  formData.append('file', file)
  await api.post(`/servers/${serverId}/files/upload`, formData, {
    params: { path },
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}
