import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/app/actions/authActions";
import { readComandaSheet, fillComanda } from "@/lib/comandaXlsx";
import {
  parseSheetStructure,
  resolveCell,
  getQuantityRanges,
  COMANDA_SHEETS,
  type ComandaStructure,
} from "@/lib/yazbeckComanda";
import fs from "fs/promises";
import path from "path";

const TEMPLATE_PATH = path.join(process.cwd(), "public", "comanda-template.xlsx");

async function getTemplateBuffer(): Promise<Buffer> {
  return fs.readFile(TEMPLATE_PATH);
}

async function parseComandaStructure(buffer: Buffer): Promise<ComandaStructure> {
  const sheets = [];
  for (const sheetName of COMANDA_SHEETS) {
    try {
      const data = await readComandaSheet(buffer, sheetName);
      const parsed = parseSheetStructure(sheetName, data);
      sheets.push(parsed);
    } catch {
      // Sheet not found in template, skip
    }
  }
  return { sheets };
}

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const sessionId = parseInt(request.nextUrl.searchParams.get("sessionId") || "0");
  if (!sessionId) {
    return NextResponse.json({ error: "Falta sessionId" }, { status: 400 });
  }

  // Get session with items and mappings
  const session = await prisma.purchaseSession.findFirst({
    where: { id: sessionId, userId: user.id },
    include: {
      items: {
        include: {
          variant: {
            include: {
              product: {
                include: { yazbeckMapping: true },
              },
              weight: true,
            },
          },
        },
      },
    },
  });

  if (!session) {
    return NextResponse.json({ error: "Sesión no encontrada" }, { status: 404 });
  }

  if (session.items.length === 0) {
    return NextResponse.json({ error: "La sesión no tiene productos" }, { status: 400 });
  }

  // Load template
  let templateBuffer: Buffer;
  try {
    templateBuffer = await getTemplateBuffer();
  } catch {
    return NextResponse.json(
      { error: "Template de comanda no encontrado. Sube comanda-template.xlsx en public/" },
      { status: 501 }
    );
  }

  // Parse structure
  const structure = await parseComandaStructure(templateBuffer);

  // Build a lookup: estilo -> section + sheetName
  const sectionMap = new Map<string, { section: (typeof structure.sheets)[0]["sections"][0]; sheetName: string }>();
  for (const sheet of structure.sheets) {
    for (const section of sheet.sections) {
      sectionMap.set(section.estilo, { section, sheetName: sheet.sheetName });
    }
  }

  // Build cell writes from session items
  const cellWrites: { ref: string; quantity: number; status: "write" | "skip" }[] = [];
  const skipped: string[] = [];

  for (const item of session.items) {
    const mapping = item.variant.product.yazbeckMapping;
    if (!mapping) {
      skipped.push(`${item.variant.product.name} (sin mapeo Yazbeck)`);
      continue;
    }

    const entry = sectionMap.get(mapping.estilo);
    if (!entry) {
      skipped.push(`${mapping.estilo} (estilo no encontrado en template)`);
      continue;
    }

    const resolved = resolveCell(
      entry.section,
      entry.sheetName,
      mapping.yazbeckColor,
      item.variant.size
    );

    if (!resolved) {
      skipped.push(`${mapping.estilo} ${mapping.yazbeckColor} ${item.variant.size} (celda no resuelta)`);
      cellWrites.push({ ref: "", quantity: item.quantity, status: "skip" });
      continue;
    }

    cellWrites.push({ ref: resolved.ref, quantity: item.quantity, status: "write" });
  }

  // Get quantity ranges to clear before writing
  const quantityRanges = getQuantityRanges(structure);

  // Fill comanda
  const filledBuffer = await fillComanda(templateBuffer, quantityRanges, cellWrites);

  // Return filled Excel
  const response = new NextResponse(new Uint8Array(filledBuffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="comanda-${session.name.replace(/[^a-zA-Z0-9-_]/g, "_")}.xlsx"`,
    },
  });

  // If there were skipped items, add a header so the client can show a warning
  if (skipped.length > 0) {
    response.headers.set("X-Skipped-Items", JSON.stringify(skipped));
  }

  return response;
}
