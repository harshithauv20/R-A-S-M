"use client";

import { useEffect, useState } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";

export function ConnectButton() {
  const [mounted, setMounted] = useState(false);

  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent Next.js hydration mismatch
  if (!mounted) {
    return (
      <div className="wallet">
        <div style={{ minHeight: "40px" }} />
      </div>
    );
  }

  if (isConnected && address) {
    return (
      <div className="wallet">
        <span className="wallet-address">
          {address.slice(0, 6)}…{address.slice(-4)}
        </span>

        <button type="button" onClick={() => disconnect()}>
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="wallet">
      {connectors.map((connector) => (
        <button
          key={connector.uid}
          type="button"
          onClick={() => connect({ connector })}
          disabled={isPending}
        >
          {isPending ? "Connecting..." : `Connect ${connector.name}`}
        </button>
      ))}
    </div>
  );
}