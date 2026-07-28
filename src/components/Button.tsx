import { useState, type ReactNode, type CSSProperties } from 'react';

interface ButtonProps {
  onClick?: () => void;
  children: ReactNode;
  width?: number | string;
  height?: number | string;
  style?: CSSProperties;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'discord' | 'danger';
  tabIndex?: number;
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

export default function Button({ onClick, children, width = 167, height = 23, style, loading, variant = 'primary', type = 'button', tabIndex, disabled, className }: ButtonProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isActive, setIsActive] = useState(false);

  const normalBg = variant === 'secondary' ? 'linear-gradient(180deg, #272727 0%, #232323 0.01%, #0a0a0a 100%)' :
                   variant === 'discord' ? 'linear-gradient(180deg, #272727 0%, #4540AC 0.01%, #0a0a0a 100%)' :
                   variant === 'danger' ? 'linear-gradient(180deg, #dc2626 0%, #991b1b 100%)' :
                   'linear-gradient(180deg, #0033FF 46%, #001F99 100%)';

  const hoverBg = variant === 'secondary' ? 'linear-gradient(0deg, #272727 0%, #232323 0.01%, #0a0a0a 100%)' :
                   variant === 'discord' ? 'linear-gradient(0deg, #272727 0%, #4540AC 0.01%, #0a0a0a 100%)' :
                   variant === 'danger' ? 'linear-gradient(0deg, #ef4444 0%, #b91c1c 100%)' :
                   'linear-gradient(0deg, #0033FF 46%, #001F99 100%)';

  const focusRing = variant === 'secondary' ? 'rgba(255, 255, 255, 0.3)' :
                     variant === 'discord' ? 'rgba(88, 101, 242, 0.6)' :
                     variant === 'danger' ? 'rgba(220, 38, 38, 0.6)' :
                     'rgba(0, 51, 255, 0.6)';

  return (
    <button
      type={type}
      disabled={loading || disabled}
      onClick={onClick}
      tabIndex={tabIndex}
      className={className}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setIsActive(false); }}
      onMouseDown={() => setIsActive(true)}
      onMouseUp={() => setIsActive(false)}
      style={{
        position: 'relative',
        width,
        height,
        borderRadius: 8,
        border: 'none',
        outline: 'none',
        padding: 0,
        margin: 0,
        background: 'transparent',
        cursor: (loading || disabled) ? 'default' : 'pointer',
        transform: isActive && !(loading || disabled) ? 'scale(0.92)' : 'scale(1)',
        boxShadow: isActive && !(loading || disabled) ? `0 0 0 1px #000, 0 0 0 3px ${focusRing}` : 'none',
        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        ...style
      }}
    >
      {/* Normal Gradient */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: normalBg,
        borderRadius: 8,
        opacity: isHovered ? 0 : 1,
        transition: 'opacity 0.4s ease',
      }} />

      {/* Hover Gradient (Upside down) */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: hoverBg,
        borderRadius: 8,
        opacity: isHovered ? 1 : 0,
        transition: 'opacity 0.4s ease',
      }} />

      {/* Text Content */}
      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontSize: typeof height === 'number' ? Math.min(height * 0.5, 14) : 14,
        fontFamily: 'var(--font-sans, ui-sans-serif, system-ui, sans-serif)',
        fontWeight: 400,
        pointerEvents: 'none',
        transition: 'opacity 0.2s ease',
        opacity: loading ? 0.7 : 1,
        whiteSpace: 'nowrap',
        lineHeight: 1,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        padding: '0 8px',
      }}>
        {children}
      </div>
    </button>
  );
}
