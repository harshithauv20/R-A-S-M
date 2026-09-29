"use client";

import { useAccount } from "wagmi";
import { useSupplyChain } from "@/hooks/useSupplyChain";

export default function SupplyChainStats() {
  const { isConnected } = useAccount();

  const {
    isDeployed,
    totalProducts,
    isTotalProductsLoading,
    isTotalProductsError,
    isConnectedWalletParticipant,
    isParticipantLoading,
    isParticipantError,
  } = useSupplyChain();

  const hasReadError = isTotalProductsError || isParticipantError;

  return (
    <div className="card">
      <div className="card-header">
        <h2>Registry</h2>
        <p className="hint">The shared, immutable custody trail every participant reads from.</p>
      </div>

      {!isDeployed ? (
        <p className="hint">
          No SupplyChain deployment found for this network. Run <code>npm run deploy:testnet</code>{" "}
          first.
        </p>
      ) : (
        <>
          {hasReadError && (
            <p className="network-warning">
              Couldn&apos;t read registry data from the deployed contract — check the browser
              console for the underlying error. Common causes: a stale deployment (run{" "}
              <code>npm run deploy:testnet</code> and reload), or the RPC request was blocked by
              CORS / failed outright (a &quot;Failed to fetch&quot; error in the console).
            </p>
          )}
          <div className="grid grid-3">
            <div className="stat">
              <p className="hint">Products registered</p>
              <p className="stat-value">
                {isTotalProductsError
                  ? "Error"
                  : isTotalProductsLoading
                    ? "Loading…"
                    : totalProducts?.toString() || "0"}
              </p>
            </div>
            <div className="stat stat-wide">
              <p className="hint">Your wallet</p>
              <p className="stat-value">
                {!isConnected
                  ? "Not connected"
                  : isParticipantError
                    ? "Error"
                    : isParticipantLoading
                      ? "Loading…"
                      : isConnectedWalletParticipant
                        ? "Authorized participant"
                        : "Not an authorized participant"}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
