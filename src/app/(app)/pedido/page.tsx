import Link from "next/link";
import { getSessions } from "@/app/actions/sessionActions";
import { Plus, Package, Clock, CheckCircle } from "lucide-react";

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: typeof Clock }> = {
  BORRADOR: { label: "Borrador", color: "text-warning", bg: "bg-warning/10", icon: Clock },
  CONFIRMADO: { label: "En camino", color: "text-primary", bg: "bg-primary/10", icon: Package },
  RECIBIDO: { label: "Recibido", color: "text-success", bg: "bg-success/10", icon: CheckCircle },
};

export default async function PedidoPage() {
  const sessions = await getSessions();

  return (
    <div className="px-4 pt-6 pb-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-foreground">Mis Pedidos</h1>
        <Link
          href="/catalogo"
          className="flex items-center gap-1.5 rounded-[12px] bg-primary px-4 py-2 text-sm font-bold text-white"
        >
          <Plus size={16} />
          Nuevo
        </Link>
      </div>

      {sessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[12px] border border-border bg-card p-8 text-center">
          <Package size={48} className="text-secondary/40 mb-3" />
          <p className="text-sm text-secondary">No tienes pedidos todavia</p>
          <p className="text-xs text-secondary/70 mt-1">Arma tu pedido desde el catalogo</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => {
            const config = statusConfig[session.status] || statusConfig.BORRADOR;
            const StatusIcon = config.icon;
            const totalPieces = session.items.reduce((sum, item) => sum + item.quantity, 0);
            const totalCost = session.items.reduce((sum, item) => sum + item.quantity * item.unitCost, 0);

            return (
              <Link
                key={session.id}
                href={`/pedido/${session.id}`}
                className="flex items-center gap-3 rounded-[12px] border border-border bg-card p-4 shadow-sm active:scale-[0.98] transition-transform"
              >
                <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${config.bg}`}>
                  <StatusIcon size={20} className={config.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground truncate">{session.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-xs font-bold ${config.color}`}>{config.label}</span>
                    <span className="text-xs text-secondary">
                      {new Date(session.createdAt).toLocaleDateString("es-MX", { day: "numeric", month: "short" })}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-sm font-bold text-foreground">{totalPieces} pzs</span>
                  <span className="text-xs text-secondary">${totalCost.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
