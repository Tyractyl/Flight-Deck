import { Button as MarnellButton } from './marnell/button';
import { useState, type CSSProperties, type ReactNode } from 'react';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'discord'
  | 'danger'
  /* Generic names kept so newer call sites read naturally. */
  | 'default'
  | 'destructive'
  | 'outline'
  | 'ghost'
  | 'link';
export type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';

export interface ButtonProps {
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  children: ReactNode;
  width?: number | string;
  height?: number | string;
  style?: CSSProperties;
  loading?: boolean;
  variant?: ButtonVariant;
  size?: ButtonSize;
  tabIndex?: number;
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  title?: string;
  'aria-label'?: string;
}

/*
 * The app-wide button, built on the Marnell button (Base UI primitive +
 * theme tokens). Legacy variant names map onto the Marnell vocabulary so
 * older call sites keep compiling. Call sites that pass explicit
 * width/height (the legacy sizing API) get those applied inline.
 */

const legacyVariantMap: Record<string, 'default' | 'secondary' | 'destructive'> = {
  primary: 'default',
  default: 'default',
  secondary: 'secondary',
  discord: 'secondary',
  danger: 'destructive',
  destructive: 'destructive',
};

export default function Button({
  onClick,
  children,
  width,
  height,
  style,
  loading,
  variant = 'primary',
  size = 'default',
  type = 'button',
  tabIndex,
  disabled,
  className,
  title,
  'aria-label': ariaLabel,
}: ButtonProps) {
  const marnellVariant =
    legacyVariantMap[variant] ?? (variant as 'outline' | 'ghost' | 'link');

  return (
    <MarnellButton
      type={type}
      title={title}
      aria-label={ariaLabel}
      variant={marnellVariant}
      size={size}
      disabled={loading || disabled}
      onClick={onClick}
      tabIndex={tabIndex}
      className={className}
      style={width !== undefined || height !== undefined || style ? { width, height, ...style } : undefined}
    >
      <span
        style={{
          opacity: loading ? 0.7 : 1,
          transition: 'opacity 0.2s ease',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        {children}
      </span>
    </MarnellButton>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Classic gradient button — used on the auth pages only.
 *
 * Hover crossfades to the same gradient flipped upside down (0deg instead
 * of 180deg); pressing scales the button down and shows a colored ring.
 * ──────────────────────────────────────────────────────────────────────────── */

const gradientDesigns = {
  primary: {
    normal: 'linear-gradient(180deg, #0033FF 46%, #001F99 100%)',
    hover: 'linear-gradient(0deg, #0033FF 46%, #001F99 100%)',
    ring: 'rgba(0, 51, 255, 0.6)',
  },
  secondary: {
    normal: 'linear-gradient(180deg, #272727 0%, #232323 0.01%, #0a0a0a 100%)',
    hover: 'linear-gradient(0deg, #272727 0%, #232323 0.01%, #0a0a0a 100%)',
    ring: 'rgba(255, 255, 255, 0.3)',
  },
  discord: {
    normal: 'linear-gradient(180deg, #0a0a0a 0%, #4540AC 99.99%, #272727 100%)',
    hover: 'linear-gradient(180deg, #0a0a0a 0%, #4540AC 99.99%, #272727 100%)',
    ring: 'rgba(88, 101, 242, 0.6)',
  },
  danger: {
    normal: 'linear-gradient(180deg, #dc2626 0%, #991b1b 100%)',
    hover: 'linear-gradient(0deg, #ef4444 0%, #b91c1c 100%)',
    ring: 'rgba(220, 38, 38, 0.6)',
  },
} as const;

type DesignName = keyof typeof gradientDesigns;

const variantToDesign: Record<string, DesignName> = {
  primary: 'primary',
  default: 'primary',
  secondary: 'secondary',
  discord: 'discord',
  danger: 'danger',
  destructive: 'danger',
};

const classicSizeHeights: Record<ButtonSize, number> = {
  default: 23,
  sm: 22,
  lg: 28,
  icon: 23,
};

export function ClassicButton({
  onClick,
  children,
  width,
  height,
  style,
  loading,
  variant = 'primary',
  size,
  type = 'button',
  tabIndex,
  disabled,
  className,
  title,
  'aria-label': ariaLabel,
}: ButtonProps) {
  const designName = variantToDesign[variant] ?? 'primary';
  const design = gradientDesigns[designName];

  const [isHovered, setIsHovered] = useState(false);
  const [isActive, setIsActive] = useState(false);

  const hasExplicitSize = width !== undefined || height !== undefined;
  const resolvedHeight =
    height !== undefined
      ? height
      : size !== undefined
        ? classicSizeHeights[size]
        : 23;
  const inactive = loading || disabled;

  return (
    <button
      type={type}
      title={title}
      aria-label={ariaLabel}
      disabled={inactive}
      onClick={onClick}
      tabIndex={tabIndex}
      className={className}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setIsActive(false); }}
      onMouseDown={() => setIsActive(true)}
      onMouseUp={() => setIsActive(false)}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width,
        height: resolvedHeight,
        padding: hasExplicitSize ? 0 : '0 12px',
        borderRadius: 8,
        border: 'none',
        outline: 'none',
        margin: 0,
        background: 'transparent',
        cursor: inactive ? 'default' : 'pointer',
        transform: isActive && !inactive ? 'scale(0.92)' : 'scale(1)',
        boxShadow: isActive && !inactive ? `0 0 0 1px #000, 0 0 0 3px ${design.ring}` : 'none',
        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        ...style,
      }}
    >
      {/* Normal gradient. When hover uses the same gradient (e.g. discord),
          render one static layer: a crossfade between identical gradients
          dips the combined opacity mid-transition and the page background
          shows through, which reads as a flash on hover. */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background: design.normal,
          borderRadius: 8,
          opacity: design.normal === design.hover ? 1 : isHovered ? 0 : 1,
          transition: 'opacity 0.4s ease',
          pointerEvents: 'none',
        }}
      />

      {/* Hover gradient (upside down) */}
      {design.normal !== design.hover && (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            background: design.hover,
            borderRadius: 8,
            opacity: isHovered ? 1 : 0,
            transition: 'opacity 0.4s ease',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Text content */}
      <div
        style={{
          position: hasExplicitSize ? 'absolute' : 'relative',
          inset: hasExplicitSize ? 0 : undefined,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontSize:
            typeof resolvedHeight === 'number' ? Math.min(resolvedHeight * 0.5, 14) : 14,
          fontFamily: 'var(--font-sans, ui-sans-serif, system-ui, sans-serif)',
          fontWeight: 400,
          pointerEvents: 'none',
          transition: 'opacity 0.2s ease',
          opacity: loading ? 0.7 : 1,
          whiteSpace: 'nowrap',
          lineHeight: 1,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          padding: hasExplicitSize ? '0 8px' : 0,
        }}
      >
        {children}
      </div>
    </button>
  );
}
