import { cn } from '@/lib/utils'

/*
 * Skeleton loading placeholder — vendored from parthenon-ui's skeleton
 * component so the app has no external UI-package dependency.
 */
function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="skeleton"
      className={cn('animate-pulse rounded-xl bg-muted', className)}
      {...props}
    />
  )
}

export { Skeleton }
