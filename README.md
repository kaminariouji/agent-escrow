# AgentEscrow

Agent-to-agent escrow for the agent economy, on [Arc](https://arc.io).

One agent (or service) locks USDC for a deliverable; the worker agent submits a proof hash; the buyer releases payment — or, if the deadline passes without release, the buyer or worker can trigger a refund. Money moves only through the contract.

Built with **Arc Studio** for the [Arc Microgrants: Built with Arc Studio](https://dorahacks.io/hackathon/arc-microgrants-2) program.

- **Arc Studio app**: https://studio.arc.io/app/430cf754-291a-4e76-a84b-603ffc815002
- **Live web app**: _see Cloudflare Pages URL in the hackathon submission_

## How it works

1. **Buyer** calls `createJob(jobId, worker, deadline)` with USDC attached — funds are escrowed in the contract.
2. **Worker** calls `submitProof(jobId, deliverableHash)` — a commitment to the delivered artifact.
3. **Buyer** calls `release(jobId)` — the worker's balance becomes claimable.
4. If the deadline passes while the job is still `Funded`, either party can call `refund(jobId)`.
5. Payouts are **pull-based**: the recipient calls `withdraw()` to move their balance. This avoids push-transfer failures (on Arc, native value transfers can revert for restricted recipients) so a single failing address can never brick the escrow.

## Contract

- `contracts/AgentEscrow.sol` — single-file, no proxies, no upgradeability.
- Arc uses USDC as its native gas token with 18 decimals.

| Network | Address | Deploy tx |
|---|---|---|
| Arc Mainnet (5042) | [`0x3F240c74C5bcF3504EC597d5aCb8CC1136BAc95b`](https://explorer.arc.io/address/0x3F240c74C5bcF3504EC597d5aCb8CC1136BAc95b) | [`0x2a25d481…`](https://explorer.arc.io/tx/0x2a25d4813230227190aec96f774a684bfddc3c9942595a58bb6a3aeeaf40641b) |
| Arc Testnet | [`0x004ea6ef1fba77b71fc74e47e525ed7d92a0193b`](https://explorer.testnet.arc.io/address/0x004ea6ef1fba77b71fc74e47e525ed7d92a0193b) | [`0x6eab9fe8…`](https://explorer.testnet.arc.io/tx/0x6eab9fe876c50d15d5254d7afc66f7cfe6329250a8e9c3beaaf07ba6d7f6ba66) |

### Live mainnet escrow cycle (USDC moved through the contract)

Job `0xcf134cf5cc92dedce0615dd573de1dfd3498b584e5c363c7a67aeccdff4aa35c` — 0.1 USDC funded, proof submitted, released, withdrawn:

| Step | Tx |
|---|---|
| `createJob` (fund 0.1 USDC) | [`0x7dd32d18…`](https://explorer.arc.io/tx/0x7dd32d185916898dfdf908121c65b828cd3265452af615fe9d32e6ce10f04c52) |
| `submitProof` | [`0x9d450fe7…`](https://explorer.arc.io/tx/0x9d450fe74e01bc1775d0267ee9399315bc10d5c3a4d868e2cfcd2312d19b7fec) |
| `release` | [`0x23cf0f3c…`](https://explorer.arc.io/tx/0x23cf0f3c828d5bf1537fde5791156205fddaa1813ac5b84b7238c1b25f7730f6) |
| `withdraw` | [`0x89635d5a…`](https://explorer.arc.io/tx/0x89635d5a257d9a1917197c98563c5fc756da77b0f3cfc75fe54db22280d724c7) |

## Web app

A minimal Vite + TypeScript frontend: connect wallet, create a job, list your jobs (as buyer or worker), submit proof, release, refund, withdraw. Network check for Arc mainnet.

```shell
npm install
npm run dev
```

## Tests

Foundry tests cover the happy path (create → submit → release → withdraw), refund after deadline, post-proof refund rejection, and access-control reverts.

```shell
arc-forge test
```

## Deploy

```shell
arc-forge create contracts/AgentEscrow.sol:AgentEscrow --rpc-url https://rpc.mainnet.arc.io --broadcast
```

## License

MIT
