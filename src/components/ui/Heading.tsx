export default function Heading({
  title,
  description,
  variant = 'default',
  className = '',
}: {
  title: string
  description?: string
  variant?: 'default' | 'small'
  className?: string
}) {
  return (
    <header className={`space-y-0.5 ${className}`}>
      <h2
        className={
          variant === 'small'
            ? 'mb-0.5 text-base font-medium text-[var(--fg)]'
            : 'text-xl font-semibold tracking-tight text-[var(--fg)]'
        }
      >
        {title}
      </h2>
      {description && (
        <p className="text-sm text-[var(--fg-muted)]">{description}</p>
      )}
    </header>
  )
}
