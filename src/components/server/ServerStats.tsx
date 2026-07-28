import { useEffect, useRef } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface ServerStatsProps {
  serverId: string
}

interface StatsData {
  time: string
  cpu: number
  memory: number
}

export function ServerStats({ serverId }: ServerStatsProps) {
  const dataRef = useRef<StatsData[]>([])

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
    const ws = new WebSocket(`${protocol}://${window.location.host}/api/servers/${serverId}/stats`)

    ws.onmessage = (event) => {
      try {
        const stats = JSON.parse(event.data)
        const now = new Date().toLocaleTimeString()
        dataRef.current.push({
          time: now,
          cpu: stats.cpu || 0,
          memory: stats.memory || 0,
        })
        if (dataRef.current.length > 30) {
          dataRef.current.shift()
        }
      } catch {
        // ignore parse errors
      }
    }

    return () => ws.close()
  }, [serverId])

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 rounded-lg bg-gradient-to-b from-[#1E1E1E] to-[#1E2853]">
          <p className="text-[var(--fg-secondary)] font-sans text-xl">CPU</p>
          <p className="text-[var(--fg)] font-sans text-2xl">0%</p>
        </div>
        <div className="p-4 rounded-lg bg-gradient-to-b from-[#1E1E1E] to-[#4F1616]">
          <p className="text-[var(--fg-secondary)] font-sans text-xl">Memory</p>
          <p className="text-[var(--fg)] font-sans text-2xl">0 MB</p>
        </div>
        <div className="p-4 rounded-lg bg-gradient-to-b from-[#1E1E1E] to-[#764D00]">
          <p className="text-[var(--fg-secondary)] font-sans text-xl">Disk</p>
          <p className="text-[var(--fg)] font-sans text-2xl">0 MB</p>
        </div>
      </div>

      <div className="h-[300px] rounded-lg bg-[var(--bg-input)] p-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={dataRef.current}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis dataKey="time" stroke="#666" fontSize={10} />
            <YAxis stroke="#666" fontSize={10} />
            <Tooltip
              contentStyle={{ background: '#1E1E1E', border: '1px solid #333', borderRadius: '8px' }}
              labelStyle={{ color: '#fff' }}
            />
            <Line type="monotone" dataKey="cpu" stroke="#8884d8" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="memory" stroke="#82ca9d" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
