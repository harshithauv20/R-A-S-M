"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";

import { useSupplyChain, EVENT_TYPES } from "@/hooks/useSupplyChain";
import { TrackingQR } from "@/components/QRCode";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export default function TrackProductPanel() {
  const { isConnected } = useAccount();
  const [productIdInput, setProductIdInput] = useState("1");
  const [recallReason, setRecallReason] = useState("");

  const parsedProductId = productIdInput.trim() === "" ? undefined : BigInt(productIdInput);

  const {
    product,
    history,
    isProductLoading,
    isProductError,
    isHistoryLoading,
    isDeployed,
    recall,
    isWritePending,
    isConfirming,
    isConfirmed,
    writeError,
    refetchProduct,
    refetchHistory,
  } = useSupplyChain(parsedProductId);

  const trackUrl =
    typeof window !== "undefined" && parsedProductId !== undefined
      ? `${window.location.origin}/track/${parsedProductId.toString()}`
      : "";

  const notFound = product && product.originator === ZERO_ADDRESS;

  const handleRecall = () => {
    if (parsedProductId === undefined) return;
    recall(parsedProductId, recallReason.trim());
  };

  useEffect(() => {
    if (!isConfirmed) return;
    refetchProduct();
    refetchHistory();
  }, [isConfirmed, refetchProduct, refetchHistory]);

  return (
    <div className="card">
      <div className="card-header">
        <h2>Track a Product</h2>
        <p className="hint">
          Look up any product&apos;s current custody and full history, and get a QR code linking
          to its public tracking page.
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
            <label htmlFor="track-product-id">Product ID</label>
            <input
              id="track-product-id"
              type="number"
              min="0"
              value={productIdInput}
              onChange={(event) => setProductIdInput(event.target.value)}
              placeholder="1"
            />
          </div>

          {parsedProductId !== undefined && (
            <>
              {isProductError ? (
                <p className="network-warning">
                  Couldn&apos;t read this product from the deployed contract — check the browser
                  console for the underlying error. Common causes: a stale deployment (run{" "}
                  <code>npm run deploy:testnet</code> and reload), or the RPC request was blocked
                  by CORS / failed outright (a &quot;Failed to fetch&quot; error in the console).
                </p>
              ) : (
                <div className="nft-preview">
                  <div className="qr-frame">
                    <TrackingQR value={trackUrl || parsedProductId.toString()} />
                  </div>

                  <div className="nft-details">
                    {isProductLoading ? (
                      <p className="hint">Loading…</p>
                    ) : !product || notFound ? (
                      <p className="status-error">No product found for this ID.</p>
                    ) : (
                      <>
                        <p>
                          <span className={product.recalled ? "badge badge-revoked" : "badge badge-valid"}>
                            {product.recalled ? "Recalled" : "In circulation"}
                          </span>
                        </p>
                        <p className="stat-value">{product.name}</p>
                        <div className="field">
                          <p className="hint">Current holder</p>
                          <p className="mono break">{product.currentHolder}</p>
                        </div>
                        <div className="field">
                          <p className="hint">Originator</p>
                          <p className="mono break">{product.originator}</p>
                        </div>
                        <div className="field">
                          <p className="hint">Registered</p>
                          <p>{new Date(Number(product.registeredAt) * 1000).toLocaleString()}</p>
                        </div>
                        {!product.recalled && (
                          <div className="wallet">
                            <input
                              type="text"
                              value={recallReason}
                              onChange={(event) => setRecallReason(event.target.value)}
                              placeholder="Reason for recall"
                            />
                            <button
                              type="button"
                              onClick={handleRecall}
                              disabled={!isConnected || isWritePending || isConfirming}
                            >
                              {isWritePending ? "Confirm in wallet…" : isConfirming ? "Recalling…" : "Recall"}
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}

              {product && !notFound && (
                <div className="field">
                  <label>History</label>
                  {isHistoryLoading ? (
                    <p className="hint">Loading…</p>
                  ) : !history || history.length === 0 ? (
                    <p className="hint">No events recorded.</p>
                  ) : (
                    <div className="form-stack">
                      {history.map((event, index) => (
                        <div key={index} className="stat">
                          <p className="stat-value">{EVENT_TYPES[event.eventType] ?? "Unknown"}</p>
                          <p className="hint">{new Date(Number(event.timestamp) * 1000).toLocaleString()}</p>
                          <p className="mono break">actor: {event.actor}</p>
                          {event.eventType === 1 && (
                            <p className="mono break">
                              {event.from} → {event.to}
                            </p>
                          )}
                          {event.location && <p>{event.location}</p>}
                          {event.note && <p className="hint">{event.note}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {isConfirmed && <p className="status-success">Product recalled.</p>}
          {writeError && <p className="network-warning">{writeError.message}</p>}
        </div>
      )}
    </div>
  );
}
