import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"
import { useSlidingCaret } from "../../hooks/useSlidingCaret"

import { cn } from "../../utils/cn"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  // Every input gets the sliding caret: the native caret is hidden and a bar
  // glides to the insertion point as you type.
  const wrapperRef = useSlidingCaret<HTMLSpanElement>()
  return (
    <span ref={wrapperRef} className="relative block w-full">
      <InputPrimitive
        type={type}
        data-slot="input"
        className={cn(
          "h-9 w-full min-w-0 rounded-lg bg-input/50 px-3 py-1 text-base transition-[color,box-shadow] duration-200 outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input dark:disabled:bg-input/60 dark:aria-invalid:ring-destructive/40",
          className
        )}
        {...props}
      />
    </span>
  )
}

export { Input }
