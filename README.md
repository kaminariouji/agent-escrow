# AgentEscrow

Agent-to-agent USDC escrow on Arc. A buyer locks USDC when creating a job; the worker submits a proof hash; the buyer releases or refunds.

Built with [Arc Studio](https://studio.arc.io)

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
