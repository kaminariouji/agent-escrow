import { useState } from 'react'
import { useAccount } from 'wagmi'
import { toast } from 'sonner'
import { ChevronDown, ChevronUp, ExternalLink, Loader2, Clock, Briefcase } from 'lucide-react'
import { useJob, useSubmitProof, useRelease, useRefund, makeDeliverableHash } from '../hooks/useAgentEscrow'
import { JobStatus, JOB_STATUS_LABELS, JOB_STATUS_COLORS } from '../contracts/agentEscrow'
import { formatAddress, formatUSDC, formatDeadline, isExpired, explorerAddr, parseOnchainError } from '../utils/format'

interface Props {
  jobId: `0x${string}`
  onUpdated?: () => void
}

export default function JobCard({ jobId, onUpdated }: Props) {
  const { address } = useAccount()
  const { data: jobData, isLoading, refetch } = useJob(jobId)
  const [expanded, setExpanded] = useState(false)
  const [proofText, setProofText] = useState('')

  const submit = useSubmitProof()
  const release = useRelease()
  const refund = useRefund()

  if (isLoading) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 animate-pulse">
        <div className="h-4 w-1/2 rounded bg-[var(--surface-muted)]" />
      </div>
    )
  }

  if (!jobData) return null

  const [buyer, worker, amount, deadline, deliverableHash, statusRaw] = jobData as [string, string, bigint, bigint, `0x${string}`, number]
  const status = statusRaw as unknown as JobStatus

  if (status === JobStatus.None) return null

  const isBuyer = address?.toLowerCase() === buyer.toLowerCase()
  const isWorker = address?.toLowerCase() === worker.toLowerCase()
  const expired = isExpired(deadline)
  const statusLabel = JOB_STATUS_LABELS[status]
  const statusColor = JOB_STATUS_COLORS[status]

  const isBusy = submit.isPending || submit.isConfirming || release.isPending || release.isConfirming || refund.isPending || refund.isConfirming

  function handleProof() {
    if (!proofText.trim()) { toast.error('Enter proof content first.'); return }
    const hash = makeDeliverableHash(proofText)
    submit.submitProof(jobId, hash)
  }

  if (submit.isSuccess || release.isSuccess || refund.isSuccess) {
    void refetch()
    submit.reset()
    release.reset()
    refund.reset()
    onUpdated?.()
  }

  const actionError = submit.error || release.error || refund.error
  const actionErrorMsg = actionError ? parseOnchainError(actionError) : null

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] transition hover:border-[var(--border-strong)]">
      <button
        onClick={() => setExpanded(v => !v)}
        className="flex w-full items-center justify-between px-4 py-3.5 text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className={`shrink-0 inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${statusColor}`}>
            {statusLabel}
          </span>
          <span className="mono truncate text-xs text-[var(--subtle)]">{jobId.slice(0, 14)}…</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="tabular-nums text-sm font-semibold text-[var(--ink)]">{formatUSDC(amount)} USDC</span>
          {expanded ? <ChevronUp size={14} className="text-[var(--subtle)]" /> : <ChevronDown size={14} className="text-[var(--subtle)]" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-[var(--border)] px-4 pb-4 pt-3 space-y-3">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="space-y-0.5">
              <p className="text-[var(--subtle)] uppercase tracking-wide font-medium">Buyer</p>
              <a href={explorerAddr(buyer)} target="_blank" rel="noopener" className="mono flex items-center gap-1 text-[var(--ink-2)] hover:text-[var(--ink)]">
                {formatAddress(buyer)} {isBuyer && <span className="text-[10px] text-sky-400">(you)</span>}
                <ExternalLink size={10} />
              </a>
            </div>
            <div className="space-y-0.5">
              <p className="text-[var(--subtle)] uppercase tracking-wide font-medium">Worker</p>
              <a href={explorerAddr(worker)} target="_blank" rel="noopener" className="mono flex items-center gap-1 text-[var(--ink-2)] hover:text-[var(--ink)]">
                {formatAddress(worker)} {isWorker && <span className="text-[10px] text-sky-400">(you)</span>}
                <ExternalLink size={10} />
              </a>
            </div>
            <div className="space-y-0.5">
              <p className="text-[var(--subtle)] uppercase tracking-wide font-medium">Deadline</p>
              <p className={`text-[var(--ink-2)] ${expired ? 'text-[var(--danger)]' : ''}`}>
                {formatDeadline(deadline)} {expired && '(expired)'}
              </p>
            </div>
            {deliverableHash !== '0x' + '0'.repeat(64) && (
              <div className="space-y-0.5">
                <p className="text-[var(--subtle)] uppercase tracking-wide font-medium">Proof hash</p>
                <p className="mono text-[var(--ink-2)] truncate">{deliverableHash.slice(0, 18)}…</p>
              </div>
            )}
          </div>

          {actionErrorMsg && (
            <p className="rounded-lg border border-[var(--danger)]/30 bg-[var(--danger)]/10 px-3 py-2 text-xs text-[var(--danger)]">
              {actionErrorMsg}
            </p>
          )}

          <div className="space-y-2">
            {/* Worker: submit proof */}
            {isWorker && status === JobStatus.Funded && (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={proofText}
                  onChange={e => setProofText(e.target.value)}
                  placeholder="Proof / deliverable content (will be hashed)"
                  className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-xs text-[var(--ink)] placeholder:text-[var(--subtle)] focus:border-[var(--accent)] focus:outline-none"
                />
                <button
                  onClick={handleProof}
                  disabled={isBusy}
                  className="flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-amber-500 disabled:opacity-50"
                >
                  {submit.isPending || submit.isConfirming ? <Loader2 size={12} className="animate-spin" /> : <Briefcase size={12} />}
                  Submit proof
                </button>
              </div>
            )}

            {/* Buyer: release */}
            {isBuyer && (status === JobStatus.Funded || status === JobStatus.ProofSubmitted) && (
              <button
                onClick={() => release.release(jobId)}
                disabled={isBusy}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--success)]/20 border border-[var(--success)]/40 py-2 text-xs font-semibold text-[var(--success)] transition hover:bg-[var(--success)]/30 disabled:opacity-50"
              >
                {release.isPending || release.isConfirming ? <Loader2 size={12} className="animate-spin" /> : null}
                {release.isPending ? 'Confirm in wallet…' : release.isConfirming ? 'Confirming…' : 'Release payment to worker'}
              </button>
            )}

            {/* Buyer or worker: refund after deadline (only if Funded, not ProofSubmitted) */}
            {(isBuyer || isWorker) && status === JobStatus.Funded && expired && (
              <button
                onClick={() => refund.refund(jobId)}
                disabled={isBusy}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] py-2 text-xs font-semibold text-[var(--subtle)] transition hover:text-[var(--ink)] disabled:opacity-50"
              >
                {refund.isPending || refund.isConfirming ? <Loader2 size={12} className="animate-spin" /> : <Clock size={12} />}
                {refund.isPending ? 'Confirm in wallet…' : refund.isConfirming ? 'Confirming…' : 'Refund buyer (deadline passed)'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
