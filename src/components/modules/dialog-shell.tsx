"use client";

/*
 * Dialog shell — copied verbatim from Marnell/src/components/modules/dialog-shell.tsx.
 *
 * Shared mount/unmount lifecycle for dialogs, ported from the prototype's
 * openDialog/closeDialog: the shell starts in a "pre" pose (invisible, lifted,
 * swung back), a double requestAnimationFrame flips it to "in" so the fly-in
 * animation always starts from a painted frame, and closing plays the "out"
 * fade before the parent unmounts it.
 */

import * as React from "react";
import { createPortal } from "react-dom";
import "./modules.css";

export const CLOSE_MS = 300;

type DialogApi = { close: () => void };

const DialogContext = React.createContext<DialogApi | null>(null);

export function useDialog(): DialogApi {
  const api = React.useContext(DialogContext);
  if (!api) throw new Error("Dialog content must render inside <DialogShell>.");
  return api;
}

export function DialogShell({
  width = 448,
  labelledBy,
  busy = false,
  onClose,
  children,
}: {
  width?: number;
  labelledBy?: string;
  /** While busy, backdrop clicks and Escape are ignored (mid-delete). */
  busy?: boolean;
  /** Called after the exit animation has played; unmount here. */
  onClose: () => void;
  children: React.ReactNode;
}) {
  const overlayRef = React.useRef<HTMLDivElement | null>(null);
  const shellRef = React.useRef<HTMLDivElement | null>(null);
  const [phase, setPhase] = React.useState<"pre" | "in" | "out">("pre");
  const closingRef = React.useRef(false);

  const busyRef = React.useRef(busy);
  React.useEffect(() => {
    busyRef.current = busy;
  }, [busy]);

  React.useEffect(() => {
    // Flip to "in" after the pre-pose has had a chance to paint. A double
    // requestAnimationFrame would be the textbook way, but rAF never fires in
    // occluded windows (background tabs), which would leave the dialog
    // permanently invisible — so a timer races it instead. Whichever fires
    // first wins; the set is idempotent.
    let started = false;
    const start = () => {
      if (started) return;
      started = true;
      setPhase("in");
    };
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(start);
    });
    const fallback = window.setTimeout(start, 80);
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      window.clearTimeout(fallback);
    };
  }, []);

  const performClose = React.useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    // The CSS on [data-phase="out"] resets the fly-in pose and plays the exit
    // animations on the same frame, so no JS style surgery is needed here.
    setPhase("out");
    window.setTimeout(onClose, CLOSE_MS);
  }, [onClose]);

  const api = React.useMemo(() => ({ close: performClose }), [performClose]);

  // Backdrop and Escape are user exits: blocked while busy. The close exposed
  // through context is programmatic (e.g. after the delete completes) and
  // always runs.
  const closeIfPermitted = React.useCallback(() => {
    if (busyRef.current) return;
    performClose();
  }, [performClose]);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeIfPermitted();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closeIfPermitted]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <DialogContext.Provider value={api}>
      <div
        ref={overlayRef}
        className="mdl-overlay"
        data-phase={phase}
        data-shown={phase === "in" ? "true" : "false"}
        onMouseDown={(e) => {
          if (e.target === overlayRef.current) closeIfPermitted();
        }}
      >
        <div
          ref={shellRef}
          className="mdl-shell"
          role="dialog"
          aria-modal="true"
          aria-labelledby={labelledBy}
          style={{ width }}
        >
          {children}
        </div>
      </div>
    </DialogContext.Provider>,
    document.body,
  );
}
