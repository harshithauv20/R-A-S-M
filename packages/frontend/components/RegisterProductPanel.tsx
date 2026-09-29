"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";

import { useSupplyChain } from "@/hooks/useSupplyChain";

export default function RegisterProductPanel() {
  const { isConnected } = useAccount();

  const {
    isDeployed,
    isConnectedWalletParticipant,
    isParticipantLoading,
    isParticipantError,
    registerProduct,
    isWritePending,
    isConfirming,
    isConfirmed,
    writeError,
    refetchTotalProducts,
  } = useSupplyChain();

  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [note, setNote] = useState("");
  const [registeredProductId, setRegisteredProductId] = useState<bigint | null>(null);

  const canSubmit = isConnected && isConnectedWalletParticipant === true && name.trim() && location.trim();

  const handleRegister = () => {
    if (!canSubmit) return;
    setRegisteredProductId(null);
    registerProduct(name.trim(), location.trim(), note.trim());
  };

  useEffect(() => {
    if (!isConfirmed || registeredProductId !== null) return;

    let cancelled = false;
    refetchTotalProducts().then(({ data }) => {
      if (!cancelled && typeof data === "bigint") setRegisteredProductId(data);
    });

    return () => {
      cancelled = true;
    };
  }, [isConfirmed, registeredProductId, refetchTotalProducts]);

  const busy = isWritePending || isConfirming;

  return (
    <div className="card">
      <div className="card-header">
        <h2>Register Product</h2>
        <p className="hint">
          Puts a product on-chain with you as its originator and first custodian — the start of
          its traceability trail.
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
            <label htmlFor="product-name">Product name</label>
            <input
              id="product-name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Widget A, batch #42"
            />
          </div>

          <div className="field">
            <label htmlFor="product-location">Origin location</label>
            <input
              id="product-location"
              type="text"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              placeholder="Factory 1, Shenzhen"
            />
          </div>

          <div className="field">
            <label htmlFor="product-note">Note (optional)</label>
            <input
              id="product-note"
              type="text"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Batch size, certifications, etc."
            />
          </div>

          <div className="wallet">
            <button type="button" onClick={handleRegister} disabled={!canSubmit || busy}>
              {isWritePending
                ? "Confirm in wallet…"
                : isConfirming
                  ? "Registering…"
                  : "Register product"}
            </button>
          </div>

          {!isConnected && <p className="hint">Connect your wallet first.</p>}
          {isConnected && isParticipantError && (
            <p className="network-warning">
              Couldn&apos;t read participant status from the deployed contract — check the browser
              console for the underlying error. Common causes: a stale deployment (run{" "}
              <code>npm run deploy:testnet</code> and reload), or the RPC request was blocked by
              CORS / failed outright (a &quot;Failed to fetch&quot; error in the console).
            </p>
          )}
          {isConnected &&
            !isParticipantLoading &&
            !isParticipantError &&
            isConnectedWalletParticipant === false && (
              <p className="network-warning">
                Connected wallet isn&apos;t an authorized participant. Ask the contract owner to
                grant it participant rights in the Participants panel below.
              </p>
            )}
          {isConfirmed && (
            <p className="status-success">
              Product registered
              {registeredProductId !== null ? ` — product ID ${registeredProductId.toString()}.` : "."}
            </p>
          )}
          {writeError && <p className="network-warning">{writeError.message}</p>}
        </div>
      )}
    </div>
  );
}
