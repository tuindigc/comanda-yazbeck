"use server";

import { prisma } from "@/lib/prisma";

export async function getYazbeckMappings(productIds: number[]) {
  return prisma.yazbeckMapping.findMany({ where: { productId: { in: productIds } } });
}

export async function saveYazbeckMapping(data: { productId: number; sheetName: string; estilo: string; yazbeckColor: string }) {
  return prisma.yazbeckMapping.upsert({
    where: { productId: data.productId },
    update: data,
    create: data,
  });
}
