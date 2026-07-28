interface PageWrapperProps {
  children: React.ReactNode
  title?: string
}

export function PageWrapper({ children, title }: PageWrapperProps) {
  return (
    <div className="space-y-6">
      {title && (
        <h1 className="text-xl font-sans text-[var(--fg)]">{title}</h1>
      )}
      {children}
    </div>
  )
}
