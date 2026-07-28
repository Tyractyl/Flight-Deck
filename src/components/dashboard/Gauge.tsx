import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card'

interface GaugeProps {
  title: string
  value: number // 0-100
  label?: string
  color?: string
  className?: string
}

export function Gauge({ title, value, label, color = '#3b82f6', className = '' }: GaugeProps) {
  const clamped = Math.min(100, Math.max(0, value))
  const radius = 80
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (clamped / 100) * circumference

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative h-48 w-full flex items-center justify-center">
          <svg width="200" height="200" viewBox="0 0 200 200" className="-rotate-90 transform">
            <circle
              cx="100"
              cy="100"
              r={radius}
              fill="none"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth={12}
            />
            <circle
              cx="100"
              cy="100"
              r={radius}
              fill="none"
              stroke={color}
              strokeWidth={12}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              style={{ transition: 'stroke-dashoffset 0.5s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-semibold text-[var(--fg)]">{clamped}%</span>
            {label && <span className="text-xs text-[var(--fg-muted)] mt-1">{label}</span>}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
