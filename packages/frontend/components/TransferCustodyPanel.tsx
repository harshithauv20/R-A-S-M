"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import type { Address } from "viem";

import { useSupplyChain } from "@/hooks/useSupplyChain";

export default function TransferCustodyPanel() {
  const { isConnected } = useAccount();

  const {
    isDeployed,
    isConnectedWalletParticipant,
    transferCustody,
    isWritePending,
    isConfirming,
    isConfirmed,
    writeError,
  } = useSupplyChain();

  const [productId, setProductId] = useState("");
  const [to, setTo] = useState("");
  const [location, setLocation] = useState("");
  const [note, setNote] = useState("");

  const canSubmit =
    isConnected &&
    isConnectedWalletParticipant === true &&
    productId.trim() !== "" &&
    to.trim().startsWith("0x");

  const handleTransfer = () => {
    if (!canSubmit) return;
    transferCustody(BigInt(productId), to.trim() as Address, location.trim(), note.trim());
  };

  const busy = isWritePending || isConfirming;

  return (
    <div className="card">
      <div className="card-header">
        <h2>Transfer Custody</h2>
        <p className="hint">
          Hands a product to the next participant — only the wallet currently holding it can
          initiate this.
        </p>
      </div>

      {!isDeployed ? (
        <p className="hint">
          No SupplyChain deployment found for this network. Run <code>npm run deploy:testnet</code>{" "}
          first.
        </p>
      ) : (
        <div className="form-stack">
          <div className="field">
            <label htmlFor="transfer-product-id">Product ID</label>
            <input
              id="transfer-product-id"
              type="number"
              min="0"
              value={productId}
              onChange={(event) => setProductId(event.target.value)}
              placeholder="1"
            />
          </div>

          <div className="field">
            <label htmlFor="transfer-to">Recipient address</label>
            <input
              id="transfer-to"
              type="text"
              value={to}
              onChange={(event) => setTo(event.target.value)}
              placeholder="0x..."
              className="mono"
            />
            <p className="hint">Must be a wallet with participant rights.</p>
          </div>

          <div className="field">
            <label htmlFor="transfer-location">Location</label>
            <input
              id="transfer-location"
              type="text"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              placeholder="Warehouse 2, Rotterdam"
            />
          </div>

          <div className="field">
            <label htmlFor="transfer-note">Note (optional)</label>
            <input
              id="transfer-note"
              type="text"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Handoff details"
            />
          </div>

          <div className="wallet">
            <button type="button" onClick={handleTransfer} disabled={!canSubmit || busy}>
              {isWritePending ? "Confirm in wallet…" : isConfirming ? "Transferring…" : "Transfer custody"}
            </button>
          </div>

          {!isConnected && <p className="hint">Connect your wallet first.</p>}
          {isConfirmed && <p className="status-success">Custody transferred.</p>}
          {writeError && <p className="network-warning">{writeError.message}</p>}
        </div>
      )}
    </div>
  );
}
