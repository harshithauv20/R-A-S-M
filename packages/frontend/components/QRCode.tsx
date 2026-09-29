"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

export function TrackingQR({ value, size = 176 }: { value: string; size?: number }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    QRCode.toDataURL(value, { width: size, margin: 1 })
      .then((url) => {
        if (!cancelled) setDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setDataUrl(null);
      });

    return () => {
      cancelled = true;
    };
  }, [value, size]);

  if (!dataUrl) {
    return <div className="qr-placeholder" style={{ width: size, height: size }} />;
  }

  return <img src={dataUrl} alt="Tracking QR code" width={size} height={size} className="qr-code" />;
}
