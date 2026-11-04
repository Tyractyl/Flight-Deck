import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'

interface PageTransitionProps {
  children: ReactNode
}

/**
 * One consistent, polished transition for every navigation — normal page
 * switches and entering a server alike. The outgoing page blurs and dips
 * away, the incoming page settles in. No special cases, no crossfade layers
 * that fight the layout.
 */
export function PageTransition({ children }: PageTransitionProps) {
  const location = useLocation()
  const [displayed, setDisplayed] = useState(children)
  const [stage, setStage] = useState<'idle' | 'out' | 'in'>('idle')
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const childrenRef = useRef(children)
  childrenRef.current = children

  useEffect(() => {
    setStage('out')
    timeoutRef.current = setTimeout(() => {
      setDisplayed(childrenRef.current)
      setStage('in')
      timeoutRef.current = setTimeout(() => {
        setStage('idle')
        timeoutRef.current = null
      }, 200)
    }, 150)
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [location.pathname])

  const out = stage === 'out'
  return (
    <div
      className="flex-1 flex flex-col min-h-0"
      style={{
        opacity: out ? 0 : 1,
        filter: out ? 'blur(6px)' : 'blur(0px)',
        transform: out ? 'scale(0.99)' : 'scale(1)',
        transition: stage !== 'idle'
          ? 'opacity 0.15s ease-out, filter 0.15s ease-out, transform 0.15s ease-out'
          : 'none',
      }}
    >
      {displayed}
    </div>
  )
}
