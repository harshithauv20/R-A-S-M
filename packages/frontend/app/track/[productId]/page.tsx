"use client";

import { useSupplyChain, EVENT_TYPES } from "@/hooks/useSupplyChain";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export default function TrackPage({ params }: { params: { productId: string } }) {
  let parsedProductId: bigint | undefined;
  try {
    parsedProductId = BigInt(params.productId);
  } catch {
    parsedProductId = undefined;
  }

  const { product, history, isProductLoading, isHistoryLoading, isDeployed } =
    useSupplyChain(parsedProductId);

  const notFound = product && product.originator === ZERO_ADDRESS;

  return (
    <main>
      <div className="page-header">
        <h1>Product Tracking</h1>
        <p className="hint">Product #{params.productId} — read directly from the SupplyChain contract.</p>
      </div>

      <div className="card">
        {!isDeployed ? (
          <p className="hint">No SupplyChain deployment found for this network.</p>
        ) : parsedProductId === undefined ? (
          <p className="status-error">Invalid product ID.</p>
        ) : isProductLoading ? (
          <p className="hint">Loading…</p>
        ) : !product || notFound ? (
          <p className="badge badge-revoked">Not found</p>
        ) : (
          <>
            <p>
              <span className={product.recalled ? "badge badge-revoked" : "badge badge-valid"}>
                {product.recalled ? "Recalled" : "In circulation"}
              </span>
            </p>

            <div className="form-stack" style={{ marginTop: "1.25rem" }}>
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
            </div>

            <div className="field" style={{ marginTop: "1.25rem" }}>
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
          </>
        )}
      </div>
    </main>
  );
}
