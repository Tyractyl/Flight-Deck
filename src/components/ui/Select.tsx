import { type SelectHTMLAttributes } from 'react'

interface SelectOption {
  value: string
  label: string
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  options: SelectOption[]
  placeholder?: string
}

export function Select({ options, placeholder, className = '', ...props }: SelectProps) {
  return (
    <select
      className={`w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] text-[var(--fg)] text-sm border border-theme focus:border-accent-theme transition-colors ${className}`}
      {...props}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  )
}
