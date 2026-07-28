import api from './client'
import type { User, Server, Node, Egg, StoreItem, CoinTransaction } from '../types/server'

export async function adminListUsers(limit = 20, offset = 0) {
  const { data } = await api.get('/admin/users', { params: { limit, offset } })
  return data as { users: User[]; total: number }
}

export async function adminGetUser(id: string) {
  const { data } = await api.get(`/admin/users/${id}`)
  return data as User
}

export async function adminUpdateUser(id: string, payload: Partial<User>) {
  await api.patch(`/admin/users/${id}`, payload)
}

export async function adminDeleteUser(id: string) {
  await api.delete(`/admin/users/${id}`)
}

export async function adminModifyCoins(id: string, amount: number, type: 'grant' | 'deduct', note?: string) {
  await api.post(`/admin/users/${id}/coins`, { amount, type, note })
}

export async function adminListServers(limit = 20, offset = 0) {
  const { data } = await api.get('/admin/servers', { params: { limit, offset } })
  return data as { servers: Server[]; total: number }
}

export async function adminDeleteServer(id: string) {
  await api.delete(`/admin/servers/${id}`)
}

export async function adminKillServer(id: string) {
  await api.post(`/admin/servers/${id}/kill`)
}

export async function adminListNodes() {
  const { data } = await api.get('/admin/nodes')
  return data as Node[]
}

export async function adminEnrollNode(id: string) {
  const { data } = await api.post(`/admin/nodes/${id}/enroll`)
  return data as { message: string }
}

export async function adminCreateNode(payload: {
  name: string
  fqdn: string
  port: number
  total_memory: number
  total_disk: number
  total_cpu: number
  gpu_enabled?: boolean
}) {
  const { data } = await api.post('/admin/nodes', payload)
  return data as Node
}

export async function adminUpdateNode(id: string, payload: {
  name: string
  fqdn: string
  port: number
  total_memory: number
  total_disk: number
  total_cpu: number
  gpu_enabled?: boolean
}) {
  const { data } = await api.patch(`/admin/nodes/${id}`, payload)
  return data as Node
}

export async function adminDeleteNode(id: string) {
  await api.delete(`/admin/nodes/${id}`)
}

export async function adminListEggs() {
  const { data } = await api.get('/admin/eggs')
  return data as Egg[]
}

export async function adminDeleteEgg(id: string) {
  await api.delete(`/admin/eggs/${id}`)
}

export async function adminListStoreItems() {
  const { data } = await api.get('/admin/store')
  return data as StoreItem[]
}

export async function adminDeleteStoreItem(id: string) {
  await api.delete(`/admin/store/${id}`)
}

export async function adminListTransactions(limit = 20, offset = 0) {
  const { data } = await api.get('/admin/coins/transactions', { params: { limit, offset } })
  return data as { transactions: CoinTransaction[]; total: number }
}
