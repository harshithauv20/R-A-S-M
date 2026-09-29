# Supply Chain Transparency — Startup Guide

This project was scaffolded with the **supplychain** template: a
`SupplyChain` custody registry — product registration, custody handoffs,
and inspection/certification/delivery checkpoints, all immutable on-chain
events — plus a Next.js frontend for participants and a public
`/track/[productId]` page anyone can use to trace a product's full history.
See `QUICKSTART.md` for the general install/deploy/test flow — this file
covers what's specific to this template.

## 1. Install dependencies

```
pnpm/npm install
```

## 2. Configure environment variables

Copy `.env.example` to `.env.local` at the project root and set `PRIVATE_KEY`
to a funded testnet account — this is the account that deploys the
contract and becomes its owner **and** its first participant (see below).
**Never commit `.env.local`.**

## 3. Start the local stack

```
npm run dev
```

This starts a local Hardhat node and the Next.js frontend on
http://localhost:3000.

## 4. Deploy the contract

```
npm run deploy:testnet
```

The contract address and ABI are written to `packages/shared/src/contracts.ts`
automatically — refresh the frontend and it picks up the deployment.

## 5. Owner vs. participant — who can do what

- **Owner** — set once at deploy time (transferable via standard
  `Ownable`). Only the owner can recall a product, pause the contract, and
  grant or remove participant rights.
- **Participant** — any wallet with `isParticipant[address] == true`.
  Participants can register products, transfer custody, and record
  checkpoints. The deployer is a participant automatically, but the owner
  can add more (a manufacturer's wallet, a shipping carrier's wallet, an
  inspector's wallet) with `setParticipant(address, true)` — no
  redeploying, and no single hard-coded address baked into the frontend.

Manage this from the **Participants** panel (owner-only).

## 6. Try it out

1. Open http://localhost:3000 and connect the wallet you deployed with
   (it's both the owner and, by default, a participant).
2. Under **Register Product**, fill in a name and origin location, then
   register it — you become its originator and first custodian.
3. Under **Transfer Custody**, hand the product to another participant's
   address. Only the wallet currently holding a product can do this —
   transferring from any other wallet reverts.
4. Under **Record Checkpoint**, log an inspection, certification, or
   delivery against a product without changing who holds it (any
   participant can do this, not just the current holder — e.g. a
   third-party inspector).
5. Under **Track a Product**, enter a product ID to see its current status
   and full event history, plus a QR code linking to
   `/track/[productId]` — a public page that works for anyone, wallet or
   not, reading straight from the chain.
6. If a product turns out to be counterfeit or unsafe, the owner can
   **Recall** it from the same panel — the history stays on-chain, but
   `recalled` flips to true and no further transfers or checkpoints are
   accepted.

## How traceability actually works

Every action (`registerProduct`, `transferCustody`, `recordCheckpoint`,
`recall`) appends a timestamped event to that product's on-chain history
array. `getHistory(productId)` returns the entire trail in one read — no
cross-referencing separate systems, no waiting on a data warehouse. That's
the whole "single source of truth" pitch: participants and customers read
the same ledger.

## Troubleshooting

- **"No SupplyChain deployment found for this network"** — you haven't run
  `npm run deploy:testnet` yet, or your wallet is on a different network
  than the one you deployed to.
- **A panel shows a red "Couldn't read..." message, or a field is stuck on
  "Loading…" indefinitely** — this is a *read* failing, not the contract.
  Check the browser console: `useSupplyChain` logs the underlying error
  for every failed read. Common causes: (1)
  `packages/shared/src/contracts.ts` points at a stale deployment — run
  `npm run deploy:testnet` again and reload; (2) the RPC request was
  blocked by CORS or failed outright (a "Failed to fetch" error in the
  console) — reads go through the same-origin `/api/rpc/[network]` proxy
  specifically to avoid this; confirm `packages/frontend/lib/wagmi.ts`
  still points its transports there rather than at the RPC URLs directly.
- **Register/Transfer/Checkpoint reverts, or the panel says "not an
  authorized participant"** — connect a wallet with participant rights
  (the deployer has them by default), or have the owner grant them from
  the Participants panel.
- **Transfer reverts with "caller does not hold custody"** — only the
  wallet currently holding a product can transfer it; check who the
  current holder is under Track a Product.
- **Recall, pause, or Participants actions do nothing** — these are
  owner-only; connect the deployer wallet (or whoever ownership was
  transferred to).
