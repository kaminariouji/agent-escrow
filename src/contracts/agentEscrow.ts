import artifact from '../../contracts/out/AgentEscrow.sol/AgentEscrow.json'

export const AGENT_ESCROW_ADDRESS = '0x3F240c74C5bcF3504EC597d5aCb8CC1136BAc95b' as `0x${string}`

export const AGENT_ESCROW_ABI = artifact.abi

export const AGENT_ESCROW = {
  address: AGENT_ESCROW_ADDRESS,
  abi: AGENT_ESCROW_ABI,
} as const

// JobStatus enum mirrors the contract
export enum JobStatus {
  None = 0,
  Funded = 1,
  ProofSubmitted = 2,
  Released = 3,
  Refunded = 4,
}

export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  [JobStatus.None]: 'None',
  [JobStatus.Funded]: 'Funded',
  [JobStatus.ProofSubmitted]: 'Proof Submitted',
  [JobStatus.Released]: 'Released',
  [JobStatus.Refunded]: 'Refunded',
}

export const JOB_STATUS_COLORS: Record<JobStatus, string> = {
  [JobStatus.None]: 'text-[var(--subtle)] border-[var(--border)]',
  [JobStatus.Funded]: 'text-sky-300 border-sky-700 bg-sky-900/30',
  [JobStatus.ProofSubmitted]: 'text-amber-300 border-amber-700 bg-amber-900/30',
  [JobStatus.Released]: 'text-[var(--success)] border-emerald-700 bg-emerald-900/20',
  [JobStatus.Refunded]: 'text-[var(--subtle)] border-[var(--border)] bg-[var(--surface-muted)]',
}
