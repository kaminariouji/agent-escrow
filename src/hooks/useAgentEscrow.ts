import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount, useSwitchChain } from 'wagmi'
import { keccak256, parseUnits, toBytes } from 'viem'
import { AGENT_ESCROW } from '../contracts/agentEscrow'

const ARC_CHAIN_ID = 5042

export function useJob(jobId: `0x${string}` | null) {
  return useReadContract({
    ...AGENT_ESCROW,
    functionName: 'getJob',
    args: jobId ? [jobId] : undefined,
    query: { enabled: !!jobId, refetchInterval: 4000 },
    chainId: ARC_CHAIN_ID,
  })
}

export function usePendingWithdrawal(address: `0x${string}` | undefined) {
  return useReadContract({
    ...AGENT_ESCROW,
    functionName: 'pendingWithdrawals',
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 4000 },
    chainId: ARC_CHAIN_ID,
  })
}

export function useCreateJob() {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })
  const { chainId } = useAccount()
  const { switchChain } = useSwitchChain()

  const createJob = (jobId: `0x${string}`, worker: `0x${string}`, deadlineUnix: number, amountUsdc: string) => {
    if (chainId !== ARC_CHAIN_ID) { switchChain({ chainId: ARC_CHAIN_ID }); return }
    // Arc native USDC is 18-decimal for msg.value
    const value = parseUnits(amountUsdc, 18)
    writeContract({
      ...AGENT_ESCROW,
      functionName: 'createJob',
      args: [jobId, worker, BigInt(deadlineUnix)],
      value,
    })
  }

  return { createJob, hash, isPending, isConfirming, isSuccess, error, reset }
}

export function useSubmitProof() {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })
  const { chainId } = useAccount()
  const { switchChain } = useSwitchChain()

  const submitProof = (jobId: `0x${string}`, deliverableHash: `0x${string}`) => {
    if (chainId !== ARC_CHAIN_ID) { switchChain({ chainId: ARC_CHAIN_ID }); return }
    writeContract({ ...AGENT_ESCROW, functionName: 'submitProof', args: [jobId, deliverableHash] })
  }

  return { submitProof, hash, isPending, isConfirming, isSuccess, error, reset }
}

export function useRelease() {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })
  const { chainId } = useAccount()
  const { switchChain } = useSwitchChain()

  const release = (jobId: `0x${string}`) => {
    if (chainId !== ARC_CHAIN_ID) { switchChain({ chainId: ARC_CHAIN_ID }); return }
    writeContract({ ...AGENT_ESCROW, functionName: 'release', args: [jobId] })
  }

  return { release, hash, isPending, isConfirming, isSuccess, error, reset }
}

export function useRefund() {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })
  const { chainId } = useAccount()
  const { switchChain } = useSwitchChain()

  const refund = (jobId: `0x${string}`) => {
    if (chainId !== ARC_CHAIN_ID) { switchChain({ chainId: ARC_CHAIN_ID }); return }
    writeContract({ ...AGENT_ESCROW, functionName: 'refund', args: [jobId] })
  }

  return { refund, hash, isPending, isConfirming, isSuccess, error, reset }
}

export function useWithdraw() {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })
  const { chainId } = useAccount()
  const { switchChain } = useSwitchChain()

  const withdraw = () => {
    if (chainId !== ARC_CHAIN_ID) { switchChain({ chainId: ARC_CHAIN_ID }); return }
    writeContract({ ...AGENT_ESCROW, functionName: 'withdraw' })
  }

  return { withdraw, hash, isPending, isConfirming, isSuccess, error, reset }
}

// Deterministic job ID from a string description
export function makeJobId(description: string, buyer: string): `0x${string}` {
  const raw = `${description}:${buyer}:${Date.now()}`
  return keccak256(toBytes(raw))
}

// Make a deliverable hash from any string
export function makeDeliverableHash(content: string): `0x${string}` {
  return keccak256(toBytes(content))
}
