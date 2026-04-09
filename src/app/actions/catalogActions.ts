"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "./authActions";

export async function getProducts(providerId: number, filters?: {
  search?: string;
  colorIds?: number[];
  materialIds?: number[];
  genderIds?: number[];
  cutIds?: number[];
  sizes?: string[];
}) {
  const where: any = { providerId, type: "CLOTHING" };

  if (filters?.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { color: { name: { contains: filters.search, mode: "insensitive" } } },
      { gender: { name: { contains: filters.search, mode: "insensitive" } } },
    ];
  }
  if (filters?.colorIds?.length) where.colorId = { in: filters.colorIds };
  if (filters?.materialIds?.length) where.materialId = { in: filters.materialIds };
  if (filters?.genderIds?.length) where.genderId = { in: filters.genderIds };
  if (filters?.cutIds?.length) where.cutId = { in: filters.cutIds };

  const products = await prisma.product.findMany({
    where,
    include: {
      material: true, color: true, brand: true, gender: true, cut: true,
      variants: { include: { weight: true }, orderBy: [{ weight: { order: "asc" } }, { size: "asc" }] },
    },
    orderBy: [{ color: { order: "asc" } }, { name: "asc" }],
  });

  if (filters?.sizes?.length) {
    return products.filter((p) => p.variants.some((v) => filters.sizes!.includes(v.size)));
  }
  return products;
}

export async function getFilterOptions(providerId: number) {
  const [materials, colors, genders, cuts, sizeGroups, weights] = await Promise.all([
    prisma.material.findMany({ orderBy: { order: "asc" } }),
    prisma.color.findMany({ orderBy: { order: "asc" } }),
    prisma.gender.findMany({ orderBy: { order: "asc" } }),
    prisma.cut.findMany({ orderBy: { order: "asc" } }),
    prisma.sizeGroup.findMany({ include: { options: { orderBy: { order: "asc" } } }, orderBy: { order: "asc" } }),
    prisma.weight.findMany({ orderBy: { order: "asc" } }),
  ]);
  return { materials, colors, genders, cuts, sizeGroups, weights };
}

export async function getUserPrices() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");
  const prices = await prisma.userPrice.findMany({ where: { userId: user.id } });
  return new Map(prices.map((p) => [p.variantId, p.customPrice]));
}

export async function saveUserPrice(variantId: number, customPrice: number) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");
  await prisma.userPrice.upsert({
    where: { userId_variantId: { userId: user.id, variantId } },
    update: { customPrice },
    create: { userId: user.id, variantId, customPrice },
  });
}
