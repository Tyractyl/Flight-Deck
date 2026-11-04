import { Field as FieldPrimitive } from '@base-ui/react/field'
import { cn } from '@/lib/utils'

/*
 * Field primitives — thin wrappers around the Base UI field parts, following
 * the composed Field / FieldLabel / FieldDescription pattern.
 */

export function Field({ className, ...props }: React.ComponentProps<typeof FieldPrimitive.Root>) {
  return <FieldPrimitive.Root className={cn('flex flex-col', className)} {...props} />
}

export function FieldLabel({ className, ...props }: React.ComponentProps<typeof FieldPrimitive.Label>) {
  return (
    <FieldPrimitive.Label
      className={cn('text-[15px] font-medium text-[var(--fg)]', className)}
      {...props}
    />
  )
}

export function FieldDescription({ className, ...props }: React.ComponentProps<typeof FieldPrimitive.Description>) {
  return (
    <FieldPrimitive.Description
      className={cn('text-[13px] text-white/40', className)}
      {...props}
    />
  )
}

export function FieldError({ className, ...props }: React.ComponentProps<typeof FieldPrimitive.Error>) {
  return (
    <FieldPrimitive.Error
      className={cn('text-[13px] text-red-400', className)}
      {...props}
    />
  )
}
