import { Clock } from 'lucide-react'
import ServerComingSoonPage from './ServerComingSoonPage'

export default function ServerSchedulePage() {
  return (
    <ServerComingSoonPage
      icon={Clock}
      title="Schedule"
      description="Schedule power actions, restarts, and tasks. Coming soon."
    />
  )
}