"use client";

/*
 * Tooltip — ported from Marnell/src/components/marnell/tooltip.tsx.
 *
 * Vanilla React primitives only — no Base UI / Radix. Root owns open state
 * and shares a setter + trigger ref via context. The trigger is either a
 * real <button> or (asChild) a clone of your element wired with hover,
 * focus, and Escape handlers. Content portals to body and positions itself
 * with plain rect math against the window, flipping sides when it would
 * clip. No hover-trap: leaving the trigger always schedules a close.
 */

import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "../../lib/utils";

type Side = "top" | "right" | "bottom" | "left";
type Align = "start" | "center" | "end";

type TooltipConfig = { delay: number; closeDelay: number };

const ConfigContext = React.createContext<TooltipConfig>({ delay: 50, closeDelay: 50 });

function TooltipProvider({
  delay = 50,
  closeDelay = 50,
  children,
}: {
  delay?: number;
  closeDelay?: number;
  children: React.ReactNode;
}) {
  const config = React.useMemo(() => ({ delay, closeDelay }), [delay, closeDelay]);
  return <ConfigContext.Provider value={config}>{children}</ConfigContext.Provider>;
}

type OpenApi = { open: boolean; setOpen: (open: boolean) => void };

const OpenContext = React.createContext<OpenApi | null>(null);
const TriggerNodeContext = React.createContext<React.MutableRefObject<HTMLElement | null> | null>(null);

function Tooltip({
  children,
  defaultOpen = false,
  open: openProp,
  onOpenChange,
}: {
  children: React.ReactNode;
  /** Uncontrolled initial state. */
  defaultOpen?: boolean;
  /** Controlled open state. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen);
  const isControlled = openProp !== undefined;
  const open = isControlled ? openProp : internalOpen;
  const setOpen = React.useCallback(
    (next: boolean) => {
      if (!isControlled) setInternalOpen(next);
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange],
  );
  const triggerNode = React.useRef<HTMLElement | null>(null);
  return (
    <OpenContext.Provider value={{ open, setOpen }}>
      <TriggerNodeContext.Provider value={triggerNode}>{children}</TriggerNodeContext.Provider>
    </OpenContext.Provider>
  );
}

function TooltipTrigger({
  children,
  className,
  asChild = false,
  type,
  delay,
  closeDelay,
  ...props
}: React.HTMLAttributes<HTMLElement> & {
  children: React.ReactNode;
  /** Wire behavior onto the child element instead of wrapping in a button. */
  asChild?: boolean;
  /** Only used when rendering the default button. */
  type?: "button" | "submit" | "reset";
  /** Override the provider's hover delay for this trigger, in ms. */
  delay?: number;
  /** Override the close delay for this trigger, in ms. */
  closeDelay?: number;
}) {
  const api = React.useContext(OpenContext);
  const config = React.useContext(ConfigContext);
  const nodeRef = React.useContext(TriggerNodeContext);
  const timers = React.useRef<{ open?: number; close?: number }>({});
  const openDelay = delay ?? config.delay;
  const shutDelay = closeDelay ?? config.closeDelay;

  const triggerOpen = React.useCallback(() => {
    window.clearTimeout(timers.current.close);
    window.clearTimeout(timers.current.open);
    timers.current.open = window.setTimeout(() => api?.setOpen(true), openDelay);
  }, [api, openDelay]);

  const triggerClose = React.useCallback(() => {
    window.clearTimeout(timers.current.open);
    window.clearTimeout(timers.current.close);
    timers.current.close = window.setTimeout(() => api?.setOpen(false), shutDelay);
  }, [api, shutDelay]);

  React.useEffect(() => {
    const t = timers.current;
    return () => {
      window.clearTimeout(t.open);
      window.clearTimeout(t.close);
    };
  }, []);

  const handlers = {
    onPointerEnter: () => triggerOpen(),
    onPointerLeave: () => triggerClose(),
    onFocus: () => triggerOpen(),
    onBlur: () => triggerClose(),
    onPointerDown: () => triggerClose(),
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        window.clearTimeout(timers.current.close);
        api?.setOpen(false);
      }
    },
  };

  if (asChild && React.isValidElement(children)) {
    const child = children as React.ReactElement<Record<string, unknown>>;
    const childProps = child.props;
    return React.cloneElement(child, {
      ...props,
      ...childProps,
      ...handlers,
      className: cn(className, childProps.className as string | undefined),
      ref: (node: HTMLElement | null) => {
        if (nodeRef) nodeRef.current = node;
        const childRef = (child as { ref?: React.Ref<HTMLElement> }).ref;
        if (typeof childRef === "function") childRef(node);
      },
    } as Record<string, unknown>);
  }

  return (
    <button
      type={type ?? "button"}
      className={cn(className)}
      ref={(node) => {
        if (nodeRef) nodeRef.current = node;
      }}
      {...handlers}
      {...props}
    >
      {children}
    </button>
  );
}

/** Places the popup relative to a trigger rect, clamped to the viewport. */
function computePosition(
  trigger: DOMRect,
  popup: DOMRect,
  side: Side,
  align: Align,
  sideOffset: number,
): { left: number; top: number } {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const gap = sideOffset + 5; // the arrow bridges the rest
  let left: number;
  let top: number;
  switch (side) {
    case "top":
      left = trigger.left + trigger.width / 2 - popup.width / 2;
      top = trigger.top - popup.height - gap;
      break;
    case "bottom":
      left = trigger.left + trigger.width / 2 - popup.width / 2;
      top = trigger.bottom + gap;
      break;
    case "right":
      left = trigger.right + gap;
      top = trigger.top + trigger.height / 2 - popup.height / 2;
      break;
    case "left":
      left = trigger.left - popup.width - gap;
      top = trigger.top + trigger.height / 2 - popup.height / 2;
      break;
  }
  if (side === "top" || side === "bottom") {
    if (align === "start") left = trigger.left;
    if (align === "end") left = trigger.right - popup.width;
    left = Math.max(8, Math.min(vw - popup.width - 8, left));
  } else {
    if (align === "start") top = trigger.top;
    if (align === "end") top = trigger.bottom - popup.height;
    top = Math.max(8, Math.min(vh - popup.height - 8, top));
  }
  return { left, top };
}

const ENTER_MS = 150;
const EXIT_MS = 110;

function TooltipContent({
  children,
  className,
  side = "top",
  align = "center",
  sideOffset = 5,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  side?: Side;
  align?: Align;
  /** Distance from the trigger in px; the arrow bridges the rest. */
  sideOffset?: number;
}) {
  const api = React.useContext(OpenContext);
  const triggerNodeRef = React.useContext(TriggerNodeContext);
  const open = api?.open ?? false;
  const [phase, setPhase] = React.useState<"closed" | "in" | "out">(open ? "in" : "closed");
  const [coords, setCoords] = React.useState<{ left: number; top: number; side: Side } | null>(null);
  const popupRef = React.useRef<HTMLDivElement | null>(null);

  // Three-phase lifecycle so the exit animation can play before unmount.
  const [prevOpen, setPrevOpen] = React.useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    setCoords(null);
    setPhase(open ? "in" : phase === "closed" ? "closed" : "out");
  }

  React.useEffect(() => {
    if (phase !== "out") return;
    const t = window.setTimeout(() => setPhase("closed"), EXIT_MS);
    return () => window.clearTimeout(t);
  }, [phase]);

  React.useEffect(() => {
    if (phase !== "in") return;
    const place = () => {
      const trigger = triggerNodeRef?.current;
      const popup = popupRef.current;
      if (!trigger || !popup) return;
      const t = trigger.getBoundingClientRect();
      const vh = window.innerHeight;
      const effSide: Side =
        side === "top" && t.top < 90
          ? "bottom"
          : side === "bottom" && vh - t.bottom < 90
            ? "top"
            : side;
      const p = popup.getBoundingClientRect();
      const pos = computePosition(t, p, effSide, align, sideOffset);
      setCoords((prev) => {
        const next = { ...pos, side: effSide };
        if (
          prev &&
          Math.abs(prev.left - next.left) < 0.5 &&
          Math.abs(prev.top - next.top) < 0.5 &&
          prev.side === next.side
        ) {
          return prev;
        }
        return next;
      });
    };
    const first = window.setTimeout(place, 0);
    const second = window.setTimeout(place, 20);
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.clearTimeout(first);
      window.clearTimeout(second);
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [phase, side, align, sideOffset, triggerNodeRef]);

  if (phase === "closed") return null;

  const effSide = coords?.side ?? side;

  const shift = {
    "--tt-shift-x": effSide === "right" ? "-6px" : effSide === "left" ? "6px" : "0px",
    "--tt-shift-y": effSide === "top" ? "6px" : effSide === "bottom" ? "-6px" : "0px",
  } as React.CSSProperties;

  const animation =
    phase === "out"
      ? `mar-tooltip-out ${EXIT_MS}ms ease-in forwards`
      : coords
        ? `mar-tooltip-in ${ENTER_MS}ms cubic-bezier(0.16, 1, 0.3, 1) forwards`
        : undefined;

  return createPortal(
    <div
      ref={popupRef}
      role="tooltip"
      className={cn(
        "mar-tooltip fixed z-50 max-w-72 rounded-lg bg-foreground px-2.5 py-1 text-xs leading-relaxed text-background shadow-md shadow-black/15 outline-none dark:shadow-black/45",
        className,
      )}
      style={{
        left: coords?.left ?? -9999,
        top: coords?.top ?? -9999,
        animation,
        ...shift,
      }}
      {...props}
    >
      {children}
      {effSide === "top" && (
        <svg
          aria-hidden="true"
          viewBox="0 0 12 6"
          className="absolute -bottom-[5px] left-1/2 h-1.5 w-3 -translate-x-1/2 fill-foreground"
        >
          <path d="M0 0 H12 L7.3 4.6 Q6 5.9 4.7 4.6 Z" />
        </svg>
      )}
      {effSide === "bottom" && (
        <svg
          aria-hidden="true"
          viewBox="0 0 12 6"
          className="absolute -top-[5px] left-1/2 h-1.5 w-3 -translate-x-1/2 rotate-180 fill-foreground"
        >
          <path d="M0 0 H12 L7.3 4.6 Q6 5.9 4.7 4.6 Z" />
        </svg>
      )}
      {effSide === "right" && (
        <svg
          aria-hidden="true"
          viewBox="0 0 6 12"
          className="absolute -left-[5px] top-1/2 h-3 w-1.5 -translate-y-1/2 fill-foreground"
        >
          <path d="M6 0 V12 L1.4 7.3 Q0.1 6 1.4 4.7 Z" />
        </svg>
      )}
      {effSide === "left" && (
        <svg
          aria-hidden="true"
          viewBox="0 0 6 12"
          className="absolute -right-[5px] top-1/2 h-3 w-1.5 -translate-y-1/2 fill-foreground"
        >
          <path d="M0 0 V12 L4.6 7.3 Q5.9 6 4.6 4.7 Z" />
        </svg>
      )}
    </div>,
    document.body,
  );
}

/** A keyboard-key chip for use inside tooltip content ("⌘ K" style). */
function TooltipKeycap({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <kbd
      className={cn(
        "inline-flex h-[22px] min-w-[22px] items-center justify-center rounded-[6px] px-1.5",
        "border border-border bg-gradient-to-b from-secondary to-card font-mono text-[11px] font-medium leading-none text-foreground",
        "shadow-[0_2px_0_0_var(--border),inset_0_1px_0_0_rgba(255,255,255,0.5)]",
        "dark:shadow-[0_2px_0_0_rgba(0,0,0,0.6),inset_0_1px_0_0_rgba(255,255,255,0.09)]",
        className,
      )}
    >
      {children}
    </kbd>
  );
}

export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger, TooltipKeycap };