import { requireChain, buildTxExplorerUrl, buildAddressExplorerUrl } from '@/onchain-facts'
import { formatAmount } from '@/onchain-money'

const ARC_TESTNET_ID = 5042002

export function formatAddress(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

export function formatUSDC(rawNative: bigint): string {
  // Arc native USDC has 18 decimals; display with 6 sig figs max
  const asFloat = Number(rawNative) / 1e18
  if (asFloat === 0) return '0.00'
  if (asFloat < 0.01) return asFloat.toFixed(6)
  return asFloat.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })
}

export function explorerTx(hash: string): string {
  return buildTxExplorerUrl(ARC_TESTNET_ID, hash)
}

export function explorerAddr(addr: string): string {
  return buildAddressExplorerUrl(ARC_TESTNET_ID, addr)
}

export function formatDeadline(ts: bigint): string {
  const d = new Date(Number(ts) * 1000)
  return d.toLocaleString()
}

export function isExpired(deadline: bigint): boolean {
  return Date.now() / 1000 > Number(deadline)
}

export function parseOnchainError(error: unknown): string {
  const msg = (error as { message?: string })?.message?.toLowerCase() ?? ''
  if (msg.includes('user rejected') || msg.includes('denied')) return 'Transaction cancelled.'
  if (msg.includes('insufficient funds') || msg.includes('exceeds balance')) return 'Insufficient balance.'
  if (msg.includes('notbuyer')) return 'Only the buyer can do this.'
  if (msg.includes('notworker')) return 'Only the worker can do this.'
  if (msg.includes('deadlinenotpassed')) return 'Deadline has not passed yet.'
  if (msg.includes('invalidstatus')) return 'Job is not in the right state for this action.'
  if (msg.includes('jobalreadyexists')) return 'A job with this ID already exists.'
  if (msg.includes('invaliddeadline')) return 'Deadline must be in the future.'
  if (msg.includes('invalidamount')) return 'Amount must be greater than zero.'
  if (msg.includes('invalidworker')) return 'Invalid worker address.'
  if (msg.includes('nothingtow')) return 'Nothing to withdraw.'
  if (msg.includes('reverted')) return 'Transaction reverted. Check job state.'
  if (msg.includes('network') || msg.includes('timeout')) return 'Network error. Please retry.'
  return 'Something went wrong. Please try again.'
}

export { requireChain, formatAmount }
