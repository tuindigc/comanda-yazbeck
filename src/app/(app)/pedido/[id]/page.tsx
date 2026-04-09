"use client";

import { useEffect, useState, useTransition } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Package, FileSpreadsheet, FileCheck, CheckCircle, Trash2, Clock, Send } from "lucide-react";
import { getSession, confirmSession, markReceived, deleteSession } from "@/app/actions/sessionActions";

type Session = Awaited<ReturnType<typeof getSession>>;

export default function SessionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [session, setSession] = useState<Session>(null);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const id = Number(params.id);

  useEffect(() => {
    getSession(id).then((s) => { setSession(s); setLoading(false); });
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="px-4 pt-6 text-center">
        <p className="text-secondary">Pedido no encontrado</p>
        <Link href="/pedido" className="text-primary text-sm font-bold mt-2 inline-block">Volver</Link>
      </div>
    );
  }

  const totalPieces = session.items.reduce((sum, item) => sum + item.quantity, 0);
  const totalCost = session.items.reduce((sum, item) => sum + item.quantity * item.unitCost, 0);

  const handleConfirm = () => {
    startTransition(async () => {
      await confirmSession(id);
      setSession((prev) => prev ? { ...prev, status: "CONFIRMADO", confirmedAt: new Date() } : prev);
    });
  };

  const handleReceived = () => {
    startTransition(async () => {
      await markReceived(id);
      setSession((prev) => prev ? { ...prev, status: "RECIBIDO", receivedAt: new Date() } : prev);
    });
  };

  const handleDelete = () => {
    if (!confirm("Eliminar este pedido?")) return;
    startTransition(async () => {
      await deleteSession(id);
      router.push("/pedido");
    });
  };

  return (
    <div className="px-4 pt-6 pb-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/pedido" className="flex items-center justify-center h-9 w-9 rounded-full bg-card border border-border">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-foreground truncate">{session.name}</h1>
          <p className="text-xs text-secondary">
            {new Date(session.createdAt).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <StatusBadge status={session.status} />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="rounded-[12px] border border-border bg-card p-3">
          <p className="text-xs text-secondary">Total piezas</p>
          <p className="text-2xl font-bold text-foreground">{totalPieces}</p>
        </div>
        <div className="rounded-[12px] border border-border bg-card p-3">
          <p className="text-xs text-secondary">Total costo</p>
          <p className="text-2xl font-bold text-foreground">${totalCost.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2 mb-6">
        {session.status === "BORRADOR" && (
          <>
            <a
              href={`/api/fill-comanda?sessionId=${id}`}
              className="flex items-center gap-1.5 rounded-[12px] bg-primary px-4 py-2.5 text-sm font-bold text-white"
            >
              <FileSpreadsheet size={16} />
              Generar Excel
            </a>
            <button
              onClick={handleConfirm}
              disabled={isPending}
              className="flex items-center gap-1.5 rounded-[12px] border border-primary px-4 py-2.5 text-sm font-bold text-primary disabled:opacity-50"
            >
              <Send size={16} />
              Marcar enviado
            </button>
            <button
              onClick={handleDelete}
              disabled={isPending}
              className="flex items-center gap-1.5 rounded-[12px] border border-error/30 px-4 py-2.5 text-sm font-bold text-error disabled:opacity-50"
            >
              <Trash2 size={16} />
            </button>
          </>
        )}
        {session.status === "CONFIRMADO" && (
          <>
            <Link
              href={`/pedido/${id}/verificar`}
              className="flex items-center gap-1.5 rounded-[12px] bg-primary px-4 py-2.5 text-sm font-bold text-white"
            >
              <FileCheck size={16} />
              Verificar PDF
            </Link>
            <button
              onClick={handleReceived}
              disabled={isPending}
              className="flex items-center gap-1.5 rounded-[12px] border border-success px-4 py-2.5 text-sm font-bold text-success disabled:opacity-50"
            >
              <CheckCircle size={16} />
              Confirmar recibido
            </button>
          </>
        )}
        {session.status === "RECIBIDO" && (
          <div className="flex items-center gap-2 rounded-[12px] bg-success/10 px-4 py-2.5 text-sm font-bold text-success">
            <CheckCircle size={16} />
            Pedido recibido
            {session.receivedAt && (
              <span className="text-xs font-normal ml-1">
                {new Date(session.receivedAt).toLocaleDateString("es-MX", { day: "numeric", month: "short" })}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Verification history */}
      {session.verificationResults.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-bold text-foreground mb-2">Verificaciones</h2>
          <div className="space-y-2">
            {session.verificationResults.map((v) => (
              <div key={v.id} className="flex items-center gap-3 rounded-[12px] border border-border bg-card p-3">
                <FileCheck size={16} className={v.totalDifferences === 0 ? "text-success" : "text-warning"} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-foreground truncate">{v.pdfFileName}</p>
                  <p className="text-xs text-secondary">
                    {new Date(v.createdAt).toLocaleDateString("es-MX", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-success">{v.totalMatches} ok</p>
                  {v.totalDifferences > 0 && <p className="text-xs font-bold text-error">{v.totalDifferences} dif</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Items List */}
      <h2 className="text-sm font-bold text-foreground mb-2">Articulos ({session.items.length})</h2>
      <div className="space-y-2">
        {session.items.map((item) => {
          const colorHex = item.variant.product.color?.hex || "#cccccc";
          return (
            <div key={item.id} className="flex items-center gap-3 rounded-[12px] border border-border bg-card p-3">
              <span className="inline-block h-4 w-4 rounded-full border border-border/50 flex-shrink-0" style={{ backgroundColor: colorHex }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground truncate">
                  {item.variant.product.color?.name || "Sin color"} - {item.variant.size}
                </p>
                <div className="flex flex-wrap gap-x-2 text-xs text-secondary">
                  {item.variant.product.material && <span>{item.variant.product.material.name}</span>}
                  {item.variant.product.gender && <span>&middot; {item.variant.product.gender.name}</span>}
                  {item.variant.product.cut && <span>&middot; {item.variant.product.cut.name}</span>}
                  {item.variant.weight && <span>&middot; {item.variant.weight.name}</span>}
                </div>
              </div>
              <div className="flex flex-col items-end flex-shrink-0">
                <span className="text-sm font-bold text-foreground">{item.quantity} pzs</span>
                <span className="text-xs text-secondary">${(item.quantity * item.unitCost).toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; color: string; bg: string; icon: typeof Clock }> = {
    BORRADOR: { label: "Borrador", color: "text-warning", bg: "bg-warning/10", icon: Clock },
    CONFIRMADO: { label: "En camino", color: "text-primary", bg: "bg-primary/10", icon: Package },
    RECIBIDO: { label: "Recibido", color: "text-success", bg: "bg-success/10", icon: CheckCircle },
  };
  const c = config[status] || config.BORRADOR;
  const Icon = c.icon;
  return (
    <span className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${c.color} ${c.bg}`}>
      <Icon size={12} />
      {c.label}
    </span>
  );
}
