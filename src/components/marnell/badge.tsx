import { cn } from "../../lib/utils";

/*
 * Badge — small status / label indicator. Ported from Marnell.
 * Uses theme tokens (bg-primary, bg-secondary, etc.) rather than hardcoded colors.
 */

type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-primary text-primary-foreground",
  secondary: "bg-secondary text-secondary-foreground",
  destructive:
    "text-destructive bg-[color-mix(in_oklab,var(--destructive)_8%,var(--background))] bg-[repeating-linear-gradient(-45deg,color-mix(in_oklab,var(--destructive)_30%,transparent)_0px,transparent_1.5px,transparent_5px)]",
  outline: "border-2 border-dashed border-border text-foreground",
};

function Badge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1.5 overflow-hidden rounded-md px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        variantStyles[variant],
        className,
      )}
      {...props}
    />
  );
}

export { Badge };
export type { BadgeProps, BadgeVariant };