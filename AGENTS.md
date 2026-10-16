# AgentEscrow

> Built with Arc Studio - money-powered apps in minutes

This is the **project memory** - what Arc Studio remembers about building this app. It helps future agents (or humans) understand and extend the project.

---

## What This App Does

Agent-to-agent USDC escrow on Arc Testnet. A buyer locks USDC (Arc native) when creating a job; the worker submits a proof hash; the buyer releases payment. If deadline passes unfunded/unproven the buyer can refund. Uses a pull-payment (pendingWithdrawals) model to avoid push-transfer blocklist issues on Arc.

## Deployed Contract

- **AgentEscrow** on Arc Testnet
- Address: `0x004ea6ef1fba77b71fc74e47e525ed7d92a0193b`
- Tx: `0x6eab9fe876c50d15d5254d7afc66f7cfe6329250a8e9c3beaaf07ba6d7f6ba66`
- Explorer: https://explorer.testnet.arc.io/address/0x004ea6ef1fba77b71fc74e47e525ed7d92a0193b
- Metadata: `contracts/contract-metadata/AgentEscrow.json`

## Tech Stack

- Frontend: React 18, Vite, TypeScript, Tailwind CSS
- Web3: wagmi v2, viem v2, ConnectKit
- Contracts: Solidity 0.8.28 + Foundry. Sources in `contracts/`, unit tests in `contracts/test/*.t.sol`. Build with `bun run contracts:build` (`forge build`), test with `bun run contracts:test` (`forge test`).
- Wallet: injected (MetaMask, etc.)
- Chain: Arc Testnet (Chain ID: 5042002, imported from `viem/chains`)
- Token: USDC (6 decimals) (Address: 0x3600000000000000000000000000000000000000, Chain: Arc Testnet)
- Toasts: Sonner

## Key Files

- `src/App.tsx` - Main application logic
- `src/components/` - UI components
- `src/config.ts` - wagmi config (chains, connectors, transports)

## To Run

```bash
bun install
bun run dev
```
