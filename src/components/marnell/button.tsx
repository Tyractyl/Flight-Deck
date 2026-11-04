import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cn } from "../../lib/utils";
import { forwardRef } from "react";

/*
 * Button — ported from Marnell/src/components/marnell/button.tsx.
 *
 * Built on Base UI so it gets correct keyboard handling, focus management,
 * and disabled semantics for free. Variant/size are plain Tailwind class
 * tables — no inline gradient backgrounds — so the look picks up theme
 * tokens automatically.
 */

type ButtonVariant =
  | "default"
  | "outline"
  | "secondary"
  | "ghost"
  | "destructive"
  | "link";
type ButtonSize = "default" | "sm" | "lg" | "icon";

interface ButtonProps extends React.ComponentProps<typeof ButtonPrimitive> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Adds a pop-out icon that reveals on hover/focus, signalling the action opens an external link. */
  external?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  default: "bg-primary text-primary-foreground",
  outline: "border-2 border-border border-dashed bg-background",
  secondary: "bg-secondary text-secondary-foreground",
  ghost: "",
  destructive: "bg-destructive/10 text-destructive",
  link: "text-primary underline-offset-4 enabled:hover:underline",
};

const sizeStyles: Record<ButtonSize, string> = {
  default: "h-8 gap-1.5 px-2.5",
  sm: "h-7 gap-1 px-2.5 text-[0.8rem]",
  lg: "h-9 gap-1.5 px-2.5",
  icon: "size-8",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    className,
    variant = "default",
    size = "default",
    external = false,
    children,
    ...props
  },
  ref,
) {
  return (
    <ButtonPrimitive
      ref={ref}
      className={cn(
        "group/btn relative inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent text-sm font-medium whitespace-nowrap transition-[width,height,padding,transform,opacity,background,border-color] duration-200 ease-out outline-none select-none cursor-pointer enabled:active:scale-[0.97] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-40 disabled:!border-transparent disabled:[background-image:repeating-linear-gradient(-45deg,transparent,transparent_4px,rgba(128,128,128,0.15)_4px,rgba(128,128,128,0.15)_5px)] [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
      {...props}
    >
      {children}
      {external && (
        <span
          aria-hidden="true"
          className="grid grid-cols-[0fr] opacity-0 -ms-1.5 transition-[grid-template-columns,margin,opacity] duration-200 ease-out group-hover/btn:grid-cols-[1fr] group-hover/btn:ms-0 group-hover/btn:opacity-100 group-focus-visible/btn:grid-cols-[1fr] group-focus-visible/btn:ms-0 group-focus-visible/btn:opacity-100"
        >
          <span className="overflow-hidden">
            <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 17L17 7M9 7h8v8" />
            </svg>
          </span>
        </span>
      )}
    </ButtonPrimitive>
  );
});

export { Button };
export type { ButtonProps, ButtonVariant, ButtonSize };