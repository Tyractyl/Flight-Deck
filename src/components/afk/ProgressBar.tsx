interface ProgressBarProps {
  value: number
  max?: number
  className?: string
}

export function ProgressBar({ value, max = 100, className = '' }: ProgressBarProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)

  return (
    <div className={`h-[18px] rounded-full bg-[linear-gradient(180deg,rgba(57,57,57,1)_0%,rgba(89,89,89,1)_100%)] overflow-hidden ${className}`}>
      <div
        className="h-full rounded-full transition-all duration-1000"
        style={{
          width: `${percentage}%`,
          background: 'linear-gradient(180deg, var(--accent) 0%, color-mix(in srgb, var(--accent) 65%, #000000) 100%)',
        }}
      />
    </div>
  )
}
