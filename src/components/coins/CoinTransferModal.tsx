import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { transferCoins } from '../../api/coins'
import { queryKeys } from '../../api/queryKeys'
import { sileo } from 'sileo'
import { ConfirmDialog } from '../common/ConfirmDialog'
import { Input } from '../ui/Input'

interface CoinTransferModalProps {
  open: boolean
  onClose: () => void
}

export function CoinTransferModal({ open, onClose }: CoinTransferModalProps) {
  const [username, setUsername] = useState('')
  const [amount, setAmount] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)
  const queryClient = useQueryClient()

  const transferMutation = useMutation({
    mutationFn: () => transferCoins(username, parseInt(amount)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.coins.balance })
      queryClient.invalidateQueries({ queryKey: queryKeys.coins.transactions })
      sileo.success({ description: `Sent ${amount} coins to ${username}`, icon: false })
      onClose()
      setUsername('')
      setAmount('')
      setShowConfirm(false)
    },
    onError: () => {
      sileo.error({ description: 'Transfer failed. Check the username and your balance.', icon: false })
      setShowConfirm(false)
    },
  })

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        <div className="relative z-10 w-full max-w-md rounded-xl bg-[var(--bg-card)] border border-theme-strong p-6 space-y-4">
          <h2 className="text-[var(--fg)] font-sans text-lg">Transfer Coins</h2>

          <div>
            <label className="block text-sm text-[var(--fg)]/70 mb-1 font-sans">Recipient Username</label>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
            />
          </div>

          <div>
            <label className="block text-sm text-[var(--fg)]/70 mb-1 font-sans">Amount</label>
            <Input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              type="number"
              placeholder="Enter amount"
              min="1"
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-[8px] bg-white/5 text-[var(--fg)]/70 font-sans text-sm hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => setShowConfirm(true)}
              disabled={!username || !amount || parseInt(amount) <= 0}
              className="px-4 py-2 rounded-[8px] bg-blue-600/20 text-blue-400 font-sans text-sm hover:bg-blue-600/30 transition-colors disabled:opacity-50"
            >
              Transfer
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={showConfirm}
        title="Confirm Transfer"
        description={`Send ${amount} coins to ${username}?`}
        confirmLabel="Send"
        variant="default"
        onConfirm={() => transferMutation.mutate()}
        onCancel={() => setShowConfirm(false)}
      />
    </>
  )
}
