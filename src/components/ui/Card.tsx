import { type ReactNode, type MouseEvent } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  onClick?: (e: MouseEvent<HTMLDivElement>) => void
}

export function Card({ children, className = '', onClick }: CardProps) {
  return (
    <div onClick={onClick} className={`bg-[var(--bg-card)] rounded-xl border border-theme ${className}`}>
      {children}
    </div>
  )
}

export function CardHeader({ children, className = '' }: CardProps) {
  return (
    <div className={`px-5 py-4 border-b border-theme ${className}`}>
      {children}
    </div>
  )
}

export function CardContent({ children, className = '', onClick }: CardProps) {
  return (
    <div onClick={onClick} className={`p-5 ${className}`}>
      {children}
    </div>
  )
}

export function CardTitle({ children, className = '' }: CardProps) {
  return (
    <h3 className={`text-base font-semibold text-[var(--fg)] ${className}`}>
      {children}
    </h3>
  )
}
