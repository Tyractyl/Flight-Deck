import api from './client'
import type { User } from '../types/server'

export async function register(email: string, username: string, password: string) {
  const { data } = await api.post('/auth/register', { email, username, password })
  return data as { access_token: string; user: User }
}

export async function login(email: string, password: string) {
  const { data } = await api.post('/auth/login', { email, password })
  return data as { access_token: string; user: User }
}

export async function logout() {
  await api.post('/auth/logout')
}

export async function uploadAvatar(file: File) {
  const formData = new FormData()
  formData.append('avatar', file)
  const { data } = await api.post('/users/me/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data as { avatar_url: string }
}

export async function getMe() {
  const { data } = await api.get('/users/me')
  return data as User
}
