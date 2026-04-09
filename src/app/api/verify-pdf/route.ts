import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/app/actions/authActions";
import { prisma } from "@/lib/prisma";
import { parseProviderPdf } from "@/lib/yazbeckPdfParser";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const formData = await request.formData();
  const pdf = formData.get("pdf") as File | null;
  const sessionId = formData.get("sessionId") as string | null;

  if (!pdf || !sessionId) {
    return NextResponse.json({ error: "Falta archivo PDF o sessionId" }, { status: 400 });
  }

  // Get session items
  const session = await prisma.purchaseSession.findFirst({
    where: { id: Number(sessionId), userId: user.id },
    include: {
      items: {
        include: {
          variant: {
            include: {
              product: {
                include: { yazbeckMapping: true, color: true, material: true, gender: true, cut: true },
              },
              weight: true,
            },
          },
        },
      },
    },
  });

  if (!session) {
    return NextResponse.json({ error: "Sesion no encontrada" }, { status: 404 });
  }

  // Parse PDF
  const buffer = Buffer.from(await pdf.arrayBuffer());
  const pdfInfo = await parseProviderPdf(buffer);

  // Build expected items map: key = "estilo|colorCode|size" -> quantity
  const expected = new Map<string, { quantity: number; label: string }>();
  for (const item of session.items) {
    const mapping = item.variant.product.yazbeckMapping;
    if (!mapping) continue;

    const key = `${mapping.estilo}|${mapping.yazbeckColor}|${item.variant.size}`;
    const existing = expected.get(key);
    const label = `${item.variant.product.color?.name || ""} ${item.variant.size} ${item.variant.weight?.name || ""}`.trim();
    if (existing) {
      existing.quantity += item.quantity;
    } else {
      expected.set(key, { quantity: item.quantity, label });
    }
  }

  // Build actual items map from PDF
  const actual = new Map<string, { quantity: number; label: string }>();
  for (const pdfItem of pdfInfo.items) {
    const key = `${pdfItem.estilo}|${pdfItem.colorCode}|${pdfItem.size}`;
    const existing = actual.get(key);
    if (existing) {
      existing.quantity += pdfItem.quantity;
    } else {
      actual.set(key, { quantity: pdfItem.quantity, label: `${pdfItem.description || pdfItem.clave} ${pdfItem.size}` });
    }
  }

  // Compare
  const differences: { type: string; description: string }[] = [];
  let matches = 0;

  for (const [key, exp] of expected) {
    const act = actual.get(key);
    if (!act) {
      differences.push({ type: "missing", description: `Falta: pediste ${exp.quantity} pzs de ${exp.label}, no aparece en PDF` });
    } else if (act.quantity !== exp.quantity) {
      differences.push({ type: "quantity_mismatch", description: `Cantidad: pediste ${exp.quantity}, PDF dice ${act.quantity} de ${exp.label}` });
    } else {
      matches++;
    }
  }

  for (const [key, act] of actual) {
    if (!expected.has(key)) {
      differences.push({ type: "extra", description: `Extra: ${act.quantity} pzs en PDF de ${act.label}, no en tu pedido` });
    }
  }

  // Save verification result
  const result = await prisma.verificationResult.create({
    data: {
      sessionId: session.id,
      pdfFileName: pdf.name,
      totalMatches: matches,
      totalDifferences: differences.length,
      details: differences,
    },
  });

  return NextResponse.json({
    id: result.id,
    matches,
    differences,
    pdfInfo: {
      orderNumber: pdfInfo.orderNumber,
      date: pdfInfo.date,
      totalPieces: pdfInfo.totalPieces,
      totalAmount: pdfInfo.totalAmount,
    },
  });
}
