import * as React from "react"
import { Popover as PopoverPrimitive } from "radix-ui"

import { cn } from "../../utils/cn"

const Popover = PopoverPrimitive.Root
const PopoverTrigger = PopoverPrimitive.Trigger
const PopoverAnchor = PopoverPrimitive.Anchor

const PopoverContent = React.forwardRef<
  React.ComponentRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, align = "start", sideOffset = 4, ...props }, ref) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      className={cn(
        "pointer-events-auto bg-[var(--bg-card)] text-[var(--fg)] z-[9999] w-[var(--radix-popover-trigger-width)] rounded-xl border border-[var(--border-strong)] p-1 shadow-2xl backdrop-blur-md outline-none data-[state=open]:[animation:dropdownIn_0.2s_cubic-bezier(0.16,1,0.3,1)_forwards] data-[state=closed]:[animation:dropdownOut_0.15s_ease-in_forwards]",
        className,
      )}
      {...props}
    />
  </PopoverPrimitive.Portal>
))
PopoverContent.displayName = PopoverPrimitive.Content.displayName

export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor }
