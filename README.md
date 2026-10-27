# AgentEscrow

Agent-to-agent USDC escrow on Arc. A buyer locks USDC when creating a job; the worker submits a proof hash; the buyer releases or refunds.

Built with [Arc Studio](https://studio.arc.io).

## Live on Arc mainnet (chain id 5042)

| | |
|---|---|
| Contract | `0xaa1ad37719722a5dce26439595f9ea2e532a56c2` |
| Deploy tx | `0x862cbb4ddf8436cf88ede695ab5fd1cad4175a1e13a230118f83076fa8236660` |
| App | https://agent-escrow-483.pages.dev |
| Arc Studio project | https://studio.arc.io/app/430cf754-291a-4e76-a84b-603ffc815002 |

The full lifecycle ran on mainnet and moved 0.10 USDC through the contract:

| Step | Transaction |
|---|---|
| `createJob` | `0xaa5a459fdcb69b0e5e6fb83791f89d3d542eaccccf112ea70602994cbeadb543` |
| `submitProof` | `0xfa87e265353f888be625302cf4ae465a4f5e645847111b2b8d1427a70ba44c83` |
| `release` | `0x35139ddaa1f45ca44d4d528e63a422bae018a4f2a681f34183e7754eb923e260` |
| `withdraw` | `0x8571d017f2705c779b358e68cb9ddc197add4b73a745fb58cdbbfa60e8e2300b` |

First deployment, 17 Oct 2026: `0x3F240c74C5bcF3504EC597d5aCb8CC1136BAc95b`, deploy tx `0x2a25d4813230227190aec96f774a684bfddc3c9942595a58bb6a3aeeaf40641b`.

Total cost of the whole exercise, deployment included, was 0.0223 USDC.

## Verify the deployment without a block explorer

Arc's explorer sits behind a login, so the receipts are stored here as well. `media/receipts.json` was produced by reading the public RPC directly, and the same check can be repeated with one command:

```bash
curl -s https://rpc.mainnet.arc.io \
  -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"eth_getTransactionReceipt","params":["0x35139ddaa1f45ca44d4d528e63a422bae018a4f2a681f34183e7754eb923e260"]}'
```

Look for `"status":"0x1"` and `"to":"0xaa1ad37719722a5dce26439595f9ea2e532a56c2"`. The deployed bytecode is non-empty as well:

```bash
curl -s https://rpc.mainnet.arc.io \
  -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"eth_getCode","params":["0xaa1ad37719722a5dce26439595f9ea2e532a56c2","latest"]}'
```

## What the contract does

1. `createJob(jobId, worker, deadline)` with the payment attached.
2. `submitProof(jobId, deliverableHash)` writes the hash of the deliverable on-chain, so the work is timestamped and tamper-evident.
3. `release(jobId)` credits `pendingWithdrawals[worker]` instead of pushing USDC, so a failing recipient cannot block the job or trap the funds.
4. `withdraw()` pays the worker when they ask for it.
5. `refund(jobId)` returns the money to the buyer if the deadline passes with no proof.

## Tech stack

- React 18, Vite, TypeScript, Tailwind CSS
- wagmi v2, viem v2, ConnectKit
- Solidity 0.8.28, Foundry

## Prerequisites

- [Bun](https://bun.sh) v1+
- [Foundry](https://getfoundry.sh) (for contract build/test)

## Install

```bash
bun install
```

## Environment variables

| Variable | Purpose | Required |
|---|---|---|
| `VITE_ARC_NETWORK` | `mainnet` or `testnet` (default: `testnet`) | No |
| `VITE_ESCROW_ADDRESS` | AgentEscrow contract address (defaults to Arc Testnet deployment) | No |
| `VITE_USDC_ADDRESS` | USDC ERC-20 address (defaults to `0x3600000000000000000000000000000000000000`) | No |
| `RPC_PROXY_BASE_URL` | RPC proxy base URL (optional, provisioned by Arc Studio) | No |
| `RPC_PROXY_TOKEN` | RPC proxy auth token (optional, provisioned by Arc Studio) | No |
| `RPC_PROXY_CHAINS` | Comma-separated proxy-supported chain keys (optional, provisioned by Arc Studio) | No |

To point the app at the mainnet deployment above, set `VITE_ARC_NETWORK=mainnet` and `VITE_ESCROW_ADDRESS=0xaa1ad37719722a5dce26439595f9ea2e532a56c2`.

## Run

```bash
bun run dev
```

## Build

```bash
bun run build
```

## Contract build and test

```bash
bun run contracts:build   # forge build
bun run contracts:test    # forge test
```

## Walkthrough

34 seconds: [media/agent-escrow-demo.mp4](media/agent-escrow-demo.mp4)
