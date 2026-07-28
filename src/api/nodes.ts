import api from './client'
import type { Node } from '../types/server'

export async function listNodes() {
  const { data } = await api.get('/admin/nodes')
  return data as Node[]
}

export interface NodeStatus {
  id: string
  name: string
  is_online: boolean
}

export interface UptimePoint {
  bucket: string
  online: number
  total: number
}

export interface UptimeStats {
  percentage: number
  sparkline: UptimePoint[]
}

export async function listNodeStatus() {
  const { data } = await api.get('/nodes/status')
  return data as NodeStatus[]
}

export async function getUptime() {
  const { data } = await api.get('/uptime')
  return data as UptimeStats
}
