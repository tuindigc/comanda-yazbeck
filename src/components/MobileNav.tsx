"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Store, ShoppingBag, ClipboardList, BookOpen, Settings } from "lucide-react";

const tabs = [
  { href: "/proveedores", label: "Inicio", icon: Store },
  { href: "/catalogo", label: "Catálogo", icon: ShoppingBag },
  { href: "/pedido", label: "Pedidos", icon: ClipboardList },
  { href: "/bitacora", label: "Bitácora", icon: BookOpen },
];

export default function MobileNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  const allTabs = isAdmin ? [...tabs, { href: "/admin", label: "Admin", icon: Settings }] : tabs;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around">
        {allTabs.map((tab) => {
          const isActive = pathname === tab.href || pathname.startsWith(tab.href + "/");
          const Icon = tab.icon;
          return (
            <Link key={tab.href} href={tab.href}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-xs transition-colors ${isActive ? "text-primary font-bold" : "text-secondary"}`}>
              <Icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
