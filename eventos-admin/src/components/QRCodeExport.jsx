import { useEffect, useRef } from "react";
import QRCode from "qrcode";

const BASE_URL = import.meta.env.VITE_APP_BASE_URL || "https://buscazap.com.br";

export default function QRCodeExport({ eventoId, eventoNome }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!eventoId || !canvasRef.current) return;
    const url = `${BASE_URL}/feira/${eventoId}`;
    QRCode.toCanvas(canvasRef.current, url, {
      width: 200,
      margin: 2,
      color: { dark: "#1e293b", light: "#fff" },
    }).catch(console.error);
  }, [eventoId]);

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const a = document.createElement("a");
    a.download = `qr-feira-${eventoId}-${eventoNome?.replace(/\s+/g, "-") || eventoId}.png`;
    a.href = canvasRef.current.toDataURL("image/png");
    a.click();
  };

  const url = `${BASE_URL}/feira/${eventoId}`;

  return (
    <div className="card" style={{ maxWidth: 280 }}>
      <h3 style={{ marginTop: 0 }}>QR Code do evento</h3>
      <p style={{ fontSize: "0.875rem", color: "#64748b", marginBottom: "1rem" }}>
        Use no material de divulgação. Quem escanear abre direto a feira no app.
      </p>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem" }}>
        <canvas ref={canvasRef} />
        <a href={url} target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.75rem", wordBreak: "break-all" }}>
          {url}
        </a>
        <button type="button" className="btn btn-primary" onClick={handleDownload}>
          📥 Baixar QR Code
        </button>
      </div>
    </div>
  );
}
