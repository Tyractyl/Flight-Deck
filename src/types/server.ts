export interface User {
  id: string
  email: string
  username: string
  is_admin: boolean
  coins: number
  afk_last_seen: string | null
  created_at: string
  avatar_url: string | null
}

export interface Server {
  id: string
  name: string
  user_id: string
  node_id: string
  egg_id: string
  container_id: string | null
  status: ServerStatus
  memory_mb: number
  disk_mb: number
  cpu_percent: number
  port_bindings: PortBinding[]
  env_vars: Record<string, string>
  created_at: string
  user_username?: string
  node_name?: string
  egg_name?: string
}

export type ServerStatus =
  | 'INSTALLING'
  | 'RUNNING'
  | 'STOPPED'
  | 'STARTING'
  | 'STOPPING'
  | 'ERROR'

export interface PortBinding {
  host_port: number
  container_port: number
}

export interface Node {
  id: string
  name: string
  fqdn: string
  port: number
  token: string
  is_online: boolean
  total_memory: number
  total_disk: number
  total_cpu: number
  gpu_enabled: boolean
  created_at: string
}

export interface Egg {
  id: string
  name: string
  docker_image: string
  default_env: Record<string, string>
  start_cmd: string
  config_files: string[]
}

export interface CoinTransaction {
  id: string
  sender_id: string | null
  receiver_id: string
  amount: number
  type: CoinTxType
  note: string | null
  created_at: string
  sender_username?: string
  receiver_username?: string
}

export type CoinTxType =
  | 'ADMIN_GRANT'
  | 'ADMIN_DEDUCT'
  | 'USER_TRANSFER'
  | 'AFK_REWARD'
  | 'STORE_PURCHASE'

export interface StoreItem {
  id: string
  name: string
  description: string
  price: number
  type: StoreItemType
  amount: number
  is_active: boolean
}

export type StoreItemType = 'MEMORY' | 'DISK' | 'CPU' | 'COINS'

export interface ServerStats {
  cpu: number
  memory: number
  memory_total: number
  disk: number
  disk_total: number
  network_in: number
  network_out: number
}
