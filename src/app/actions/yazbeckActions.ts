"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "./authActions";

export async function getYazbeckMappings(productIds: number[]) {
  return prisma.yazbeckMapping.findMany({ where: { productId: { in: productIds } } });
}

export async function saveYazbeckMapping(data: { productId: number; sheetName: string; estilo: string; yazbeckColor: string }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") throw new Error("Not authorized");
  return prisma.yazbeckMapping.upsert({
    where: { productId: data.productId },
    update: data,
    create: data,
  });
}
