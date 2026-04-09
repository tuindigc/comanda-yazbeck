"use server";

import { createServerSupabase } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export async function activateAndSignUp(code: string, email: string, password: string, name: string) {
  if (!code || !email || !password || !name) {
    return { error: "Todos los campos son requeridos" };
  }
  if (password.length < 6) {
    return { error: "La contraseña debe tener al menos 6 caracteres" };
  }

  // Atomic check-and-claim: prevents race condition with concurrent requests
  const claimed = await prisma.activationCode.updateMany({
    where: { code, isUsed: false },
    data: { isUsed: true, usedAt: new Date() },
  });
  if (claimed.count === 0) {
    return { error: "Código de activación inválido o ya utilizado" };
  }

  const supabase = await createServerSupabase();
  const { data, error } = await supabase.auth.signUp({
    email, password,
    options: { data: { name } },
  });

  if (error) {
    // Rollback: un-claim the code if signup fails
    await prisma.activationCode.updateMany({ where: { code }, data: { isUsed: false, usedBy: null, usedAt: null } });
    return { error: error.message };
  }
  if (!data.user) {
    await prisma.activationCode.updateMany({ where: { code }, data: { isUsed: false, usedBy: null, usedAt: null } });
    return { error: "Error al crear cuenta" };
  }

  // Link code to user and create profile
  await prisma.activationCode.updateMany({ where: { code }, data: { usedBy: data.user.id } });

  await prisma.userProfile.create({
    data: { id: data.user.id, email, name, activationCode: code, activatedAt: new Date() },
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
  if (!profile || !profile.isActive) return null;
  return profile;
}
