"use client";

import { useState } from "react";
import { activateAndSignUp, signIn } from "@/app/actions/authActions";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "activate">("login");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(formData: FormData) {
    setLoading(true);
    setError("");
    const result = await signIn(formData.get("email") as string, formData.get("password") as string);
    if (result?.error) { setError(result.error); setLoading(false); }
  }

  async function handleActivate(formData: FormData) {
    setLoading(true);
    setError("");
    const result = await activateAndSignUp(
      formData.get("code") as string,
      formData.get("email") as string,
      formData.get("password") as string,
      formData.get("name") as string
    );
    if (result?.error) { setError(result.error); setLoading(false); }
    else { await signIn(formData.get("email") as string, formData.get("password") as string); }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-primary">Comanda Yazbeck</h1>
          <p className="mt-1 text-sm text-secondary">
            {mode === "login" ? "Inicia sesión" : "Activa tu cuenta con tu código"}
          </p>
        </div>

        {error && <div className="rounded-[12px] bg-red-50 p-3 text-sm text-error">{error}</div>}

        {mode === "login" ? (
          <form action={handleLogin} className="space-y-4">
            <input name="email" type="email" placeholder="Email" required className="w-full rounded-[12px] border border-border bg-input px-4 py-3 text-foreground outline-none focus:ring-2 focus:ring-primary/20" />
            <input name="password" type="password" placeholder="Contraseña" required className="w-full rounded-[12px] border border-border bg-input px-4 py-3 text-foreground outline-none focus:ring-2 focus:ring-primary/20" />
            <button type="submit" disabled={loading} className="w-full rounded-[12px] bg-primary py-3 font-bold text-white transition-colors hover:bg-primary-hover disabled:opacity-50">
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>
        ) : (
          <form action={handleActivate} className="space-y-4">
            <input name="code" type="text" placeholder="Código de activación" required className="w-full rounded-[12px] border border-border bg-input px-4 py-3 text-center text-lg font-bold tracking-widest text-foreground outline-none focus:ring-2 focus:ring-primary/20" />
            <input name="name" type="text" placeholder="Tu nombre" required className="w-full rounded-[12px] border border-border bg-input px-4 py-3 text-foreground outline-none focus:ring-2 focus:ring-primary/20" />
            <input name="email" type="email" placeholder="Email" required className="w-full rounded-[12px] border border-border bg-input px-4 py-3 text-foreground outline-none focus:ring-2 focus:ring-primary/20" />
            <input name="password" type="password" placeholder="Contraseña" required minLength={6} className="w-full rounded-[12px] border border-border bg-input px-4 py-3 text-foreground outline-none focus:ring-2 focus:ring-primary/20" />
            <button type="submit" disabled={loading} className="w-full rounded-[12px] bg-primary py-3 font-bold text-white transition-colors hover:bg-primary-hover disabled:opacity-50">
              {loading ? "Activando..." : "Activar cuenta"}
            </button>
          </form>
        )}

        <button onClick={() => { setMode(mode === "login" ? "activate" : "login"); setError(""); }} className="w-full text-center text-sm text-secondary underline">
          {mode === "login" ? "¿Tienes un código? Activa tu cuenta" : "¿Ya tienes cuenta? Inicia sesión"}
        </button>
      </div>
    </main>
  );
}
