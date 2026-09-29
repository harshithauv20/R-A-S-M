"use client";

import dynamic from "next/dynamic";

const WalletPanel = dynamic(
  () => import("@/components/WalletPanel"),
  { ssr: false }
);

const RegisterProductPanel = dynamic(
  () => import("@/components/RegisterProductPanel"),
  { ssr: false }
);

const TransferCustodyPanel = dynamic(
  () => import("@/components/TransferCustodyPanel"),
  { ssr: false }
);

const CheckpointPanel = dynamic(
  () => import("@/components/CheckpointPanel"),
  { ssr: false }
);

const TrackProductPanel = dynamic(
  () => import("@/components/TrackProductPanel"),
  { ssr: false }
);

export default function Page() {
  return (
    <main>
      <div className="page-header">
        <h1>Supply Chain Transparency</h1>

        <p className="hint">
          Every registration, handoff, and checkpoint is an immutable on-chain
          event — the same ledger every participant and customer reads from,
          with instant traceability by product ID or QR code.
        </p>
      </div>

      {/* WALLET */}
      <WalletPanel />

      {/* PROOFBOX */}
      <section className="card">
        <div className="card-header">
          <h2>ProofBox</h2>

          <p className="hint">
            Blockchain-backed supply chain verification and traceability.
          </p>
        </div>

        <div className="grid grid-3">
          <div className="stat">
            <p className="hint">Registry</p>
            <p className="stat-value">Ready</p>
          </div>

          <div className="stat">
            <p className="hint">Blockchain</p>
            <p className="stat-value">MST</p>
          </div>

          <div className="stat">
            <p className="hint">Tracking</p>
            <p className="stat-value">QR Enabled</p>
          </div>
        </div>
      </section>

      {/* REGISTER PRODUCT */}
      <RegisterProductPanel />

      {/* TRANSFER CUSTODY */}
      <TransferCustodyPanel />

      {/* RECORD CHECKPOINT */}
      <CheckpointPanel />

      {/* TRACK PRODUCT */}
      <TrackProductPanel />

      {/* PARTICIPANTS */}
      <section className="card">
        <div className="card-header">
          <h2>Participants</h2>

          <p className="hint">
            Authorized supply-chain participants can interact with the registry.
          </p>
        </div>

        <p className="hint">
          Participant authorization is managed through the MST blockchain
          registry.
        </p>
      </section>
    </main>
  );
}