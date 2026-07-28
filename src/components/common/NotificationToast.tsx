import { useNotificationStore } from '../../store/notificationStore'

export function NotificationToast() {
  const notifications = useNotificationStore((s) => s.notifications)
  const removeNotification = useNotificationStore((s) => s.removeNotification)

  if (!notifications.length) return null

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {notifications.map((n) => (
        <div
          key={n.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border backdrop-blur-sm animate-in slide-in-from-right-5 ${
            n.type === 'success'
              ? 'bg-green-500/10 border-green-500/30 text-green-400'
              : n.type === 'error'
              ? 'bg-red-500/10 border-red-500/30 text-red-400'
              : 'bg-blue-500/10 border-blue-500/30 text-blue-400'
          }`}
        >
          <span className="text-sm font-sans">{n.message}</span>
          <button
            onClick={() => removeNotification(n.id)}
            className="text-current opacity-50 hover:opacity-100 transition-opacity"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )
}
