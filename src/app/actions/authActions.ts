"use server";

import { createServerSupabase } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export async function activateAndSignUp(code: string, email: string, password: string, name: string) {
  const activationCode = await prisma.activationCode.findUnique({ where: { code } });
  if (!activationCode || activationCode.isUsed) {
    return { error: "Código de activación inválido o ya utilizado" };
  }

  const supabase = await createServerSupabase();
  const { data, error } = await supabase.auth.signUp({
    email, password,
    options: { data: { name, role: "USER" } },
  });

  if (error) return { error: error.message };
  if (!data.user) return { error: "Error al crear cuenta" };

  await prisma.userProfile.create({
    data: { id: data.user.id, email, name, activationCode: code, activatedAt: new Date() },
  });

  await prisma.activationCode.update({
    where: { code },
    data: { isUsed: true, usedBy: data.user.id, usedAt: new Date() },
  });

  return { success: true };
}

export async function signIn(email: string, password: string) {
  const supabase = await createServerSupabase();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "Email o contraseña incorrectos" };
  redirect("/proveedores");
}

export async function signOut() {
  const supabase = await createServerSupabase();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function getCurrentUser() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const profile = await prisma.userProfile.findUnique({ where: { id: user.id } });
  return profile;
}
