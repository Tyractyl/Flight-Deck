import { useState, useEffect, useRef } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { sendAfkHeartbeat, getAfkStatus } from '../../api/eggs'
import { sileo } from 'sileo'
import Button from '../../components/Button'
import NumberFlow from '@number-flow/react'
import { ProgressBar } from '../../components/afk'

function getBoost(activeUsers: number) {
  if (activeUsers >= 55) return 2
  if (activeUsers >= 2) return Math.min(1 + Math.floor(activeUsers / 2) * 0.1, 2)
  return 1
}

function formatTime(totalSeconds: number) {
  const hrs = Math.floor(totalSeconds / 3600)
  const mins = Math.floor((totalSeconds % 3600) / 60)
  const secs = totalSeconds % 60
  return [
    hrs.toString().padStart(2, '0'),
    mins.toString().padStart(2, '0'),
    secs.toString().padStart(2, '0'),
  ].join(':')
}

export default function AfkPage() {
  const [isAfk, setIsAfk] = useState(false)
  const [earned, setEarned] = useState(0)
  const [activeUsers, setActiveUsers] = useState(0)
  const [sessionTime, setSessionTime] = useState(0)
  const [nextRewardIn, setNextRewardIn] = useState(60)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const { data: statusData } = useQuery({
    queryKey: ['afk-status'],
    queryFn: getAfkStatus,
    refetchInterval: 30000,
  })

  useEffect(() => {
    if (statusData) setActiveUsers(statusData.activeUsers)
  }, [statusData])

  const boost = getBoost(activeUsers)
  const coinsPerMinute = 1 * boost

  const heartbeatMutation = useMutation({
    mutationFn: sendAfkHeartbeat,
    onSuccess: (data) => {
      if (data.earned > 0) setEarned((prev) => prev + data.earned)
      if (data.activeUsers !== undefined) setActiveUsers(data.activeUsers)
      setNextRewardIn(60)
    },
    onError: () => {
      sileo.error({ description: 'AFK heartbeat failed', icon: false })
      stopAfk()
    },
  })

  const startAfk = () => {
    setIsAfk(true)
    setEarned(0)
    setSessionTime(0)
    setNextRewardIn(60)
    heartbeatMutation.mutate()
    intervalRef.current = setInterval(() => heartbeatMutation.mutate(), 60000)
    timerRef.current = setInterval(() => {
      setSessionTime((p) => p + 1)
      setNextRewardIn((p) => Math.max(0, p - 1))
    }, 1000)
    sileo.success({
      description: 'Earning started. Keep this tab open to collect coins every minute.',
      icon: false,
    })
  }

  const stopAfk = () => {
    setIsAfk(false)
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (timerRef.current) clearInterval(timerRef.current)
    intervalRef.current = null
    timerRef.current = null
  }

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const timerFormat = { minimumIntegerDigits: 2 }

  return (
    <div className="flex-1 flex flex-col justify-center min-h-0 max-h-full gap-6 sm:gap-8 overflow-hidden">
      {/* Header */}
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-semibold text-[var(--fg)]">AFK Farm</h1>
        <p className="text-sm text-[var(--fg-muted)]">
          Stay on this page to earn coins passively every minute.
        </p>
      </div>

      {/* Timer */}
      <div className="relative py-6 sm:py-8 px-4 text-center border-y border-[var(--border-strong)] bg-gradient-to-b from-[var(--bg-card)]/40 to-transparent">
        <div className="flex items-center justify-center gap-2">
          <NumberFlow
            value={nextRewardIn}
            format={timerFormat}
            className="font-sans text-6xl sm:text-7xl leading-none font-normal text-[var(--fg)] tracking-tight"
          />
          <span className="text-lg sm:text-xl font-medium text-[var(--fg-muted)]">sec</span>
        </div>
        <p className="text-xs text-[var(--fg-muted)] mt-2">until next coin drop</p>

        <div className="w-full max-w-md mx-auto mt-6">
          <ProgressBar value={60 - nextRewardIn} max={60} />
        </div>

        <div className="mt-6">
          <Button variant={isAfk ? 'danger' : 'primary'} onClick={isAfk ? stopAfk : startAfk} width={160} height={36}>
            {isAfk ? 'Stop Earning' : 'Start Earning'}
          </Button>
        </div>

        {/* Status */}
        <div className="flex items-center justify-center gap-2 mt-5">
          <span
            className={`inline-block h-2 w-2 rounded-full transition-colors ${
              isAfk ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.6)]' : 'bg-red-500'
            }`}
          />
          <span className="text-sm font-medium text-[var(--fg)]">
            {isAfk ? 'Connected' : 'Offline'}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-1 text-center">
          <span className="text-[10px] sm:text-xs font-medium uppercase tracking-wide text-[var(--fg-muted)]">Session Time</span>
          <div className="text-xl sm:text-2xl font-medium text-[var(--fg)] font-sans tabular-nums">
            {formatTime(sessionTime)}
          </div>
        </div>

        <div className="space-y-1 text-center">
          <span className="text-[10px] sm:text-xs font-medium uppercase tracking-wide text-[var(--fg-muted)]">Earning Rate</span>
          <div className="text-xl sm:text-2xl font-medium text-[var(--fg)] font-sans">
            {coinsPerMinute.toFixed(1)}x
          </div>
          <p className="text-[10px] text-[var(--fg-muted)]">{coinsPerMinute.toFixed(1)} / min</p>
        </div>

        <div className="space-y-1 text-center">
          <span className="text-[10px] sm:text-xs font-medium uppercase tracking-wide text-[var(--fg-muted)]">Earned / Active</span>
          <div className="flex items-center justify-center gap-1">
            <span className="text-xl sm:text-2xl font-medium text-[var(--fg)] font-sans">
              <NumberFlow value={earned} />
            </span>
            <span className="text-xs text-[var(--fg-muted)]">coins</span>
          </div>
          <p className="text-[10px] text-[var(--fg-muted)]">
            {activeUsers} active farmer{activeUsers !== 1 ? 's' : ''}
          </p>
        </div>
      </div>
    </div>
  )
}
