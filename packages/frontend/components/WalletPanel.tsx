"use client";

import { useEffect, useState } from "react";
import { ConnectButton } from "@/components/ConnectButton";
import { NetworkSwitcher } from "@/components/NetworkSwitcher";
import { NetworkWarning } from "@/components/NetworkWarning";

export default function WalletPanel() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <section className="card">
      <div className="card-header">
        <h2>Wallet</h2>

        <p className="hint">
          Connect the wallet of an authorized supply chain participant.
        </p>
      </div>

      <ConnectButton />

      {mounted ? (
        <>
          <NetworkSwitcher />
          <NetworkWarning />
        </>
      ) : null}
    </section>
  );
}