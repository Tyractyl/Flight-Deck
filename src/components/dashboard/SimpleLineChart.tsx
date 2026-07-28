import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card'

interface SimpleLineChartProps<T extends Record<string, unknown>> {
  title: string
  data: T[]
  dataKey: keyof T
  xDataKey: keyof T
  color?: string
  className?: string
}

export function SimpleLineChart<T extends Record<string, unknown>>({
  title,
  data,
  dataKey,
  xDataKey,
  color = '#3b82f6',
  className = '',
}: SimpleLineChartProps<T>) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey={xDataKey as string} stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-strong)', borderRadius: '8px' }}
                itemStyle={{ color: 'var(--fg)' }}
              />
              <Line
                type="monotone"
                dataKey={dataKey as string}
                stroke={color}
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 4, fill: color }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
