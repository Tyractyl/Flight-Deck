import { useEffect, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'

interface PageTransitionProps {
  children: ReactNode
}

export function PageTransition({ children }: PageTransitionProps) {
  const location = useLocation()
  const [displayChildren, setDisplayChildren] = useState(children)
  const [transitionStage, setTransitionStage] = useState<'enter' | 'exit'>('enter')

  useEffect(() => {
    setTransitionStage('exit')
    const timeout = setTimeout(() => {
      setDisplayChildren(children)
      setTransitionStage('enter')
    }, 250)
    return () => clearTimeout(timeout)
  }, [location.pathname])

  return (
    <div
      className="flex-1 flex flex-col min-h-0"
      style={{
        opacity: transitionStage === 'enter' ? 1 : 0,
        filter: transitionStage === 'enter' ? 'blur(0px)' : 'blur(6px)',
        transform: transitionStage === 'enter' ? 'scale(1)' : 'scale(0.99)',
        transition: 'opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1), filter 0.25s cubic-bezier(0.4, 0, 0.2, 1), transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {displayChildren}
    </div>
  )
}
