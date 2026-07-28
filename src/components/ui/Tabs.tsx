import { createContext, useContext, useState, type ReactNode } from 'react'

interface TabsContextType {
  value: string
  onValueChange: (value: string) => void
}

const TabsContext = createContext<TabsContextType | undefined>(undefined)

interface TabsProps {
  defaultValue: string
  children: ReactNode
  className?: string
}

export function Tabs({ defaultValue, children, className = '' }: TabsProps) {
  const [value, setValue] = useState(defaultValue)
  return (
    <TabsContext.Provider value={{ value, onValueChange: setValue }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  )
}

export function TabsList({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`inline-flex items-center rounded-lg bg-[var(--bg-elevated)] p-1 ${className}`}>
      {children}
    </div>
  )
}

interface TabsTriggerProps {
  value: string
  children: ReactNode
  className?: string
}

export function TabsTrigger({ value, children, className = '' }: TabsTriggerProps) {
  const ctx = useContext(TabsContext)
  if (!ctx) throw new Error('TabsTrigger must be used within Tabs')
  const isActive = ctx.value === value
  return (
    <button
      onClick={() => ctx.onValueChange(value)}
      className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
        isActive
          ? 'bg-[var(--bg-card)] text-[var(--fg)] shadow-sm'
          : 'text-[var(--fg-muted)] hover:text-[var(--fg)]'
      } ${className}`}
    >
      {children}
    </button>
  )
}

interface TabsContentProps {
  value: string
  children: ReactNode
  className?: string
}

export function TabsContent({ value, children, className = '' }: TabsContentProps) {
  const ctx = useContext(TabsContext)
  if (!ctx) throw new Error('TabsContent must be used within Tabs')
  if (ctx.value !== value) return null
  return <div className={className}>{children}</div>
}
