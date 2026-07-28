import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
})

const TOKEN_KEY = 'tyractyl_token'

let accessToken: string | null = localStorage.getItem(TOKEN_KEY)

export function setAccessToken(token: string | null) {
  accessToken = token
  if (token) {
    localStorage.setItem(TOKEN_KEY, token)
  } else {
    localStorage.removeItem(TOKEN_KEY)
  }
}

export function getAccessToken() {
  return accessToken
}

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

let isRefreshing = false

// Auth endpoints that should not trigger token refresh on 401
// (e.g. login with wrong credentials returns 401 which is expected)
const AUTH_ENDPOINTS = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/forgot-password', '/auth/logout']

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // Don't intercept 401s on auth endpoints — let the calling code handle the error
    const isAuthEndpoint = AUTH_ENDPOINTS.some((ep) => originalRequest?.url?.includes(ep))

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint && !isRefreshing) {
      originalRequest._retry = true
      isRefreshing = true
      try {
        const { data } = await axios.post('/api/auth/refresh', null, {
          withCredentials: true,
        })
        setAccessToken(data.access_token)
        isRefreshing = false
        originalRequest.headers.Authorization = `Bearer ${data.access_token}`
        return api(originalRequest)
      } catch {
        setAccessToken(null)
        isRefreshing = false
        window.location.href = '/auth'
      }
    }
    return Promise.reject(error)
  }
)

export default api
