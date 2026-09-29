"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";

import { useSupplyChain, EVENT_TYPES } from "@/hooks/useSupplyChain";
import { getProofHash } from "@/lib/proofboxFirebase";

const CHECKPOINT_TYPES = EVENT_TYPES.filter(
  (name) =>
    name === "Inspected" ||
    name === "Certified" ||
    name === "Delivered",
);

export default function CheckpointPanel() {
  const { isConnected } = useAccount();

  const {
    isDeployed,
    isConnectedWalletParticipant,
    recordCheckpoint,
    isWritePending,
    isConfirming,
    isConfirmed,
    writeError,
  } = useSupplyChain();

  // --------------------------------------------------
  // Form state
  // --------------------------------------------------

  const [productId, setProductId] = useState("");
  const [eventTypeName, setEventTypeName] = useState<string>(
    CHECKPOINT_TYPES[0],
  );
  const [location, setLocation] = useState("");
  const [note, setNote] = useState("");

  // --------------------------------------------------
  // PROOFBOX Firebase hash
  // --------------------------------------------------

  const [proofHash, setProofHash] = useState<string | null>(null);
  const [hashLoading, setHashLoading] = useState(true);
  const [hashError, setHashError] = useState<string | null>(null);

  // --------------------------------------------------
  // Load proofHash from Firebase
  // --------------------------------------------------

  useEffect(() => {
    const loadProofHash = async () => {
      try {
        setHashLoading(true);
        setHashError(null);

        const hash = await getProofHash();

        setProofHash(hash);
      } catch (error) {
        console.error(
          "Failed to load PROOFBOX proof hash:",
          error,
        );

        setHashError(
          "Unable to load PROOFBOX proof hash from Firebase.",
        );
      } finally {
        setHashLoading(false);
      }
    };

    loadProofHash();
  }, []);

  // --------------------------------------------------
  // Form validation
  // --------------------------------------------------

  const canSubmit =
    isConnected &&
    isConnectedWalletParticipant === true &&
    productId.trim() !== "";

  // --------------------------------------------------
  // Record blockchain checkpoint
  // --------------------------------------------------

 const handleSubmit = () => {
  if (!canSubmit) return;

  if (!proofHash) {
    console.error("PROOFBOX proof hash is not available.");
    return;
  }

  const eventType = EVENT_TYPES.indexOf(
    eventTypeName as (typeof EVENT_TYPES)[number],
  );

  const blockchainNote = note.trim()
    ? `${note.trim()} | PROOFBOX_HASH:${proofHash}`
    : `PROOFBOX_HASH:${proofHash}`;

  recordCheckpoint(
    BigInt(productId),
    eventType,
    location.trim(),
    blockchainNote,
  );
};

  // --------------------------------------------------
  // Transaction state
  // --------------------------------------------------

  const busy = isWritePending || isConfirming;

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (
    <div className="card">
      <div className="card-header">
        <h2>Record Checkpoint</h2>

        <p className="hint">
          Logs an inspection, certification, or delivery
          against a product without changing who holds it —
          e.g. a third-party inspector signing off.
        </p>
      </div>

      {!isDeployed ? (
        <p className="hint">
          No SupplyChain deployment found for this network.
          Run{" "}
          <code>npm run deploy:testnet</code>{" "}
          first.
        </p>
      ) : (
        <div className="form-stack">

          {/* ------------------------------------------ */}
          {/* Product ID */}
          {/* ------------------------------------------ */}

          <div className="field">
            <label htmlFor="checkpoint-product-id">
              Product ID
            </label>

            <input
              id="checkpoint-product-id"
              type="number"
              min="0"
              value={productId}
              onChange={(event) =>
                setProductId(event.target.value)
              }
              placeholder="1"
            />
          </div>

          {/* ------------------------------------------ */}
          {/* Checkpoint type */}
          {/* ------------------------------------------ */}

          <div className="field">
            <label htmlFor="checkpoint-type">
              Checkpoint type
            </label>

            <select
              id="checkpoint-type"
              value={eventTypeName}
              onChange={(event) =>
                setEventTypeName(event.target.value)
              }
            >
              {CHECKPOINT_TYPES.map((name) => (
                <option
                  key={name}
                  value={name}
                >
                  {name}
                </option>
              ))}
            </select>
          </div>

          {/* ------------------------------------------ */}
          {/* Location */}
          {/* ------------------------------------------ */}

          <div className="field">
            <label htmlFor="checkpoint-location">
              Location
            </label>

            <input
              id="checkpoint-location"
              type="text"
              value={location}
              onChange={(event) =>
                setLocation(event.target.value)
              }
              placeholder="PROOFBOX_001"
            />
          </div>

          {/* ------------------------------------------ */}
          {/* Note */}
          {/* ------------------------------------------ */}

          <div className="field">
            <label htmlFor="checkpoint-note">
              Note (optional)
            </label>

            <input
              id="checkpoint-note"
              type="text"
              value={note}
              onChange={(event) =>
                setNote(event.target.value)
              }
              placeholder="Passed customs inspection"
            />
          </div>

          {/* ------------------------------------------ */}
          {/* Firebase Proof Hash */}
          {/* ------------------------------------------ */}

          <div className="field">
            <label>
              PROOFBOX Proof Hash
            </label>

            {hashLoading ? (
              <p className="hint">
                Loading proof hash from Firebase...
              </p>
            ) : hashError ? (
              <p className="network-warning">
                {hashError}
              </p>
            ) : proofHash ? (
              <div
                style={{
                  wordBreak: "break-all",
                  padding: "10px",
                  borderRadius: "6px",
                  background: "rgba(0, 0, 0, 0.05)",
                  fontFamily: "monospace",
                  fontSize: "12px",
                }}
              >
                {proofHash}
              </div>
            ) : (
              <p className="hint">
                No proof hash found in Firebase.
              </p>
            )}
          </div>

          {/* ------------------------------------------ */}
          {/* Wallet / Blockchain button */}
          {/* ------------------------------------------ */}

          <div className="wallet">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit || busy}
            >
              {isWritePending
                ? "Confirm in wallet..."
                : isConfirming
                  ? "Recording..."
                  : "Record checkpoint"}
            </button>
          </div>

          {/* ------------------------------------------ */}
          {/* Wallet status */}
          {/* ------------------------------------------ */}

          {!isConnected && (
            <p className="hint">
              Connect your wallet first.
            </p>
          )}

          {/* ------------------------------------------ */}
          {/* Transaction confirmation */}
          {/* ------------------------------------------ */}

          {isConfirmed && (
            <p className="status-success">
              Checkpoint recorded successfully.
            </p>
          )}

          {/* ------------------------------------------ */}
          {/* Blockchain error */}
          {/* ------------------------------------------ */}

          {writeError && (
            <p className="network-warning">
              {writeError.message}
            </p>
          )}

        </div>
      )}
    </div>
  );
}