import api from './client'
import type { CoinTransaction } from '../types/server'
import { isDemoMode } from '../store/authStore'

export async function getBalance() {
  try {
    const { data } = await api.get('/coins/balance')
    return data as { balance: number }
  } catch {
    if (isDemoMode()) return { balance: 9999 }
    throw new Error('Failed to get balance')
  }
}

export async function listTransactions(limit = 20, offset = 0) {
  try {
    const { data } = await api.get('/coins/transactions', {
      params: { limit, offset },
    })
    return (Array.isArray(data) ? data : []) as CoinTransaction[]
  } catch {
    if (isDemoMode()) return [] as CoinTransaction[]
    throw new Error('Failed to get transactions')
  }
}

export async function transferCoins(to: string, amount: number) {
  await api.post('/coins/transfer', { to, amount })
}
