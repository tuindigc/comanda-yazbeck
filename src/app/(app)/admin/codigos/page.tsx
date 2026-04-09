"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, KeyRound, Copy, Check, Plus } from "lucide-react";
import { getCodes, generateCodes } from "@/app/actions/adminActions";

type Code = Awaited<ReturnType<typeof getCodes>>[number];

export default function CodigosPage() {
  const [codes, setCodes] = useState<Code[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [copied, setCopied] = useState<number | null>(null);

  useEffect(() => {
    getCodes().then((c) => { setCodes(c); setLoading(false); });
  }, []);

  const handleGenerate = () => {
    startTransition(async () => {
      await generateCodes(5);
      const updated = await getCodes();
      setCodes(updated);
    });
  };

  const copyCode = (code: string, id: number) => {
    navigator.clipboard.writeText(code);
    setCopied(id);
    setTimeout(() => setCopied(null), 1500);
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
        <h1 className="text-lg font-bold text-foreground flex-1">Codigos de activacion</h1>
        <button
          onClick={handleGenerate}
          disabled={isPending}
          className="flex items-center gap-1.5 rounded-[12px] bg-primary px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
        >
          <Plus size={16} />
          Generar 5
        </button>
      </div>

      <div className="space-y-2">
        {codes.map((code) => (
          <div key={code.id} className="flex items-center gap-3 rounded-[12px] border border-border bg-card p-3">
            <div className={`flex h-8 w-8 items-center justify-center rounded-full ${code.isUsed ? "bg-secondary/10" : "bg-success/10"}`}>
              <KeyRound size={14} className={code.isUsed ? "text-secondary" : "text-success"} />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-mono font-bold ${code.isUsed ? "text-secondary line-through" : "text-foreground"}`}>
                {code.code}
              </p>
              <p className="text-xs text-secondary">
                {code.isUsed ? `Usado ${code.usedAt ? new Date(code.usedAt).toLocaleDateString("es-MX", { day: "numeric", month: "short" }) : ""}` : "Disponible"}
              </p>
            </div>
            {!code.isUsed && (
              <button onClick={() => copyCode(code.code, code.id)} className="flex items-center justify-center h-8 w-8 rounded-full bg-card border border-border">
                {copied === code.id ? <Check size={14} className="text-success" /> : <Copy size={14} className="text-secondary" />}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
