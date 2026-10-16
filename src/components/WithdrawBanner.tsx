import { useAccount } from 'wagmi'
import { Loader2, ArrowDownToLine } from 'lucide-react'
import { usePendingWithdrawal, useWithdraw } from '../hooks/useAgentEscrow'
import { formatUSDC, parseOnchainError } from '../utils/format'

export default function WithdrawBanner() {
  const { address } = useAccount()
  const { data: pending, refetch } = usePendingWithdrawal(address)
  const { withdraw, isPending, isConfirming, isSuccess, error, reset } = useWithdraw()

  if (!address || !pending || (pending as bigint) === 0n) return null

  if (isSuccess) {
    void refetch()
    reset()
    return null
  }

  const isBusy = isPending || isConfirming

  return (
    <div className="mx-auto max-w-5xl px-4 pt-4">
      <div className="flex items-center justify-between rounded-xl border border-[var(--success)]/40 bg-[var(--success)]/10 px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-[var(--success)]">Funds available to withdraw</p>
          <p className="tabular-nums text-xs text-[var(--subtle)]">{formatUSDC(pending as bigint)} USDC credited to your address</p>
          {error && <p className="mt-1 text-xs text-[var(--danger)]">{parseOnchainError(error)}</p>}
        </div>
        <button
          onClick={withdraw}
          disabled={isBusy}
          className="flex items-center gap-2 rounded-lg bg-[var(--success)]/20 border border-[var(--success)]/40 px-3 py-2 text-sm font-semibold text-[var(--success)] transition hover:bg-[var(--success)]/30 disabled:opacity-50"
        >
          {isBusy ? <Loader2 size={14} className="animate-spin" /> : <ArrowDownToLine size={14} />}
          {isPending ? 'Confirm…' : isConfirming ? 'Withdrawing…' : 'Withdraw'}
        </button>
      </div>
    </div>
  )
}
