import artifact from '../../contracts/out/AgentEscrow.sol/AgentEscrow.json'

/**
 * Escrow contract address.
 * Override with VITE_ESCROW_ADDRESS in .env (e.g. for a mainnet deployment).
 * Fallback is the Arc Testnet deployment.
 */
export const AGENT_ESCROW_ADDRESS = (
  import.meta.env.VITE_ESCROW_ADDRESS || '0x004ea6ef1fba77b71fc74e47e525ed7d92a0193b'
) as `0x${string}`

/**
 * USDC ERC-20 address.
 * Override with VITE_USDC_ADDRESS in .env.
 * Fallback is the Arc Testnet USDC address (same on mainnet too).
 */
export const USDC_ADDRESS = (
  import.meta.env.VITE_USDC_ADDRESS || '0x3600000000000000000000000000000000000000'
) as `0x${string}`

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
