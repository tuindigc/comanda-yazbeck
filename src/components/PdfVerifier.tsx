"use client";

import { useState, useCallback } from "react";
import { Upload, CheckCircle, AlertTriangle, XCircle, FileText, Loader2 } from "lucide-react";

type Difference = { type: string; description: string };
type VerifyResult = {
  matches: number;
  differences: Difference[];
  pdfInfo: { orderNumber: string; date: string; totalPieces: number; totalAmount: number };
};

export default function PdfVerifier({ sessionId }: { sessionId: number }) {
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setError("Solo archivos PDF");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("pdf", file);
    formData.append("sessionId", String(sessionId));

    try {
      const res = await fetch("/api/verify-pdf", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al verificar");
      setResult(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const diffIcon = (type: string) => {
    switch (type) {
      case "missing": return <XCircle size={16} className="text-error flex-shrink-0" />;
      case "extra": return <AlertTriangle size={16} className="text-warning flex-shrink-0" />;
      case "quantity_mismatch": return <AlertTriangle size={16} className="text-error flex-shrink-0" />;
      default: return <AlertTriangle size={16} className="text-secondary flex-shrink-0" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload area */}
      <label
        className={`flex flex-col items-center justify-center rounded-[12px] border-2 border-dashed p-8 cursor-pointer transition-colors ${
          dragOver ? "border-primary bg-primary/5" : "border-border bg-card"
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        {loading ? (
          <Loader2 size={40} className="text-primary animate-spin" />
        ) : (
          <>
            <Upload size={40} className="text-secondary/40 mb-2" />
            <p className="text-sm font-bold text-foreground">Sube el PDF de confirmacion</p>
            <p className="text-xs text-secondary mt-1">Arrastra o toca para seleccionar</p>
          </>
        )}
        <input
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />
      </label>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 rounded-[12px] bg-error/10 p-3 text-sm text-error font-bold">
          <XCircle size={16} />
          {error}
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-3">
          {/* PDF info */}
          <div className="flex items-center gap-3 rounded-[12px] border border-border bg-card p-3">
            <FileText size={20} className="text-primary" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground">Pedido #{result.pdfInfo.orderNumber}</p>
              <p className="text-xs text-secondary">{result.pdfInfo.date} &middot; {result.pdfInfo.totalPieces} pzs &middot; ${result.pdfInfo.totalAmount.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</p>
            </div>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-[12px] bg-success/10 p-3 text-center">
              <p className="text-2xl font-bold text-success">{result.matches}</p>
              <p className="text-xs text-success font-bold">Coincidencias</p>
            </div>
            <div className={`rounded-[12px] p-3 text-center ${result.differences.length === 0 ? "bg-success/10" : "bg-error/10"}`}>
              <p className={`text-2xl font-bold ${result.differences.length === 0 ? "text-success" : "text-error"}`}>
                {result.differences.length}
              </p>
              <p className={`text-xs font-bold ${result.differences.length === 0 ? "text-success" : "text-error"}`}>
                Diferencias
              </p>
            </div>
          </div>

          {/* All good */}
          {result.differences.length === 0 && (
            <div className="flex items-center gap-3 rounded-[12px] bg-success/10 p-4">
              <CheckCircle size={24} className="text-success" />
              <p className="text-sm font-bold text-success">Todo coincide perfectamente</p>
            </div>
          )}

          {/* Differences list */}
          {result.differences.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-foreground">Diferencias encontradas</h3>
              {result.differences.map((diff, i) => (
                <div key={i} className="flex items-start gap-2 rounded-[12px] border border-border bg-card p-3">
                  {diffIcon(diff.type)}
                  <p className="text-sm text-foreground">{diff.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
