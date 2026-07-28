import api from './client'
import type { Node } from '../types/server'

export async function listNodes() {
  const { data } = await api.get('/admin/nodes')
  return data as Node[]
}
