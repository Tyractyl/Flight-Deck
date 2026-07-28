import { create } from 'zustand'

interface Notification {
  id: string
  type: 'success' | 'error' | 'info'
  message: string
}

interface NotificationState {
  notifications: Notification[]
  addNotification: (type: Notification['type'], message: string) => void
  removeNotification: (id: string) => void
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  addNotification: (type, message) => {
    const id = Math.random().toString(36).slice(2)
    set((state) => ({
      notifications: [...state.notifications, { id, type, message }],
    }))
    setTimeout(() => {
      set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id),
      }))
    }, 5000)
  },
  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),
}))
