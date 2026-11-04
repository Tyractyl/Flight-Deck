/*
 * Account menu — the Marnell module (sliding hover highlight, staggered
 * open, keyboard chips, sectioned layout), copied into this repo and wired
 * to real Tyractyl data: the logged-in user, real nav targets, the theme
 * switcher, and a real logout confirmation built on DialogShell.
 *
 * The highlight is frame-measured and ported imperatively from the
 * prototype; it would fight React if it went through state.
 */

import * as React from "react";
import { Link } from "react-router-dom";
import Avatar from "boring-avatars";
import { Button } from "../marnell/button";
import { DialogShell, useDialog } from "./dialog-shell";
import "./account-menu.css";

type Theme = "light" | "dark" | "system";

/* Same generated-avatar setup the account and admin pages use: a user with
   no uploaded picture gets a deterministic beam avatar from their name. */
const AVATAR_COLORS = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981"];

function ProfileAvatar({
  url,
  seed,
  size,
}: {
  url?: string | null;
  seed: string;
  size: number;
}) {
  if (url) {
    return (
      <img
        className="am-pfp"
        src={url}
        alt=""
        onError={(e) => {
          e.currentTarget.style.display = "none";
        }}
      />
    );
  }
  return (
    <span className="am-pfp am-gen">
      <Avatar size={size} name={seed || "user"} variant="beam" colors={AVATAR_COLORS} square />
    </span>
  );
}

type Row = { label: string; to: string };

function MenuRow({ row, index }: { row: Row; index: number }) {
  return (
    <Link to={row.to} className="am-row" style={{ "--i": index } as React.CSSProperties}>
      <span>{row.label}</span>
    </Link>
  );
}

export function AccountMenu({
  name,
  email,
  isAdmin = false,
  onLogout,
  theme,
  setTheme,
  avatarUrl,
  /** "end" right-aligns the menu to the trigger (for the far-right header). */
  align = "start",
}: {
  name: string;
  email: string;
  isAdmin?: boolean;
  onLogout: () => void;
  theme: Theme;
  setTheme: (t: Theme) => void;
  /** Real profile picture URL (user.avatar_url). Falls back to a gradient. */
  avatarUrl?: string | null;
  align?: "start" | "end";
}) {
  const [open, setOpen] = React.useState(false);
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  const menuRef = React.useRef<HTMLDivElement | null>(null);
  const avatarRef = React.useRef<HTMLButtonElement | null>(null);
  const hlRef = React.useRef<HTMLDivElement | null>(null);
  const honRef = React.useRef(false);

  /* Sliding hover highlight. Rows measure against the menu box, so the
     highlight is positioned in the menu's coordinate space. */
  React.useEffect(() => {
    const menu = menuRef.current;
    const hl = hlRef.current;
    if (!menu || !hl) return;
    const over = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const row = target.closest(".am-row") as HTMLElement | null;
      if (!row) return;
      if (!honRef.current) hl.style.transition = "none";
      hl.style.top = `${row.offsetTop}px`;
      hl.style.left = `${row.offsetLeft}px`;
      hl.style.width = `${row.offsetWidth}px`;
      hl.style.height = `${row.offsetHeight}px`;
      hl.style.borderRadius = "8.5px";
      hl.classList.toggle("am-hl-danger", row.hasAttribute("data-d"));
      hl.classList.toggle("am-hl-dark", !!row.closest(".am-bottom") && !row.hasAttribute("data-d"));
      if (!honRef.current) {
        void hl.offsetWidth;
        hl.style.transition = "";
        honRef.current = true;
      }
      hl.style.opacity = "1";
    };
    const leave = () => {
      hl.style.opacity = "0";
      honRef.current = false;
    };
    menu.addEventListener("mouseover", over);
    menu.addEventListener("mouseleave", leave);
    return () => {
      menu.removeEventListener("mouseover", over);
      menu.removeEventListener("mouseleave", leave);
    };
  }, []);

  /* Closing the menu tears down the highlight. */
  React.useEffect(() => {
    if (open) return;
    if (hlRef.current) hlRef.current.style.opacity = "0";
    honRef.current = false;
  }, [open]);

  /* Dismiss on outside click and Escape. The outside-click check must ignore
     clicks on the avatar itself: React delegates events at the document, so
     the avatar's own toggle would otherwise be undone by this listener. */
  React.useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (menuRef.current?.contains(target)) return;
      if (avatarRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("click", onDocClick);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onDocClick);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  const themes: Theme[] = ["light", "dark", "system"];
  const themeLabel: Record<Theme, string> = { light: "Light", dark: "Dark", system: "Auto" };
  const themeRef = React.useRef<HTMLDivElement | null>(null);

  /* The selection pill glides to the active theme button. */
  React.useEffect(() => {
    const box = themeRef.current;
    if (!box) return;
    const pill = box.querySelector(".am-theme-pill") as HTMLDivElement | null;
    const btn = box.querySelector(".am-theme-btn.am-theme-on") as HTMLElement | null;
    if (!pill || !btn) return;
    pill.style.left = `${btn.offsetLeft}px`;
    pill.style.width = `${btn.offsetWidth}px`;
  }, [theme, open]);

  let stagger = 0;
  const nextIndex = () => stagger++;

  const navRows: Row[] = [
    { label: "Account", to: "/account" },
    ...(isAdmin
      ? ([
          { label: "Admin panel", to: "/admin" },
          { label: "Activity log", to: "/admin/activity" },
        ] as Row[])
      : []),
    { label: "AFK Farm", to: "/afk" },
  ];

  return (
    <div className="am-root">
      <button
        className="am-avatar am-avatar-sm"
        ref={avatarRef}
        aria-label="Account menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <ProfileAvatar url={avatarUrl} seed={name || email} size={26} />
      </button>
      <div
        className={`am-menu${align === "end" ? " am-align-end" : ""}`}
        data-open={open}
        ref={menuRef}
        onClick={(e) => {
          // Row click closes the menu, except the theme switcher row, which
          // toggles in place.
          const target = e.target as HTMLElement;
          const row = target.closest(".am-row") as HTMLElement | null;
          if (row && !row.dataset.noclose) {
            setOpen(false);
          }
        }}
      >
        <div className="am-hl" ref={hlRef} />
        <div className="am-panel">
          <div className="am-header" style={{ "--i": nextIndex() } as React.CSSProperties}>
            <div className="am-mav">
              <ProfileAvatar url={avatarUrl} seed={name || email} size={38} />
            </div>
            <div>
              <div className="am-name">{name}</div>
              <div className="am-email">{email}</div>
            </div>
          </div>

          {navRows.map((row) => (
            <MenuRow key={row.label} row={row} index={nextIndex()} />
          ))}

        </div>

        <div className="am-bottom">
          <div className="am-row" data-noclose style={{ "--i": nextIndex() } as React.CSSProperties}>
            <span>Theme</span>
            <span className="am-sp" />
            <div ref={themeRef} className="am-theme" onClick={(e) => e.stopPropagation()}>
              <span className="am-theme-pill" aria-hidden="true" />
              {themes.map((t) => (
                <button
                  key={t}
                  type="button"
                  aria-label={`${t} theme`}
                  aria-pressed={theme === t}
                  onClick={() => setTheme(t)}
                  className={theme === t ? "am-theme-btn am-theme-on" : "am-theme-btn"}
                >
                  {themeLabel[t]}
                </button>
              ))}
            </div>
          </div>
          <button
            type="button"
            className="am-row am-btn"
            data-d
            onClick={() => {
              setOpen(false);
              setConfirmOpen(true);
            }}
            style={{ "--i": nextIndex() } as React.CSSProperties}
          >
            <span>Log out</span>
            <span className="am-sp" />
          </button>
        </div>
      </div>

      {confirmOpen && (
        <DialogShell width={400} labelledBy="am-logout-title" onClose={() => setConfirmOpen(false)}>
          <LogoutConfirm onConfirm={onLogout} />
        </DialogShell>
      )}
    </div>
  );
}

function LogoutConfirm({ onConfirm }: { onConfirm: () => void }) {
  const { close } = useDialog();
  return (
    <div className="p-5">
      <h2 id="am-logout-title" className="text-[var(--fg)] text-lg font-semibold">
        Log out?
      </h2>
      <p className="text-[var(--fg-muted)] text-sm mt-2">
        You'll need to sign in again to manage your servers.
      </p>
      <div className="flex justify-end gap-2 mt-6">
        <Button variant="secondary" onClick={close}>
          Cancel
        </Button>
        <Button
          variant="destructive"
          onClick={() => {
            onConfirm();
            close();
          }}
        >
          Log out
        </Button>
      </div>
    </div>
  );
}
