import type { ReactNode } from 'react'

interface CardProps {
  label?: string
  children: ReactNode
  className?: string
  width?: string
  height?: string
}

export function Card({ label, children, className = '', width, height }: CardProps) {
  return (
    <section
      aria-label={label}
      className={`relative ${width ? `w-[${width}]` : 'w-full'} ${height ? `h-[${height}]` : 'h-[88px]'} ${className}`}
    >
      {/* Layer 1: #3a3a3a */}
      <div className="absolute inset-0 bg-[#3a3a3a] rounded-[10px]" />
      {/* Layer 2: #303030 */}
      <div className="absolute inset-0 bg-[#303030] rounded-[10px]" />
      {/* Label in grey header */}
      {label && (
        <span className="absolute top-1 left-1.5 [font-family:'Geist-Medium',Helvetica] text-[11px] font-medium leading-none text-[#cdcdcd] z-10">
          {label}
        </span>
      )}
      {/* Inner content */}
      <div className="absolute top-5 left-0.5 right-0.5 bottom-0.5 bg-[#3c3c3c] rounded-[9px]">
        {children}
      </div>
    </section>
  )
}
