import api from './client'
import type { Server } from '../types/server'
import { isDemoMode } from '../store/authStore'

const MOCK_SERVERS: Server[] = [
  {
    id: 'srv-example-1',
    name: 'Minecraft Paper 1.21',
    user_id: 'usr-1',
    node_id: 'node-1',
    egg_id: 'egg-mc',
    container_id: 'ct-mc-paper',
    status: 'RUNNING',
    memory_mb: 2048,
    disk_mb: 10240,
    cpu_percent: 45,
    port_bindings: [
      { host_port: 25565, container_port: 25565 },
      { host_port: 25575, container_port: 25575 },
    ],
    env_vars: { MC_VERSION: '1.21', DIFFICULTY: 'normal' },
    created_at: '2025-06-15T10:30:00Z',
    user_username: 'admin',
    node_name: 'us-east-1',
    egg_name: 'Minecraft Paper',
  },
  {
    id: 'srv-example-2',
    name: 'Valheim Dedicated',
    user_id: 'usr-1',
    node_id: 'node-1',
    egg_id: 'egg-valheim',
    container_id: 'ct-valheim',
    status: 'STOPPED',
    memory_mb: 1024,
    disk_mb: 5120,
    cpu_percent: 0,
    port_bindings: [
      { host_port: 2456, container_port: 2456 },
    ],
    env_vars: { WORLD_NAME: 'Dedicated' },
    created_at: '2025-06-20T14:00:00Z',
    user_username: 'admin',
    node_name: 'us-east-1',
    egg_name: 'Valheim',
  },
  {
    id: 'srv-example-3',
    name: 'Node.js API Server',
    user_id: 'usr-1',
    node_id: 'node-2',
    egg_id: 'egg-node',
    container_id: 'ct-node-api',
    status: 'STARTING',
    memory_mb: 512,
    disk_mb: 2048,
    cpu_percent: 12,
    port_bindings: [
      { host_port: 3001, container_port: 3000 },
    ],
    env_vars: { NODE_ENV: 'production' },
    created_at: '2025-07-01T09:15:00Z',
    user_username: 'admin',
    node_name: 'eu-west-1',
    egg_name: 'Node.js',
  },
]

export async function listServers() {
  try {
    const { data } = await api.get('/servers')
    const servers = (Array.isArray(data) ? data : []) as Server[]
    return servers
  } catch {
    if (isDemoMode()) return MOCK_SERVERS
    throw new Error('Failed to load servers')
  }
}

export async function getServer(id: string) {
  try {
    const { data } = await api.get(`/servers/${id}`)
    if (data) return data as Server
    return data as Server
  } catch {
    if (isDemoMode()) {
      const mock = MOCK_SERVERS.find((s) => s.id === id)
      if (mock) return mock
    }
    throw new Error('Failed to load server')
  }
}

export async function createServer(payload: {
  name: string
  egg_id: string
  node_id: string
  memory_mb: number
  disk_mb: number
  cpu_percent: number
  env_vars?: Record<string, string>
}) {
  const { data } = await api.post('/servers', payload)
  return data as Server
}

export async function updateServer(id: string, payload: Partial<Server>) {
  const { data } = await api.patch(`/servers/${id}`, payload)
  return data as Server
}

export async function deleteServer(id: string) {
  await api.delete(`/servers/${id}`)
}

export async function startServer(id: string) {
  await api.post(`/servers/${id}/start`)
}

export async function stopServer(id: string) {
  await api.post(`/servers/${id}/stop`)
}

export async function restartServer(id: string) {
  await api.post(`/servers/${id}/restart`)
}

export async function killServer(id: string) {
  await api.post(`/servers/${id}/kill`)
}
