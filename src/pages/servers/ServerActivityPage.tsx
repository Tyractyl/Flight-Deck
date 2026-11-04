import { Activity } from 'lucide-react'
import ServerComingSoonPage from './ServerComingSoonPage'

export default function ServerActivityPage() {
  return (
    <ServerComingSoonPage
      icon={Activity}
      title="Activity"
      description="Recent events, audits, and command history for this server. Coming soon."
    />
  )
}