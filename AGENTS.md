# AgentEscrow

> Built with Arc Studio - money-powered apps in minutes

This is the **project memory** - what Arc Studio remembers about building this app. It helps future agents (or humans) understand and extend the project.

---

## What This App Does

Agent-to-agent USDC escrow on Arc (testnet or mainnet). A buyer locks USDC (Arc native) when creating a job; the worker submits a proof hash; the buyer releases payment. If deadline passes unfunded/unproven the buyer can refund. Uses a pull-payment (pendingWithdrawals) model to avoid push-transfer blocklist issues on Arc.

The active network is selected at build time via `VITE_ARC_NETWORK` (testnet by default). The same build artifact can target mainnet by setting that env var and providing a mainnet contract address via `VITE_ESCROW_ADDRESS`.

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
- Chains: Arc Testnet (5042002) and Arc mainnet (5042); active chain controlled by `VITE_ARC_NETWORK`
- Token: USDC (6 decimals) (Address: 0x3600000000000000000000000000000000000000, same on both Arc chains)
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
