interface EmptyStateProps {
  icon: string
  title: string
  description: string
}

export function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <span className="text-4xl mb-3">{icon}</span>
      <p className="text-[var(--fg)] font-sans text-sm">{title}</p>
      <p className="text-[var(--fg-muted)] font-sans text-xs mt-1">{description}</p>
    </div>
  )
}
