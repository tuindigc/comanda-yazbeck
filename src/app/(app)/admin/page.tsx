import Link from "next/link";
import { getAdminStats } from "@/app/actions/adminActions";
import { Users, KeyRound, ShoppingBag, ChevronRight } from "lucide-react";

export default async function AdminPage() {
  const stats = await getAdminStats();

  const cards = [
    { label: "Usuarios", value: `${stats.activeUsers}/${stats.totalUsers}`, sub: "activos", icon: Users, color: "text-primary", bg: "bg-primary/10" },
    { label: "Codigos", value: `${stats.usedCodes}/${stats.totalCodes}`, sub: "usados", icon: KeyRound, color: "text-warning", bg: "bg-warning/10" },
    { label: "Productos", value: String(stats.totalProducts), sub: "en catalogo", icon: ShoppingBag, color: "text-success", bg: "bg-success/10" },
  ];

  const links = [
    { href: "/admin/codigos", label: "Codigos de activacion", desc: "Genera y administra codigos", icon: KeyRound },
    { href: "/admin/usuarios", label: "Usuarios", desc: "Activa y desactiva cuentas", icon: Users },
    { href: "/admin/catalogo", label: "Catalogo de productos", desc: "Administra productos y variantes", icon: ShoppingBag },
  ];

  return (
    <div className="px-4 pt-6 pb-4">
      <h1 className="text-xl font-bold text-foreground mb-6">Admin</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className={`rounded-[12px] ${card.bg} p-3 text-center`}>
              <Icon size={20} className={`${card.color} mx-auto mb-1`} />
              <p className={`text-xl font-bold ${card.color}`}>{card.value}</p>
              <p className="text-xs text-secondary">{card.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Quick links */}
      <div className="space-y-2">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-3 rounded-[12px] border border-border bg-card p-4 active:scale-[0.98] transition-transform"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Icon size={20} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground">{link.label}</p>
                <p className="text-xs text-secondary">{link.desc}</p>
              </div>
              <ChevronRight size={18} className="text-secondary" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
