import { useState } from 'react'
import { useAccount } from 'wagmi'
import { toast } from 'sonner'
import { Plus, Loader2 } from 'lucide-react'
import { useCreateJob, makeJobId } from '../hooks/useAgentEscrow'
import { parseOnchainError } from '../utils/format'

interface Props {
  onCreated?: () => void
}

export default function CreateJobForm({ onCreated }: Props) {
  const { address, isConnected } = useAccount()
  const { createJob, isPending, isConfirming, isSuccess, error, reset } = useCreateJob()

  const [worker, setWorker] = useState('')
  const [amount, setAmount] = useState('')
  const [deadlineDate, setDeadlineDate] = useState('')
  const [description, setDescription] = useState('')
  const [lastJobId, setLastJobId] = useState<string | null>(null)

  const isBusy = isPending || isConfirming

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!address) return

    const deadlineUnix = Math.floor(new Date(deadlineDate).getTime() / 1000)
    if (deadlineUnix <= Date.now() / 1000) {
      toast.error('Deadline must be in the future.')
      return
    }
    if (!worker.startsWith('0x') || worker.length !== 42) {
      toast.error('Invalid worker address.')
      return
    }
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      toast.error('Enter a valid USDC amount.')
      return
    }

    const jobId = makeJobId(description || 'job', address)
    setLastJobId(jobId)
    createJob(jobId, worker as `0x${string}`, deadlineUnix, amount)
  }

  if (isSuccess) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 text-center">
        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--success)]/15">
          <span className="text-[var(--success)] text-xl">✓</span>
        </div>
        <p className="text-sm font-medium text-[var(--ink)]">Job created</p>
        <p className="mono mt-1 text-xs text-[var(--subtle)]">{lastJobId?.slice(0, 18)}…</p>
        <button
          onClick={() => { reset(); setWorker(''); setAmount(''); setDeadlineDate(''); setDescription(''); setLastJobId(null); onCreated?.() }}
          className="mt-4 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--bg)] transition hover:bg-[var(--accent-hover)]"
        >
          Create another
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--accent)]/10">
          <Plus size={14} className="text-[var(--accent)]" />
        </div>
        <h2 className="display text-sm font-semibold text-[var(--ink)]">New Job</h2>
      </div>

      <div className="space-y-3">
        <label className="block">
          <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-[var(--subtle)]">Description</span>
          <input
            type="text"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="e.g. Summarise quarterly report"
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-sm text-[var(--ink)] placeholder:text-[var(--subtle)] focus:border-[var(--accent)] focus:outline-none"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-[var(--subtle)]">Worker address</span>
          <input
            type="text"
            value={worker}
            onChange={e => setWorker(e.target.value)}
            placeholder="0x…"
            required
            className="mono w-full rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-sm text-[var(--ink)] placeholder:text-[var(--subtle)] focus:border-[var(--accent)] focus:outline-none"
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-[var(--subtle)]">Amount (USDC)</span>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
                required
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 pr-16 text-sm tabular-nums text-[var(--ink)] placeholder:text-[var(--subtle)] focus:border-[var(--accent)] focus:outline-none"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--subtle)]">USDC</span>
            </div>
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-[var(--subtle)]">Deadline</span>
            <input
              type="datetime-local"
              value={deadlineDate}
              onChange={e => setDeadlineDate(e.target.value)}
              required
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-sm text-[var(--ink)] focus:border-[var(--accent)] focus:outline-none"
            />
          </label>
        </div>
      </div>

      {error && (
        <p className="rounded-lg border border-[var(--danger)]/30 bg-[var(--danger)]/10 px-3 py-2 text-xs text-[var(--danger)]">
          {parseOnchainError(error)}
        </p>
      )}

      <button
        type="submit"
        disabled={!isConnected || isBusy}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] py-2.5 text-sm font-semibold text-[var(--bg)] transition hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isBusy ? <><Loader2 size={14} className="animate-spin" />{isPending ? 'Confirm in wallet…' : 'Confirming…'}</> : 'Lock funds in escrow'}
      </button>

      {!isConnected && (
        <p className="text-center text-xs text-[var(--subtle)]">Connect your wallet to create a job.</p>
      )}
    </form>
  )
}
