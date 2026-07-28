import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card'

interface RingChartItem {
  name: string
  value: number
}

interface RingChartProps {
  title: string
  data: RingChartItem[]
  colors?: string[]
  className?: string
}

export function RingChart({
  title,
  data,
  colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'],
  className = '',
}: RingChartProps) {
  const filtered = data.filter((d) => d.value > 0)
  const total = filtered.reduce((sum, d) => sum + d.value, 0)

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={filtered}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
              >
                {filtered.map((entry, index) => (
                  <Cell key={`cell-${entry.name}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-strong)', borderRadius: '8px' }}
                itemStyle={{ color: 'var(--fg)' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        {total > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-2">
            {filtered.map((d, i) => (
              <div key={d.name} className="flex items-center gap-2 text-xs">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: colors[i % colors.length] }}
                />
                <span className="text-[var(--fg-muted)] truncate">{d.name}</span>
                <span className="text-[var(--fg)] ml-auto">{d.value}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
