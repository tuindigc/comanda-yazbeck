"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "./authActions";
import { revalidatePath } from "next/cache";

export async function createSession(name: string, items: { variantId: number; quantity: number; unitCost: number }[]) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");
  const session = await prisma.purchaseSession.create({
    data: {
      name, userId: user.id,
      items: { create: items.map((item) => ({ variantId: item.variantId, quantity: item.quantity, unitCost: item.unitCost })) },
    },
  });
  revalidatePath("/pedido");
  return session;
}

export async function getSessions() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");
  return prisma.purchaseSession.findMany({
    where: { userId: user.id },
    include: { items: { include: { variant: { include: { product: { include: { color: true, material: true, gender: true, cut: true } }, weight: true } } } }, _count: { select: { items: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function getSession(id: number) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");
  return prisma.purchaseSession.findFirst({
    where: { id, userId: user.id },
    include: { items: { include: { variant: { include: { product: { include: { color: true, material: true, gender: true, cut: true, brand: true } }, weight: true } } } }, verificationResults: { orderBy: { createdAt: "desc" } } },
  });
}

export async function confirmSession(id: number) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");
  await prisma.purchaseSession.update({ where: { id }, data: { status: "CONFIRMADO", confirmedAt: new Date() } });
  revalidatePath("/pedido");
}

export async function markReceived(id: number) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");
  await prisma.purchaseSession.update({ where: { id }, data: { status: "RECIBIDO", receivedAt: new Date() } });
  revalidatePath("/pedido");
  revalidatePath("/bitacora");
}

export async function deleteSession(id: number) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");
  await prisma.purchaseSession.delete({ where: { id } });
  revalidatePath("/pedido");
}
