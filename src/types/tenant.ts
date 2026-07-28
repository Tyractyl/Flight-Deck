export interface Tenant {
  id: string
  name: string
  owner_id: string
  created_at: string
  member_count?: number
}

export interface TenantMember {
  id: string
  tenant_id: string
  user_id: string
  role: 'owner' | 'admin' | 'member'
  username?: string
  email?: string
  avatar_url?: string | null
  joined_at: string
}
