import { create } from 'zustand'
import type { User } from '../types/server'
import { setAccessToken } from '../api/client'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isDemoMode: boolean
  setAuth: (user: User, token: string) => void
  logout: () => void
  updateUser: (user: User) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isDemoMode: false,
  setAuth: (user, token) => {
    setAccessToken(token)
    set({ user, isAuthenticated: true, isDemoMode: token === 'demo-token' })
  },
  logout: () => {
    setAccessToken(null)
    set({ user: null, isAuthenticated: false, isDemoMode: false })
  },
  updateUser: (user) => set({ user }),
}))

export function isDemoMode() {
  return useAuthStore.getState().isDemoMode
}
