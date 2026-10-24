import { useState } from 'react'
import Header from './components/Header'
import CreateJobForm from './components/CreateJobForm'
import JobLookup from './components/JobLookup'
import WithdrawBanner from './components/WithdrawBanner'
import { activeArcChain, isMainnet } from './config'
import { AGENT_ESCROW_ADDRESS } from './contracts/agentEscrow'
import { buildAddressExplorerUrl } from './onchain-facts'

export default function App() {
  const [createdIds] = useState<`0x${string}`[]>([])
  const [refreshTick, setRefreshTick] = useState(0)

  // We track job IDs created in this session for the job list
  // (full indexing requires an indexer; this gives immediate feedback for created jobs)
  function handleJobCreated() {
    setRefreshTick(t => t + 1)
  }

  return (
    <div className="min-h-dvh" style={{ background: 'var(--bg-gradient)' }}>
      <Header />

      <WithdrawBanner />

      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-8">
          <h1 className="display text-2xl font-semibold tracking-tight text-[var(--ink)]">Agent Escrow</h1>
          <p className="mt-1 text-sm text-[var(--subtle)]">
            Lock USDC on {isMainnet ? 'Arc' : 'Arc Testnet'} until a worker delivers — then release or refund.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
          {/* Left: create form */}
          <div className="space-y-4">
            <CreateJobForm onCreated={handleJobCreated} />

            {/* Contract info */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-[var(--subtle)]">Contract</p>
              <a
                href={buildAddressExplorerUrl(activeArcChain.id, AGENT_ESCROW_ADDRESS)}
                target="_blank"
                rel="noopener"
                className="mono flex items-center gap-1 text-xs text-[var(--ink-2)] hover:text-[var(--ink)]"
              >
                {AGENT_ESCROW_ADDRESS.slice(0, 10)}…{AGENT_ESCROW_ADDRESS.slice(-5)}
                <span className="text-[var(--subtle)]">↗</span>
              </a>
              <p className="text-[10px] text-[var(--subtle)]">{isMainnet ? 'Arc' : 'Arc Testnet'} · AgentEscrow</p>
            </div>

            {/* How it works */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-[var(--subtle)]">How it works</p>
              <ol className="space-y-1.5 text-xs text-[var(--ink-2)]">
                <li className="flex gap-2"><span className="shrink-0 tabular-nums font-semibold text-[var(--accent)]">1</span>Buyer locks USDC by creating a job.</li>
                <li className="flex gap-2"><span className="shrink-0 tabular-nums font-semibold text-[var(--accent)]">2</span>Worker submits a proof hash when done.</li>
                <li className="flex gap-2"><span className="shrink-0 tabular-nums font-semibold text-[var(--accent)]">3</span>Buyer releases — funds go to worker.</li>
                <li className="flex gap-2"><span className="shrink-0 tabular-nums font-semibold text-[var(--accent)]">4</span>If deadline passes unfilled, buyer can refund.</li>
              </ol>
            </div>
          </div>

          {/* Right: job list */}
          <div>
            <h2 className="display mb-3 text-sm font-semibold text-[var(--ink)]">Jobs</h2>
            <JobLookup initialJobIds={createdIds} refreshTick={refreshTick} />
          </div>
        </div>
      </main>
    </div>
  )
}
