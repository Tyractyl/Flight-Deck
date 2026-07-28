import api from './client'
import type { Egg, StoreItem } from '../types/server'
import { isDemoMode } from '../store/authStore'

const MOCK_EGGS: Egg[] = [
  {
    id: 'egg-mc',
    name: 'Minecraft Paper',
    docker_image: 'itzg/minecraft-server:latest',
    default_env: { DIFFICULTY: 'normal', ONLINE_MODE: 'true' },
    start_cmd: 'java -Xmx1024M -jar server.jar nogui',
    config_files: ['server.properties'],
  },
  {
    id: 'egg-valheim',
    name: 'Valheim',
    docker_image: 'lloesche/valheim-server:latest',
    default_env: { WORLD_NAME: 'Dedicated', SERVER_PASS: 'secret' },
    start_cmd: '/opt/valheim/start_vh.sh',
    config_files: [],
  },
  {
    id: 'egg-node',
    name: 'Node.js',
    docker_image: 'node:20-alpine',
    default_env: { NODE_ENV: 'production' },
    start_cmd: 'node index.js',
    config_files: ['package.json'],
  },
  {
    id: 'egg-python',
    name: 'Python',
    docker_image: 'python:3.12-slim',
    default_env: {},
    start_cmd: 'python main.py',
    config_files: ['requirements.txt'],
  },
]

const MOCK_STORE_ITEMS: StoreItem[] = [
  { id: 'item-ram-1', name: '+512 MB RAM', description: 'Add 512 MB of memory to a server', price: 50, type: 'MEMORY', amount: 512, is_active: true },
  { id: 'item-ram-2', name: '+1 GB RAM', description: 'Add 1 GB of memory to a server', price: 90, type: 'MEMORY', amount: 1024, is_active: true },
  { id: 'item-disk-1', name: '+5 GB Disk', description: 'Add 5 GB of storage to a server', price: 30, type: 'DISK', amount: 5120, is_active: true },
  { id: 'item-cpu-1', name: '+10% CPU', description: 'Add 10% CPU allocation', price: 40, type: 'CPU', amount: 10, is_active: true },
  { id: 'item-coins-1', name: 'Coin Pack', description: 'Spend 100 coins to get 150 coins', price: 100, type: 'COINS', amount: 150, is_active: true },
]

export async function listEggs() {
  try {
    const { data } = await api.get('/eggs')
    const eggs = (Array.isArray(data) ? data : []) as Egg[]
    if (eggs.length === 0) return MOCK_EGGS
    return eggs
  } catch {
    if (isDemoMode()) return MOCK_EGGS
    throw new Error('Failed to load eggs')
  }
}

export async function listStoreItems() {
  try {
    const { data } = await api.get('/store/items')
    const items = (Array.isArray(data) ? data : []) as StoreItem[]
    if (items.length === 0) return MOCK_STORE_ITEMS
    return items
  } catch {
    if (isDemoMode()) return MOCK_STORE_ITEMS
    throw new Error('Failed to load store items')
  }
}

export async function getStoreRates() {
  try {
    const { data } = await api.get('/store/rates')
    return data as Record<string, number>
  } catch {
    if (isDemoMode()) return { MEMORY: 0.1, DISK: 0.015, CPU: 3.0 }
    throw new Error('Failed to load store rates')
  }
}

export async function purchaseStoreItem(itemId: string, serverId: string) {
  const { data } = await api.post('/store/purchase', { item_id: itemId, server_id: serverId })
  return data
}

export async function customPurchase(type: string, amount: number, serverId: string) {
  try {
    const { data } = await api.post('/store/custom-purchase', { type, amount, server_id: serverId })
    return data
  } catch {
    if (isDemoMode()) return { message: 'purchase successful (demo)' }
    throw new Error('Purchase failed')
  }
}

export async function sendAfkHeartbeat() {
  try {
    const { data } = await api.post('/afk/heartbeat')
    return data as { earned: number; activeUsers: number }
  } catch {
    if (isDemoMode()) return { earned: 1, activeUsers: 3 }
    throw new Error('Failed to send heartbeat')
  }
}

export async function getAfkStatus() {
  try {
    const { data } = await api.get('/afk/status')
    return data as { activeUsers: number }
  } catch {
    if (isDemoMode()) return { activeUsers: 3 }
    throw new Error('Failed to get AFK status')
  }
}
