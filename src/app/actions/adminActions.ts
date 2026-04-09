"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "./authActions";
import { revalidatePath } from "next/cache";
import crypto from "crypto";

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") throw new Error("Not authorized");
  return user;
}

export async function generateCodes(count: number) {
  await requireAdmin();
  const safeCount = Math.min(Math.max(1, Math.floor(count)), 50);
  const codes = Array.from({ length: safeCount }, () => crypto.randomBytes(4).toString("hex").toUpperCase());
  await prisma.activationCode.createMany({ data: codes.map((code) => ({ code })) });
  revalidatePath("/admin/codigos");
  return codes;
}

export async function getCodes() {
  await requireAdmin();
  return prisma.activationCode.findMany({ orderBy: { createdAt: "desc" } });
}

export async function getUsers() {
  await requireAdmin();
  return prisma.userProfile.findMany({ orderBy: { createdAt: "desc" } });
}

export async function toggleUserActive(userId: string, isActive: boolean) {
  await requireAdmin();
  await prisma.userProfile.update({ where: { id: userId }, data: { isActive } });
  revalidatePath("/admin/usuarios");
}

export async function getAdminStats() {
  await requireAdmin();
  const [totalUsers, activeUsers, totalCodes, usedCodes, totalProducts] = await Promise.all([
    prisma.userProfile.count(),
    prisma.userProfile.count({ where: { isActive: true } }),
    prisma.activationCode.count(),
    prisma.activationCode.count({ where: { isUsed: true } }),
    prisma.product.count(),
  ]);
  return { totalUsers, activeUsers, totalCodes, usedCodes, totalProducts };
}

export async function createProduct(data: {
  name: string; providerId: number; materialId?: number; colorId?: number; brandId?: number; genderId?: number; cutId?: number; imageUrl?: string; catalogCode?: string;
  variants: { size: string; weightId?: number; basePrice: number }[];
}) {
  await requireAdmin();
  const product = await prisma.product.create({
    data: {
      name: data.name, providerId: data.providerId, materialId: data.materialId, colorId: data.colorId, brandId: data.brandId, genderId: data.genderId, cutId: data.cutId, imageUrl: data.imageUrl, catalogCode: data.catalogCode,
      variants: { create: data.variants.map((v) => ({ size: v.size, weightId: v.weightId, basePrice: v.basePrice })) },
    },
  });
  revalidatePath("/admin/catalogo");
  return product;
}

export async function deleteProduct(id: number) {
  await requireAdmin();
  await prisma.product.delete({ where: { id } });
  revalidatePath("/admin/catalogo");
}

export async function upsertCatalogItem(type: "material" | "color" | "brand" | "gender" | "cut" | "weight", data: { id?: number; name: string; hex?: string; iconUrl?: string; imageUrl?: string; order?: number }) {
  await requireAdmin();
  const model = { material: prisma.material, color: prisma.color, brand: prisma.brand, gender: prisma.gender, cut: prisma.cut, weight: prisma.weight }[type] as any;
  if (data.id) return model.update({ where: { id: data.id }, data });
  return model.create({ data });
}
