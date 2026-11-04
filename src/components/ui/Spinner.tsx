import { cn } from '../../utils/cn'

function Spinner({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('size-4 animate-spin rounded-full border-2 border-current border-t-transparent', className)}
      {...props}
    />
  )
}

export { Spinner }
