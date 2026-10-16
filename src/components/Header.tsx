import { ConnectKitButton } from 'connectkit'
import { useAccount } from 'wagmi'
import { NetworkArc } from '@web3icons/react'
import { AlertTriangle } from 'lucide-react'
import { useSwitchChain } from 'wagmi'

const ARC_CHAIN_ID = 5042

export default function Header() {
  const { isConnected, chainId } = useAccount()
  const { switchChain, isPending } = useSwitchChain()
  const wrongChain = isConnected && chainId !== ARC_CHAIN_ID

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--bg)]/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)]/10">
            <NetworkArc variant="branded" size={20} />
          </div>
          <div>
            <span className="display text-sm font-semibold tracking-tight text-[var(--ink)]">AgentEscrow</span>
            <span className="ml-2 rounded-full border border-[var(--border)] px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[var(--subtle)]">Arc</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {wrongChain && (
            <button
              onClick={() => switchChain({ chainId: ARC_CHAIN_ID })}
              disabled={isPending}
              className="flex items-center gap-1.5 rounded-lg border border-amber-700/60 bg-amber-900/20 px-3 py-1.5 text-xs font-medium text-amber-300 transition hover:bg-amber-900/40 disabled:opacity-50"
            >
              <AlertTriangle size={12} />
              {isPending ? 'Switching…' : 'Switch to Arc'}
            </button>
          )}
          <ConnectKitButton />
        </div>
      </div>
    </header>
  )
}
