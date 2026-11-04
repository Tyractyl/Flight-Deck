import { useMemo } from 'react';

interface GaugeProps {
  value: number;
  min?: number;
  max?: number;
  size?: number;
  totalNotches?: number;
  startAngle?: number;
  endAngle?: number;
  label?: string;
  subLabel?: string;
  activeColor?: string;
  inactiveColor?: string;
  className?: string;
  animated?: boolean;
}

export function Gauge({
  value,
  min = 0,
  max = 100,
  size = 160,
  totalNotches = 40,
  startAngle = 135,
  endAngle = 405,
  label,
  subLabel,
  activeColor = 'var(--chart-1, #4ade80)',
  inactiveColor = 'var(--border, #3f3f46)',
  className,
  animated = true,
}: GaugeProps) {
  const normalizedValue = useMemo(() => {
    const pct = (Math.max(min, Math.min(max, value)) - min) / (max - min);
    return Math.max(0, Math.min(1, pct));
  }, [value, min, max]);

  const center = size / 2;
  const radius = (size * 0.7) / 2;
  const notchWidth = size * 0.028;
  const notchHeight = size * 0.1;

  const notches = useMemo(() => {
    const items = [];
    for (let i = 0; i < totalNotches; i++) {
      const angle = startAngle + ((endAngle - startAngle) * i) / (totalNotches - 1);
      const active = normalizedValue > 0 && i / (totalNotches - 1) <= normalizedValue;
      items.push({ key: i, angle, active });
    }
    return items;
  }, [totalNotches, startAngle, endAngle, normalizedValue]);

  const displayValue = `${Math.round(normalizedValue * 100)}%`;
  const hasValue = normalizedValue > 0;

  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <svg
        width={size}
        height={size}
        style={animated ? { animation: 'gauge-in 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards' } : undefined}
      >
        {notches.map((notch) => {
          const angleRad = (notch.angle * Math.PI) / 180;
          const cx = center + radius * Math.cos(angleRad);
          const cy = center + radius * Math.sin(angleRad);
          const halfH = notchHeight / 2;
          const x1 = cx - halfH * Math.cos(angleRad);
          const y1 = cy - halfH * Math.sin(angleRad);
          const x2 = cx + halfH * Math.cos(angleRad);
          const y2 = cy + halfH * Math.sin(angleRad);
          return (
            <line
              key={notch.key}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={notch.active ? activeColor : inactiveColor}
              strokeWidth={notchWidth}
              strokeLinecap="round"
              opacity={notch.active ? 1 : 0.25}
            />
          );
        })}
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
        }}
      >
        {label ? (
          <span
            className="font-semibold text-[var(--fg)]"
            style={{
              fontSize: size * 0.17,
              color: hasValue ? activeColor : undefined,
              transition: 'color 0.4s ease',
            }}
          >
            {label}
          </span>
        ) : (
          <span
            className="font-semibold text-[var(--fg)]"
            style={{
              fontSize: size * 0.17,
              color: hasValue ? activeColor : undefined,
              transition: 'color 0.4s ease',
            }}
          >
            {displayValue}
          </span>
        )}
        {subLabel && (
          <span
            className="text-[var(--fg-muted)]"
            style={{ fontSize: size * 0.09, marginTop: 2 }}
          >
            {subLabel}
          </span>
        )}
      </div>
    </div>
  );
}

export default Gauge;
