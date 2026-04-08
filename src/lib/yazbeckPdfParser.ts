/**
 * yazbeckPdfParser.ts
 *
 * Parsea el PDF de "Confirmación de Pedido" que envía Yazbeck.
 *
 * Estructura de la CLAVE Yazbeck (12 chars):
 *   C0200 P 0 415 0 G
 *   ^^^^^ ^ ^ ^^^ ^ ^
 *   |     | | |   | +-- Letra de talla (G/M/C)
 *   |     | | |   +---- Variante talla (0=base, 1=Extra, 2=ExtraExtra)
 *   |     | | +-------- Color code 3 dígitos (= mat[1] + color[2], coincide con yazbeckColor: "(415)")
 *   |     | +---------- Material primer dígito (se ignora, el segundo forma parte del color)
 *   |     +------------- Separador
 *   +------------------- Estilo (coincide con YazbeckMapping.estilo)
 */

// Worker primero — configura el worker de pdfjs-dist antes de usar PDFParse
import 'pdf-parse/worker';
import { PDFParse } from 'pdf-parse';

// ─── Types ───────────────────────────────────────────────────

export type PdfLineItem = {
  clave: string;
  estilo: string;
  colorCode: string;
  size: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  description: string;
};

export type PdfOrderInfo = {
  orderNumber: string;
  date: string;
  totalPieces: number;
  totalAmount: number;
  subtotal: number;
  iva: number;
  items: PdfLineItem[];
};

// ─── CLAVE Decoder ──────────────────────────────────────────

// P + 1 dígito ignorado + 3 dígitos color (mat_último + color_2) + 1 variante + 1 letra
const CLAVE_REGEX = /^([A-Z]\d{4})P\d(\d{3})(\d)([A-Z])$/;

/**
 * Decodifica la CLAVE Yazbeck.
 * Ej: "C0200P04150G" → { estilo: "C0200", colorCode: "415", size: "GRANDE" }
 */
export function decodeClave(clave: string): { estilo: string; colorCode: string; size: string } | null {
  const match = clave.match(CLAVE_REGEX);
  if (!match) return null;

  const [, estilo, colorCode, sizeVariant, sizeLetter] = match;
  const size = resolveSizeFromClave(parseInt(sizeVariant), sizeLetter);

  return { estilo, colorCode, size };
}

/**
 * Resuelve el nombre de talla desde la variante + letra.
 * 0+G=GRANDE, 1+G=EXTRA GRANDE, 2+G=EXTRA EXTRA GRANDE, etc.
 */
function resolveSizeFromClave(variant: number, letter: string): string {
  const baseSize: Record<string, string> = {
    C: 'CHICA',
    M: 'MEDIANA',
    G: 'GRANDE',
  };

  const base = baseSize[letter] || letter;

  if (variant === 0) return base;
  if (variant === 1) return `EXTRA ${base}`;
  if (variant === 2) return `EXTRA EXTRA ${base}`;
  return `${'EXTRA '.repeat(variant)}${base}`;
}

// ─── PDF Parser ─────────────────────────────────────────────

/**
 * Parsea el PDF de Confirmación de Pedido de Yazbeck.
 * Extrae metadata y líneas de producto.
 */
export async function parseProviderPdf(buffer: Buffer): Promise<PdfOrderInfo> {
  // v2 API: crear instancia con { data }, extraer texto, destruir
  const parser = new PDFParse({ data: buffer });
  const result = await parser.getText();
  await parser.destroy();

  const text: string = result.text;
  const lines = text.split('\n').map((l: string) => l.trim()).filter(Boolean);

  // Extraer metadata
  const orderNumber = extractField(lines, /No\s*Pedido\s*:\s*(\d+)/i) || '';
  const date = extractField(lines, /Fecha\s*:\s*([\d/]+)/i) || '';
  const totalPiecesStr = extractField(lines, /TOTAL\s*DE\s*PIEZAS[.\s]*(\d+)/i);
  const totalPieces = totalPiecesStr ? parseInt(totalPiecesStr) : 0;

  // Extraer totales financieros
  const subtotalStr = extractField(lines, /BIENES\s*\n?\s*([\d,.]+)/i) || findAmountAfter(lines, 'BIENES');
  const ivaStr = extractField(lines, /IVA\s*\n?\s*([\d,.]+)/i) || findAmountAfter(lines, 'IVA');
  const totalStr = extractField(lines, /TOTAL\s*\n?\s*([\d,.]+)/i) || findAmountAfter(lines, 'TOTAL');

  const subtotal = parseAmount(subtotalStr);
  const iva = parseAmount(ivaStr);
  const totalAmount = parseAmount(totalStr);

  // Extraer líneas de producto
  const items = extractLineItems(lines);

  return {
    orderNumber,
    date,
    totalPieces,
    totalAmount,
    subtotal,
    iva,
    items,
  };
}

// ─── Line Item Extraction ───────────────────────────────────

/**
 * Extrae las líneas de producto del texto del PDF.
 * Cada producto aparece como una CLAVE Yazbeck (regex match).
 */
function extractLineItems(lines: string[]): PdfLineItem[] {
  const items: PdfLineItem[] = [];

  // Unir todo el texto en un solo bloque para buscar patrones
  const fullText = lines.join('\n');

  // Buscar cada CLAVE Yazbeck en el texto
  // Patrón: fecha + cantidad + PZ + CLAVE
  const linePattern = /(\d{2}\/\d{2}\/\d{4})\s+(\d+)\s+PZ\s+([A-Z]\d{4}P\d{5,7}[A-Z])\s/g;
  let match;

  while ((match = linePattern.exec(fullText)) !== null) {
    const quantity = parseInt(match[2]);
    const clave = match[3];

    // Buscar el contexto alrededor de la CLAVE para extraer descripción y precios
    const clavePos = match.index;
    const contextAfter = fullText.substring(clavePos, clavePos + 300);

    // Extraer descripción (texto entre la CLAVE y los precios)
    const descMatch = contextAfter.match(/[A-Z]\d{4}P\d{5,7}[A-Z]\s+\d{8}\s+([\s\S]*?)(\d+\.\d{2})\s+(\d+\.\d{2})\s+(\d+\.\d{2})\s+(\d+\.\d{2})/);

    let description = '';
    let unitPrice = 0;
    let subtotal = 0;

    if (descMatch) {
      description = descMatch[1].replace(/\s+/g, ' ').trim();
      unitPrice = parseFloat(descMatch[2]);
      // descMatch[3] = importe, descMatch[4] = descuento
      subtotal = parseFloat(descMatch[5]);
    } else {
      // Fallback: buscar precios en la línea
      const priceMatch = contextAfter.match(/(\d+\.\d{2})\s+(\d+\.\d{2})\s+(\d+\.\d{2})\s+(\d+\.\d{2})/);
      if (priceMatch) {
        unitPrice = parseFloat(priceMatch[1]);
        subtotal = parseFloat(priceMatch[4]);
      }
    }

    // Decodificar la CLAVE
    const decoded = decodeClave(clave);
    if (decoded) {
      items.push({
        clave,
        estilo: decoded.estilo,
        colorCode: decoded.colorCode,
        size: decoded.size,
        quantity,
        unitPrice,
        subtotal,
        description: cleanDescription(description),
      });
    }
  }

  return items;
}

// ─── Helpers ────────────────────────────────────────────────

function extractField(lines: string[], pattern: RegExp): string | null {
  const fullText = lines.join('\n');
  const match = fullText.match(pattern);
  return match ? match[1].trim() : null;
}

function findAmountAfter(lines: string[], label: string): string {
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(label)) {
      // Buscar un número en esta línea o la siguiente
      const numMatch = lines[i].match(new RegExp(label + '\\s+([\\d,.]+)'));
      if (numMatch) return numMatch[1];
      if (i + 1 < lines.length) {
        const nextMatch = lines[i + 1].match(/([\d,.]+)/);
        if (nextMatch) return nextMatch[1];
      }
    }
  }
  return '0';
}

function parseAmount(str: string | null): number {
  if (!str) return 0;
  // Quitar comas de miles y parsear
  return parseFloat(str.replace(/,/g, '')) || 0;
}

function cleanDescription(desc: string): string {
  // Quitar código SAT (8 dígitos solos), saltos de línea extra
  return desc
    .replace(/\d{8}/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
