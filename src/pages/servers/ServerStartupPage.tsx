import { Power } from 'lucide-react'
import ServerComingSoonPage from './ServerComingSoonPage'

export default function ServerStartupPage() {
  return (
    <ServerComingSoonPage
      icon={Power}
      title="Startup"
      description="Configure startup variables, run-on-boot, and launch behaviour. Coming soon."
    />
  )
}