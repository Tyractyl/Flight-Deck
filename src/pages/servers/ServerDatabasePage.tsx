import { Database } from 'lucide-react'
import ServerComingSoonPage from './ServerComingSoonPage'

export default function ServerDatabasePage() {
  return (
    <ServerComingSoonPage
      icon={Database}
      title="Database"
      description="Manage databases for this server. This module is on the roadmap."
    />
  )
}