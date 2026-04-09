"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, User, ShieldCheck, ShieldOff } from "lucide-react";
import { getUsers, toggleUserActive } from "@/app/actions/adminActions";

type UserProfile = Awaited<ReturnType<typeof getUsers>>[number];

export default function UsuariosPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    getUsers().then((u) => { setUsers(u); setLoading(false); });
  }, []);

  const handleToggle = (userId: string, currentActive: boolean) => {
    startTransition(async () => {
      await toggleUserActive(userId, !currentActive);
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, isActive: !currentActive } : u));
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 pb-4">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin" className="flex items-center justify-center h-9 w-9 rounded-full bg-card border border-border">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-lg font-bold text-foreground">Usuarios</h1>
      </div>

      {users.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[12px] border border-border bg-card p-8 text-center">
          <User size={48} className="text-secondary/40 mb-3" />
          <p className="text-sm text-secondary">Sin usuarios registrados</p>
        </div>
      ) : (
        <div className="space-y-2">
          {users.map((user) => (
            <div key={user.id} className="flex items-center gap-3 rounded-[12px] border border-border bg-card p-3">
              <div className={`flex h-9 w-9 items-center justify-center rounded-full ${user.isActive ? "bg-success/10" : "bg-error/10"}`}>
                <User size={16} className={user.isActive ? "text-success" : "text-error"} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground truncate">{user.name || user.email}</p>
                <div className="flex items-center gap-2 text-xs text-secondary">
                  <span>{user.email}</span>
                  {user.role === "ADMIN" && <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">ADMIN</span>}
                </div>
              </div>
              <button
                onClick={() => handleToggle(user.id, user.isActive)}
                disabled={isPending}
                className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold transition-colors disabled:opacity-50 ${
                  user.isActive ? "bg-success/10 text-success" : "bg-error/10 text-error"
                }`}
              >
                {user.isActive ? <ShieldCheck size={14} /> : <ShieldOff size={14} />}
                {user.isActive ? "Activo" : "Inactivo"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
