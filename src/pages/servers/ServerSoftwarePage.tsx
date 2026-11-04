import { Package } from 'lucide-react'
import ServerComingSoonPage from './ServerComingSoonPage'

export default function ServerSoftwarePage() {
  return (
    <ServerComingSoonPage
      icon={Package}
      title="Software"
      description="Browse and install community software (CSGO, Minecraft, etc.). Coming soon."
    />
  )
}