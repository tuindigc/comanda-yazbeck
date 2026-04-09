import Link from "next/link";
import { getSessions } from "@/app/actions/sessionActions";
import { Clock, Package, CheckCircle } from "lucide-react";

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: typeof Clock }> = {
  BORRADOR: { label: "Borrador", color: "text-warning", bg: "bg-warning/10", icon: Clock },
  CONFIRMADO: { label: "En camino", color: "text-primary", bg: "bg-primary/10", icon: Package },
  RECIBIDO: { label: "Recibido", color: "text-success", bg: "bg-success/10", icon: CheckCircle },
};

export default async function BitacoraPage() {
  const sessions = await getSessions();

  const counts = { BORRADOR: 0, CONFIRMADO: 0, RECIBIDO: 0 };
  sessions.forEach((s) => {
    if (counts[s.status as keyof typeof counts] !== undefined) counts[s.status as keyof typeof counts]++;
  });

  return (
    <div className="px-4 pt-6 pb-4">
      <h1 className="text-xl font-bold text-foreground mb-6">Bitacora</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {(["BORRADOR", "CONFIRMADO", "RECIBIDO"] as const).map((status) => {
          const config = statusConfig[status];
          const Icon = config.icon;
          return (
            <div key={status} className={`rounded-[12px] ${config.bg} p-3 text-center`}>
              <Icon size={20} className={`${config.color} mx-auto mb-1`} />
              <p className={`text-2xl font-bold ${config.color}`}>{counts[status]}</p>
              <p className={`text-xs font-bold ${config.color}`}>{config.label}</p>
            </div>
          );
        })}
      </div>

      {/* Sessions list */}
      {sessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[12px] border border-border bg-card p-8 text-center">
          <Package size={48} className="text-secondary/40 mb-3" />
          <p className="text-sm text-secondary">Sin historial de pedidos</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sessions.map((session) => {
            const config = statusConfig[session.status] || statusConfig.BORRADOR;
            const StatusIcon = config.icon;
            const totalPieces = session.items.reduce((sum, item) => sum + item.quantity, 0);
            const totalCost = session.items.reduce((sum, item) => sum + item.quantity * item.unitCost, 0);

            return (
              <Link
                key={session.id}
                href={`/pedido/${session.id}`}
                className="flex items-center gap-3 rounded-[12px] border border-border bg-card p-3 active:scale-[0.98] transition-transform"
              >
                <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${config.bg}`}>
                  <StatusIcon size={18} className={config.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground truncate">{session.name}</p>
                  <div className="flex items-center gap-2 text-xs text-secondary">
                    <span>{new Date(session.createdAt).toLocaleDateString("es-MX", { day: "numeric", month: "short" })}</span>
                    {session.status === "RECIBIDO" && session.items[0] && (
                      <span>&middot; Recibido</span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end flex-shrink-0">
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
