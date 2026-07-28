import { useQuery } from '@tanstack/react-query'
import { getBalance } from '../../api/coins'
import { queryKeys } from '../../api/queryKeys'

interface CoinBalanceProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function CoinBalance({ className = '', size = 'md' }: CoinBalanceProps) {
  const { data } = useQuery({
    queryKey: queryKeys.coins.balance,
    queryFn: getBalance,
  })

  const sizeClasses = {
    sm: 'text-xs font-sans',
    md: 'text-sm font-sans',
    lg: 'text-lg font-sans',
  }

  return (
    <span className={`text-[var(--fg)] ${sizeClasses[size]} ${className}`}>
      {data?.balance ?? 0} 🪙
    </span>
  )
}
