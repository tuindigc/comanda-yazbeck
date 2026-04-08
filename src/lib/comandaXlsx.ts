/**
 * comandaXlsx.ts — ExcelJS Wrapper for XLSX comanda processing
 *
 * Provides functions to read and fill the Yazbeck comanda file.
 * Adapted for browser/serverless: accepts Buffer inputs instead of reading from disk.
 */

import ExcelJS from 'exceljs';

// ===== HELPERS =====

/**
 * Converts Excel column letters to 1-based column number.
 * A=1, B=2, ..., Z=26, AA=27, AB=28, etc.
 */
export function letterToColNumber(letters: string): number {
  let result = 0;
  for (let i = 0; i < letters.length; i++) {
    result = result * 26 + (letters.charCodeAt(i) - 64); // 'A' = 65, so 65 - 64 = 1
  }
  return result;
}

/**
 * Extracts the cell text value, handling null, undefined, formula results, and rich text.
 */
function cellToString(cell: ExcelJS.Cell): string {
  const value = cell.value;

  if (value === null || value === undefined) return '';

  // Formula cell — use the computed result
  if (typeof value === 'object' && 'formula' in value) {
    const formulaValue = value as ExcelJS.CellFormulaValue;
    const result = formulaValue.result;
    if (result === null || result === undefined) return '';
    if (typeof result === 'object' && 'richText' in result) {
      return (result as ExcelJS.CellRichTextValue).richText
        .map(fragment => fragment.text)
        .join('');
    }
    return String(result);
  }

  // Rich text cell — concatenate all fragments
  if (typeof value === 'object' && 'richText' in value) {
    return (value as ExcelJS.CellRichTextValue).richText
      .map(fragment => fragment.text)
      .join('');
  }

  // SharedFormula — use result
  if (typeof value === 'object' && 'sharedFormula' in value) {
    const sharedValue = value as ExcelJS.CellSharedFormulaValue;
    const result = sharedValue.result;
    if (result === null || result === undefined) return '';
    return String(result);
  }

  // Error value
  if (typeof value === 'object' && 'error' in value) {
    return '';
  }

  // Date
  if (value instanceof Date) {
    return value.toISOString();
  }

  return String(value);
}

/**
 * Parses a range reference like "'Playeras'!D10:I39" into its components.
 * Returns { sheetName, startCol, startRow, endCol, endRow } with 1-based indices.
 */
function parseRangeRef(rangeStr: string): {
  sheetName: string;
  startCol: number;
  startRow: number;
  endCol: number;
  endRow: number;
} {
  // Pattern: 'SheetName'!COL_ROW:COL_ROW
  const match = rangeStr.match(/^'([^']+)'!([A-Z]+)(\d+):([A-Z]+)(\d+)$/);
  if (!match) {
    throw new Error(`Invalid range reference: ${rangeStr}`);
  }
  return {
    sheetName: match[1],
    startCol: letterToColNumber(match[2]),
    startRow: parseInt(match[3], 10),
    endCol: letterToColNumber(match[4]),
    endRow: parseInt(match[5], 10),
  };
}

/**
 * Parses a cell reference like "'Playeras'!E10" into its components.
 * Returns { sheetName, col, row } with 1-based indices.
 */
function parseCellRef(ref: string): {
  sheetName: string;
  col: number;
  row: number;
} {
  const match = ref.match(/^'([^']+)'!([A-Z]+)(\d+)$/);
  if (!match) {
    throw new Error(`Invalid cell reference: ${ref}`);
  }
  return {
    sheetName: match[1],
    col: letterToColNumber(match[2]),
    row: parseInt(match[3], 10),
  };
}

/**
 * Checks if a cell contains a formula (SUM, etc.) that should NOT be overwritten.
 */
function isFormulaCell(cell: ExcelJS.Cell): boolean {
  const value = cell.value;
  if (value === null || value === undefined) return false;
  if (typeof value === 'object' && ('formula' in value || 'sharedFormula' in value)) {
    return true;
  }
  return false;
}

// ===== PUBLIC API =====

/**
 * Reads a specific sheet from the comanda as string[][] (0-based indices).
 * Compatible with the existing parser (yazbeckComanda.ts) which expects string[][].
 *
 * Handles:
 * - null/undefined cells -> ''
 * - Formula cells -> uses computed result value
 * - Rich text -> concatenates all fragments
 *
 * @param buffer - The XLSX file contents as a Buffer
 * @param sheetName - Name of the sheet to read
 */
export async function readComandaSheet(buffer: Buffer, sheetName: string): Promise<string[][]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as unknown as ArrayBuffer);

  const worksheet = workbook.getWorksheet(sheetName);
  if (!worksheet) {
    throw new Error(`Sheet "${sheetName}" not found in comanda file.`);
  }

  const result: string[][] = [];

  // ExcelJS rows and columns are 1-based
  const rowCount = worksheet.rowCount;
  const colCount = worksheet.columnCount;

  for (let r = 1; r <= rowCount; r++) {
    const row = worksheet.getRow(r);
    const rowData: string[] = [];

    for (let c = 1; c <= colCount; c++) {
      const cell = row.getCell(c);
      rowData.push(cellToString(cell));
    }

    // Convert to 0-based: row index r-1
    result.push(rowData);
  }

  return result;
}

/**
 * Fills the comanda with quantities and returns the modified file as a Buffer.
 * Does NOT modify the original file.
 *
 * Steps:
 * 1. Loads the template buffer into memory
 * 2. Clears all quantity cells in the specified ranges (but NOT formula cells like SUM)
 * 3. Writes new quantities from cellWrites
 * 4. Returns the modified workbook as a Buffer
 *
 * @param templateBuffer - The template XLSX file contents as a Buffer
 * @param quantityRanges - Range strings like "'Playeras'!D10:I39" to clear
 * @param cellWrites - Cell writes with refs like "'Playeras'!E10", quantity, and status
 * @returns Buffer containing the modified XLSX file
 */
export async function fillComanda(
  templateBuffer: Buffer,
  quantityRanges: string[],
  cellWrites: { ref: string; quantity: number; status: 'write' | 'skip' }[]
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(templateBuffer as unknown as ArrayBuffer);

  // Step 1: Clear quantity cells in all specified ranges (skip formula cells)
  for (const rangeStr of quantityRanges) {
    const range = parseRangeRef(rangeStr);
    const worksheet = workbook.getWorksheet(range.sheetName);
    if (!worksheet) continue;

    for (let r = range.startRow; r <= range.endRow; r++) {
      const row = worksheet.getRow(r);
      for (let c = range.startCol; c <= range.endCol; c++) {
        const cell = row.getCell(c);
        // Do NOT clear formula cells (SUM, etc.)
        if (!isFormulaCell(cell)) {
          cell.value = null;
        }
      }
    }
  }

  // Step 2: Write new quantities
  for (const write of cellWrites) {
    if (write.status === 'skip') continue;

    const { sheetName, col, row } = parseCellRef(write.ref);
    const worksheet = workbook.getWorksheet(sheetName);
    if (!worksheet) continue;

    const wsRow = worksheet.getRow(row);
    const cell = wsRow.getCell(col);
    cell.value = write.quantity;
  }

  // Step 3: Return as Buffer (without saving to disk)
  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}
