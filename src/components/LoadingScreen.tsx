import { useEffect, useState } from "react";
import Loader from './Loader'

const messages = [
  'Preparing your experience...',
  'Loading your servers...',
  'Almost there...',
  'Setting things up...',
  'Connecting to your nodes...',
  'Fetching your data...',
]

export default function LoadingScreen({ fadingOut = false }: { fadingOut?: boolean }) {
  const [messageIndex, setMessageIndex] = useState(0)
  const [fadeState, setFadeState] = useState<'in' | 'visible' | 'out'>('in')

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = []

    // Initial fade in
    timers.push(setTimeout(() => setFadeState('visible'), 300))

    const interval = setInterval(() => {
      setFadeState('out')
      timers.push(setTimeout(() => {
        setMessageIndex((prev) => (prev + 1) % messages.length)
        setFadeState('in')
        timers.push(setTimeout(() => setFadeState('visible'), 300))
      }, 300))
    }, 2400)

    return () => {
      clearInterval(interval)
      timers.forEach(clearTimeout)
    }
  }, [])

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: '#000',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        opacity: fadingOut ? 0 : 1,
        filter: fadingOut ? 'blur(12px)' : 'blur(0)',
        transform: fadingOut ? 'scale(1.02)' : 'scale(1)',
        transition: 'opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1), filter 0.8s cubic-bezier(0.4, 0, 0.2, 1), transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
        pointerEvents: fadingOut ? 'none' : 'auto',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
        <Loader size={100} color="#aaa" />
        <span
          key={messageIndex}
          style={{
            color: '#555',
            fontSize: 13,
            fontFamily: 'var(--font-sans, ui-sans-serif, system-ui, sans-serif)',
            fontWeight: 400,
            letterSpacing: '0.02em',
            opacity: fadeState === 'out' ? 0 : fadeState === 'in' ? 0 : 1,
            filter: fadeState === 'out' ? 'blur(4px)' : fadeState === 'in' ? 'blur(4px)' : 'blur(0)',
            transform: fadeState === 'out' ? 'translateY(4px)' : fadeState === 'in' ? 'translateY(-4px)' : 'translateY(0)',
            transition: 'opacity 0.3s ease-out, filter 0.3s ease-out, transform 0.3s ease-out',
          }}
        >
          {messages[messageIndex]}
        </span>
      </div>
    </div>
  )
}
