"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import type { Address } from "viem";

import { useSupplyChain } from "@/hooks/useSupplyChain";

export default function ParticipantAdminPanel() {
  const { address, isConnected } = useAccount();

  const {
    owner,
    isOwnerLoading,
    isOwnerError,
    isDeployed,
    setParticipant,
    isWritePending,
    isConfirming,
    isConfirmed,
    writeError,
  } = useSupplyChain();

  const [participantAddress, setParticipantAddress] = useState("");

  const isOwner =
    isConnected && typeof owner === "string" && address?.toLowerCase() === owner.toLowerCase();

  const busy = isWritePending || isConfirming;
  const canSubmit = isOwner && participantAddress.trim().startsWith("0x") && !busy;

  const handleSetParticipant = (allowed: boolean) => {
    if (!canSubmit) return;
    setParticipant(participantAddress.trim() as Address, allowed);
  };

  return (
    <div className="card">
      <div className="card-header">
        <h2>Participants</h2>
        <p className="hint">
          Owner-only. Grant registry rights to any wallet — manufacturers, distributors,
          retailers, inspectors. The deployer is a participant by default.
        </p>
      </div>

      {!isDeployed ? (
        <p className="hint">
          No SupplyChain deployment found for this network. Run <code>npm run deploy:testnet</code>{" "}
          first.
        </p>
      ) : isOwnerError ? (
        <p className="network-warning">
          Couldn&apos;t read <code>owner()</code> from the deployed contract — check the browser
          console for the underlying error. Common causes: a stale deployment (run{" "}
          <code>npm run deploy:testnet</code> and reload), or the RPC request was blocked by CORS
          / failed outright (a &quot;Failed to fetch&quot; error in the console).
        </p>
      ) : isOwnerLoading ? (
        <p className="hint">Loading…</p>
      ) : !isOwner ? (
        <p className="hint">
          Connect the contract owner{owner ? " " : ""}
          {owner ? <code className="mono">{owner.toString()}</code> : null} to manage
          participants.
        </p>
      ) : (
        <div className="form-stack">
          <div className="field">
            <label htmlFor="participant-address">Wallet address</label>
            <input
              id="participant-address"
              type="text"
              value={participantAddress}
              onChange={(event) => setParticipantAddress(event.target.value)}
              placeholder="0x..."
              className="mono"
            />
          </div>

          <div className="wallet">
            <button type="button" onClick={() => handleSetParticipant(true)} disabled={!canSubmit}>
              {busy ? "Confirming…" : "Grant participant role"}
            </button>
            <button type="button" onClick={() => handleSetParticipant(false)} disabled={!canSubmit}>
              {busy ? "Confirming…" : "Revoke participant role"}
            </button>
          </div>

          {isConfirmed && <p className="status-success">Participant list updated.</p>}
          {writeError && <p className="network-warning">{writeError.message}</p>}
        </div>
      )}
    </div>
  );
}
