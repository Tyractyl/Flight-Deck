import { Tooltip, TooltipTrigger, TooltipContent } from '../ui/Tooltip'

function statusDotTone(status: string): string {
  switch (status) {
    case 'RUNNING':
      return 'bg-emerald-500 ring-emerald-500/25'
    case 'STARTING':
    case 'INSTALLING':
    case 'STOPPING':
      return 'bg-amber-500 ring-amber-500/25'
    case 'ERROR':
      return 'bg-red-500 ring-red-500/25'
    default:
      return 'bg-neutral-500 ring-neutral-500/25'
  }
}

function statusLabel(status: string): string {
  switch (status) {
    case 'RUNNING': return 'Running'
    case 'STOPPED': return 'Offline'
    case 'STARTING': return 'Starting'
    case 'STOPPING': return 'Stopping'
    case 'ERROR': return 'Error'
    case 'INSTALLING': return 'Installing'
    default: return status
  }
}

export default function ServerStatusIndicator({
  status,
  className = '',
  tooltipContent,
  bare,
}: {
  status: string
  className?: string
  tooltipContent?: string
  bare?: boolean
}) {
  const label = statusLabel(status)
  const tone = statusDotTone(status)

  const dot = (
    <span
      className={`inline-flex items-center justify-center rounded-full ${bare ? className : 'h-4 w-4'}`}
      aria-label={`Server status: ${label}`}
    >
      <span className={`relative flex h-2 w-2 items-center justify-center rounded-full ring-4 ${tone}`} />
    </span>
  )

  if (bare) return dot

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className={`inline-flex h-4 w-4 items-center justify-center rounded-full outline-hidden ${className}`}
          aria-label={`Server status: ${label}`}
        >
          <span className={`relative flex h-2 w-2 items-center justify-center rounded-full ring-4 ${tone}`} />
        </button>
      </TooltipTrigger>
      <TooltipContent>{tooltipContent ?? label}</TooltipContent>
    </Tooltip>
  )
}
