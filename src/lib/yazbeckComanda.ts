/**
 * Parser de estructura de la Comanda Yazbeck
 *
 * Cada hoja (Playeras, Polo, Sudaderas, etc.) tiene secciones con patrón fijo:
 *   - Fila de label: "C  A  B  A  L  L  E  R  O" / "D  A  M  A" / etc.
 *   - Fila de header: ESTILO | COLOR | tallas... | TOTAL
 *   - Filas de datos: código estilo (solo primera fila) | color | cantidades por talla
 *   - Fila "Suma:" marca fin de sección
 *
 * Las secciones se organizan en dos columnas:
 *   - Izquierda: cols B-I (indices 1-9 aprox)
 *   - Derecha: cols M-T (indices 12-19 aprox)
 */

// ===== TIPOS =====

export type TallaInfo = {
  name: string;    // "CH", "M", "G", "EG", "EEG", "EEEG", "28", "30", etc.
  colIndex: number; // Índice de columna en la hoja (0-based)
};

export type ColorInfo = {
  code: string;     // "(100) Blanco", "(413) Rojo", etc.
  rowIndex: number;  // Índice de fila en la hoja (0-based)
};

export type ProductMeta = {
  tipo: string;       // "Playera", "Polo", "Sudadera", "Camisa", "Pantalón"
  corte: string;      // "Cuello Redondo", "Con Capucha", "Oxford", "Mezclilla", etc.
  material: string;   // "100% Algodón", "50% Alg. - 50% Pol.", etc.
  linea: string;      // "Heavy Weight", "Poly-Cotton Fleece", "ActiviTee", etc.
  manga: string;      // "Manga Corta", "Manga Larga", ""
  genero: string;     // "Caballero", "Dama", "Jóvenes", "Niños", "Bebés", "Unisex Adulto"
};

export type SheetSection = {
  estilo: string;         // "C0300", "D0300", "J0300", "N0300", "B0300"
  sectionLabel: string;   // "CABALLERO", "DAMA", "JÓVENES", "NIÑOS", "BEBÉS", etc.
  productDescription: string; // Descripción raw (ej: "Playera Cuello Redondo Manga Corta 100% Algodón...")
  meta: ProductMeta;      // Metadata estructurada extraída de la descripción
  displayLabel: string;   // Label rico para dropdowns (ej: "C0300 · Playera Cuello Redondo · Algodón Heavy Weight · Caballero")
  tallas: TallaInfo[];
  colors: ColorInfo[];
  side: 'left' | 'right'; // En qué lado de la hoja está la sección
};

export type ParsedSheet = {
  sheetName: string;
  sections: SheetSection[];
};

export type ComandaStructure = {
  sheets: ParsedSheet[];
  groups?: ModelGroup[];
};

// ===== HOJAS A PARSEAR =====

export const COMANDA_SHEETS = [
  'Playeras',
  'Payeras tipo Polo',
  'Sudaderas',
];

// ===== ALIASES DE TALLAS =====
// Mapeo de tallas de la app del usuario → tallas de la comanda Yazbeck

export const TALLA_ALIASES: Record<string, string[]> = {
  // Ropa adulto
  'ECH': ['ECH', 'XS', 'EXTRA CHICA'],
  'CH': ['CH', 'CHICA', 'S', 'CH (4A)'],
  'M': ['M', 'MEDIANA', 'M(6-8A)'],
  'G': ['G', 'GRANDE', 'L', 'G(10-12A)'],
  'EG': ['EG', 'XG', 'EXTRA GRANDE', 'XL', 'EG (14A)'],
  'EEG': ['EEG', 'XXG', '2XL', 'DOBLE EXTRA GRANDE'],
  'EEEG': ['EEEG', '3XL', 'XXXL'],
  // Bebés
  '1': ['1'],
  '2': ['2'],
  '3': ['3'],
  // Pantalones caballero
  '28': ['28'],
  '30': ['30'],
  '32': ['32'],
  '34': ['34'],
  '36': ['36'],
  '38': ['38'],
  '40': ['40'],
  // Pantalones dama
  '5': ['5'],
  '7': ['7'],
  '9': ['9'],
  '11': ['11'],
  '13': ['13'],
  '15': ['15'],
  '17': ['17'],
};

/**
 * Busca el nombre de talla de la comanda que corresponde a una talla del inventario
 */
export function matchTalla(inventorySize: string, sheetTallas: TallaInfo[]): TallaInfo | null {
  const normalized = inventorySize.trim().toUpperCase();

  // Intento 1: Match exacto
  for (const talla of sheetTallas) {
    if (talla.name.trim().toUpperCase() === normalized) {
      return talla;
    }
  }

  // Intento 2: Match por aliases
  for (const [canonical, aliases] of Object.entries(TALLA_ALIASES)) {
    if (aliases.some(a => a.toUpperCase() === normalized) || canonical.toUpperCase() === normalized) {
      // Encontramos el alias, ahora buscamos la talla en la hoja
      for (const talla of sheetTallas) {
        const tallaClean = talla.name.trim().toUpperCase();
        if (tallaClean === canonical.toUpperCase() || aliases.some(a => a.toUpperCase() === tallaClean)) {
          return talla;
        }
      }
    }
  }

  return null;
}

// ===== EXTRACTOR DE METADATA =====

/**
 * Extrae metadata estructurada de la descripción del producto en la comanda.
 * Ej: "Playera Cuello Redondo Manga Corta 100% Algodón \"Heavy Weight\""
 *   → { tipo: "Playera", corte: "Cuello Redondo", material: "100% Algodón", linea: "Heavy Weight", manga: "Manga Corta" }
 */
function extractProductMeta(description: string, sectionLabel: string): ProductMeta {
  const desc = description.replace(/\t/g, ' ').trim();

  // Extraer línea/nombre comercial (entre comillas)
  const lineaMatch = desc.match(/[""]([^""]+)[""]/) || desc.match(/"([^"]+)"/);
  const linea = lineaMatch ? lineaMatch[1] : '';

  // Extraer material (patrón de porcentajes — más robusto)
  // Soporta: "100% Algodón", "50% Algodón - 50% Poliéster", "75% Algodón 25% Poliéster", "100 % Poliéster"
  const materialMatch = desc.match(/(\d+\s*%\s*[A-Za-zÀ-ÿ.]+(?:(?:\s*[-–]\s*|\s+)\d+\s*%\s*[A-Za-zÀ-ÿ.]+)*)/i);
  const material = materialMatch ? materialMatch[1].trim() : '';

  // Extraer manga
  const manga = /manga\s+larga/i.test(desc) ? 'Manga Larga' :
                /manga\s+corta/i.test(desc) ? 'Manga Corta' :
                /sin\s+mangas/i.test(desc) ? 'Sin Mangas' : '';

  // Extraer tipo de prenda
  let tipo = 'Prenda';
  if (/playera\s+tipo\s+polo|polo/i.test(desc)) tipo = 'Polo';
  else if (/playera/i.test(desc)) tipo = 'Playera';
  else if (/sudadera/i.test(desc)) tipo = 'Sudadera';
  else if (/camisa/i.test(desc)) tipo = 'Camisa';
  else if (/pantalón|pantalon/i.test(desc)) tipo = 'Pantalón';

  // Extraer corte/estilo de la prenda
  let corte = '';
  if (tipo === 'Playera') {
    if (/cuello\s*[""\u201C\u201D]?\s*v\s*[""\u201C\u201D]?/i.test(desc)) corte = 'Cuello V';
    else corte = 'Cuello Redondo';
  } else if (tipo === 'Polo') {
    if (/piqué|pique/i.test(desc)) corte = 'Piqué';
    else if (/chifón|chifon/i.test(desc)) corte = 'Chifón';
    else if (/100\s*%?\s*poli/i.test(desc)) corte = 'Deportivo';
    else corte = '';
  } else if (tipo === 'Sudadera') {
    if (/1\/4\s*de?\s*cierre/i.test(desc)) corte = '1/4 de Cierre';
    else if (/capucha.*cangurera.*cierre/i.test(desc)) corte = 'Capucha + Cierre';
    else if (/capucha.*cangurera/i.test(desc) || /capucha\s*y\s*cangurera/i.test(sectionLabel)) corte = 'Capucha + Cangurera';
    else if (/cuello\s+redondo/i.test(desc) || /cuello\s+redondo/i.test(sectionLabel)) corte = 'Cuello Redondo';
    else corte = 'Sudadera';
  } else if (tipo === 'Camisa') {
    if (/oxford/i.test(desc)) corte = 'Oxford';
    else if (/gabardina/i.test(desc)) corte = 'Gabardina';
    else if (/mezclilla/i.test(desc)) corte = 'Mezclilla';
    else corte = 'Camisa';
  } else if (tipo === 'Pantalón') {
    if (/mezclilla/i.test(desc)) corte = 'Mezclilla';
    else if (/gabardina/i.test(desc)) corte = 'Gabardina';
    else corte = 'Pantalón';
  }

  // Extraer género del sectionLabel
  // Normalizar: quitar acentos para comparación más robusta
  const labelNorm = sectionLabel.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
  let genero = 'Desconocido';
  if (/CABALLERO/.test(labelNorm) || /ADULTO/.test(labelNorm) || /UNISEX.*ADULTO/.test(labelNorm)) genero = 'Caballero';
  else if (/DAMA/.test(labelNorm)) genero = 'Dama';
  else if (/JOVENES|JOVEN/.test(labelNorm)) genero = 'Jóvenes';
  else if (/NINO|NIÑO/.test(labelNorm)) genero = 'Niños';
  else if (/BEBE/.test(labelNorm)) genero = 'Bebés';
  // También detectar por el prefijo del estilo como fallback
  if (genero === 'Desconocido') {
    // Se resolverá después en parseSection con el código de estilo
  }

  return { tipo, corte, material, linea, manga, genero };
}

/**
 * Genera un label descriptivo para dropdowns
 */
function buildDisplayLabel(estilo: string, meta: ProductMeta): string {
  const parts = [estilo];

  // Tipo + Corte
  if (meta.tipo === 'Playera') {
    parts.push(meta.corte || 'Playera');
  } else {
    parts.push(`${meta.tipo} ${meta.corte}`.trim());
  }

  // Material abreviado + Línea
  const matNorm = meta.material.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const matParts = [];
  if (meta.material) {
    if (/100\s*%\s*algodon/i.test(matNorm)) matParts.push('Algodón');
    else if (/100\s*%\s*poliester/i.test(matNorm)) matParts.push('Poliéster');
    else if (/algodon.*poliester|poliester.*algodon/i.test(matNorm)) matParts.push('Alg/Pol');
    else matParts.push(meta.material);
  }
  if (meta.linea) matParts.push(`"${meta.linea}"`);
  if (matParts.length > 0) parts.push(matParts.join(' '));

  // Manga (si aplica: Playeras, Polos, Camisas — diferencia MC vs ML)
  if (meta.manga) {
    parts.push(meta.manga);
  }

  // Género
  parts.push(meta.genero);

  return parts.join(' · ');
}

// ===== PARSER =====

/**
 * Parsea una hoja completa de la comanda y extrae todas sus secciones
 * @param sheetName Nombre de la hoja
 * @param data Datos crudos de la hoja (string[][])
 */
export function parseSheetStructure(sheetName: string, data: string[][]): ParsedSheet {
  const sections: SheetSection[] = [];
  let lastProductDescription = '';

  for (let rowIdx = 0; rowIdx < data.length; rowIdx++) {
    const row = data[rowIdx] || [];

    // Detectar descripción de producto (fila con material/línea: contiene "%" o comillas)
    // Esto filtra sublabels como "Sudadera Cuello Redondo Unisex Para Adulto" que NO tienen material
    if (row[1] && row[1].length > 20 && !row[1].includes('ESTILO') && !isSpacedLabel(row[1])
        && (/[%]/.test(row[1]) || /[""\u201C\u201D]/.test(row[1]))) {
      lastProductDescription = row[1].replace(/\t/g, ' ').replace(/\s{2,}/g, ' ').trim();
    }

    // Buscar headers de sección IZQUIERDA (col B = index 1 contiene "ESTILO")
    if (row[1]?.trim().toUpperCase() === 'ESTILO') {
      const section = parseSection(data, rowIdx, 1, 'left', lastProductDescription);
      if (section) sections.push(section);
    }

    // Buscar headers de sección DERECHA (col M = index 12 contiene "ESTILO")
    if (row[12]?.trim().toUpperCase() === 'ESTILO') {
      const section = parseSection(data, rowIdx, 12, 'right', lastProductDescription);
      if (section) sections.push(section);
    }
  }

  return { sheetName, sections };
}

/**
 * Detecta si un texto es un label con espacios (ej: "C  A  B  A  L  L  E  R  O")
 * NO debe confundirse con descripciones de producto que pueden tener doble espacio accidental
 */
function isSpacedLabel(text: string): boolean {
  if (!text || text.length > 50) return false;
  // Descripciones de producto contienen números, %, comillas → no son labels
  if (/\d/.test(text)) return false;
  if (/["%""]/.test(text)) return false;
  // Labels espaciados son solo letras con espacios múltiples
  return /\s{2,}/.test(text);
}

/**
 * Extrae el label de sección de la fila anterior al header
 * Busca en la fila anterior al header, en la columna correcta según el lado
 */
function getSectionLabel(data: string[][], headerRowIdx: number, startCol: number): string {
  // Buscar en la fila anterior
  if (headerRowIdx > 0) {
    const prevRow = data[headerRowIdx - 1] || [];
    const labelCell = prevRow[startCol]?.trim() || '';
    if (labelCell) {
      // Detectar labels espaciados: "C  A  B  A  L  L  E  R  O" o "D A M A"
      // Si cada "palabra" es de 1-2 letras → es un label espaciado, colapsar todo
      const words = labelCell.trim().split(/\s+/);
      if (words.length > 2 && words.every(w => w.length <= 2)) {
        return words.join('');
      }
      // Si no es un label espaciado, limpiar solo espacios múltiples
      return labelCell.replace(/\s{2,}/g, ' ').trim();
    }
  }

  // Buscar 2 filas antes (a veces hay una fila de separación)
  if (headerRowIdx > 1) {
    const prev2Row = data[headerRowIdx - 2] || [];
    const labelCell = prev2Row[startCol]?.trim() || '';
    if (labelCell) {
      const words = labelCell.trim().split(/\s+/);
      if (words.length > 2 && words.every(w => w.length <= 2)) {
        return words.join('');
      }
      return labelCell.replace(/\s{2,}/g, ' ').trim();
    }
  }

  return 'DESCONOCIDO';
}

/**
 * Parsea una sección individual (izquierda o derecha) a partir de su fila de header
 */
function parseSection(
  data: string[][],
  headerRowIdx: number,
  startCol: number,
  side: 'left' | 'right',
  productDescription: string
): SheetSection | null {
  const headerRow = data[headerRowIdx] || [];

  // Encontrar las columnas de tallas
  // Patrón: ESTILO | COLOR | [posiblemente vacío] | talla1 | talla2 | ... | TOTAL
  const tallas: TallaInfo[] = [];
  const colorColIdx = startCol + 1; // COLOR siempre está después de ESTILO

  // Escanear columnas después de COLOR hasta encontrar TOTAL o vacío largo
  for (let col = startCol + 2; col < headerRow.length && col < startCol + 15; col++) {
    const cell = (headerRow[col] || '').trim();
    if (cell.toUpperCase() === 'TOTAL') break;
    if (cell && cell.toUpperCase() !== 'ESTILO' && cell.toUpperCase() !== 'COLOR') {
      tallas.push({ name: cell.replace(/\s+/g, ' ').trim(), colIndex: col });
    }
  }

  if (tallas.length === 0) return null;

  // Obtener label de sección
  const sectionLabel = getSectionLabel(data, headerRowIdx, startCol);

  // Escanear filas de datos (colores)
  const colors: ColorInfo[] = [];
  let estilo = '';

  for (let rowIdx = headerRowIdx + 1; rowIdx < data.length; rowIdx++) {
    const row = data[rowIdx] || [];
    const estiloCell = (row[startCol] || '').trim();
    const colorCell = (row[colorColIdx] || '').trim();

    // Si encontramos "Suma:" o "SUMA:" en la celda de color, fin de sección
    if (colorCell.toUpperCase().startsWith('SUMA')) break;

    // Si la celda de color está vacía y no hay estilo, fin de sección
    if (!colorCell && !estiloCell) break;

    // Si el color parece un código de color válido (empieza con "(")
    if (colorCell && colorCell.startsWith('(')) {
      colors.push({ code: colorCell, rowIndex: rowIdx });
    }

    // Capturar el código de estilo (solo aparece en la primera fila)
    if (estiloCell && estiloCell !== '' && !estilo) {
      estilo = estiloCell;
    }
  }

  if (!estilo || colors.length === 0) return null;

  const meta = extractProductMeta(productDescription, sectionLabel);

  // Fallback: si no se detectó el género, usar el prefijo del estilo
  if (meta.genero === 'Desconocido') {
    const prefix = estilo.charAt(0).toUpperCase();
    const prefixMap: Record<string, string> = {
      'C': 'Caballero', 'D': 'Dama', 'J': 'Jóvenes', 'N': 'Niños', 'B': 'Bebés',
    };
    meta.genero = prefixMap[prefix] || 'Desconocido';
  }

  const displayLabel = buildDisplayLabel(estilo, meta);

  return {
    estilo,
    sectionLabel,
    productDescription,
    meta,
    displayLabel,
    tallas,
    colors,
    side,
  };
}

// ===== UTILIDADES =====

/**
 * Convierte un índice de columna (0-based) a letra de columna (A, B, C, ..., Z, AA, AB...)
 */
export function colIndexToLetter(index: number): string {
  let result = '';
  let n = index;
  while (n >= 0) {
    result = String.fromCharCode((n % 26) + 65) + result;
    n = Math.floor(n / 26) - 1;
  }
  return result;
}

/**
 * Genera la referencia de celda en notación A1
 * @param sheetName Nombre de la hoja
 * @param rowIndex Índice de fila (0-based, se convierte a 1-based)
 * @param colIndex Índice de columna (0-based)
 */
export function cellRef(sheetName: string, rowIndex: number, colIndex: number): string {
  return `'${sheetName}'!${colIndexToLetter(colIndex)}${rowIndex + 1}`;
}

/**
 * Dado un mapeo de producto y una talla, resuelve la celda exacta en la comanda
 */
export function resolveCell(
  section: SheetSection,
  sheetName: string,
  yazbeckColor: string,
  inventorySize: string
): { ref: string; rowIndex: number; colIndex: number } | null {
  // Encontrar la fila del color
  const colorInfo = section.colors.find(
    c => c.code.trim().toUpperCase() === yazbeckColor.trim().toUpperCase()
  );
  if (!colorInfo) return null;

  // Encontrar la columna de la talla
  const tallaInfo = matchTalla(inventorySize, section.tallas);
  if (!tallaInfo) return null;

  return {
    ref: cellRef(sheetName, colorInfo.rowIndex, tallaInfo.colIndex),
    rowIndex: colorInfo.rowIndex,
    colIndex: tallaInfo.colIndex,
  };
}

/**
 * Calcula los rangos rectangulares que cubren TODAS las celdas de cantidad
 * de cada sección de la comanda. Se usa para limpiar la comanda antes de escribir.
 */
export function getQuantityRanges(structure: ComandaStructure): string[] {
  const ranges: string[] = [];
  for (const sheet of structure.sheets) {
    for (const section of sheet.sections) {
      if (section.tallas.length === 0 || section.colors.length === 0) continue;
      const firstCol = section.tallas[0].colIndex;
      const lastCol = section.tallas[section.tallas.length - 1].colIndex;
      const firstRow = section.colors[0].rowIndex;
      const lastRow = section.colors[section.colors.length - 1].rowIndex;
      const range = `'${sheet.sheetName}'!${colIndexToLetter(firstCol)}${firstRow + 1}:${colIndexToLetter(lastCol)}${lastRow + 1}`;
      ranges.push(range);
    }
  }
  return ranges;
}

// ===== AGRUPACIÓN PARA DROPDOWNS =====

export type ModelGroup = {
  groupLabel: string;  // Ej: "Playera Cuello Redondo · Algodón \"Heavy Weight\""
  items: {
    estilo: string;
    sheetName: string;
    shortLabel: string;  // Ej: "Caballero · Manga Corta"
    fullLabel: string;   // Ej: "C0300 — Caballero · MC"
    meta: ProductMeta;
  }[];
};

/**
 * Agrupa las secciones de la comanda por tipo de producto para dropdowns más legibles.
 * Cada grupo comparte: corte + material + línea.
 * Dentro del grupo, los items varían por: género + manga.
 */
export function groupSectionsForDropdown(structure: ComandaStructure): ModelGroup[] {
  const groupMap = new Map<string, ModelGroup>();

  for (const sheet of structure.sheets) {
    for (const section of sheet.sections) {
      const m = section.meta;
      // Clave de grupo: tipo + corte + material + linea
      const groupKey = `${m.tipo}|${m.corte}|${m.material}|${m.linea}`;

      if (!groupMap.has(groupKey)) {
        // Construir label del grupo
        const parts: string[] = [];

        // Tipo + Corte
        if (m.tipo === 'Playera') {
          parts.push(`Playera ${m.corte}`);
        } else {
          parts.push(`${m.tipo} ${m.corte}`.trim());
        }

        // Material abreviado
        const matNorm = m.material.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
        if (/100\s*%\s*algodon/i.test(matNorm)) parts.push('Algodón');
        else if (/100\s*%\s*poliester/i.test(matNorm)) parts.push('Poliéster');
        else if (/algodon.*poliester|poliester.*algodon/i.test(matNorm)) parts.push('Alg/Pol');
        else if (m.material) parts.push(m.material);

        // Línea comercial
        if (m.linea) parts.push(`"${m.linea}"`);

        groupMap.set(groupKey, {
          groupLabel: parts.join(' · '),
          items: [],
        });
      }

      const group = groupMap.get(groupKey)!;

      // Label corto: género + manga
      const shortParts: string[] = [m.genero];
      if (m.manga) shortParts.push(m.manga === 'Manga Corta' ? 'MC' : m.manga === 'Manga Larga' ? 'ML' : m.manga);

      group.items.push({
        estilo: section.estilo,
        sheetName: sheet.sheetName,
        shortLabel: shortParts.join(' · '),
        fullLabel: `${section.estilo} — ${shortParts.join(' · ')}`,
        meta: m,
      });
    }
  }

  // Ordenar grupos y items dentro de cada grupo
  const groups = Array.from(groupMap.values());
  // Ordenar items por género (C, D, J, N, B)
  const generoOrder: Record<string, number> = {
    'Caballero': 0, 'Dama': 1, 'Jóvenes': 2, 'Niños': 3, 'Bebés': 4, 'Desconocido': 5,
  };
  for (const g of groups) {
    g.items.sort((a, b) => {
      const ga = generoOrder[a.meta.genero] ?? 5;
      const gb = generoOrder[b.meta.genero] ?? 5;
      if (ga !== gb) return ga - gb;
      // Mismo género: MC antes que ML
      return (a.meta.manga || '').localeCompare(b.meta.manga || '');
    });
  }

  return groups;
}

// ===== SUGERENCIAS AUTOMÁTICAS =====

export type ProductAttributes = {
  materialName?: string;   // "Algodón", "Poliéster", "Poly-Cotton"
  colorName?: string;      // "Blanco", "Negro", "Rojo"
  genderName?: string;     // "Caballero", "Dama", "Niño", "Joven", "Bebé"
  cutName?: string;        // "Cuello Redondo", "Cuello V", "Polo", "Sudadera"
  catalogCode?: string;    // "C0300" — match directo si existe
  weightName?: string;     // "190g", "Heavy Weight", etc.
};

export type SuggestionMatch = {
  estilo: string;
  sheetName: string;
  score: number;
  reasons: string[];          // Razones del match para mostrar al usuario
  suggestedColor?: string;    // Mejor color matching en la sección
  displayLabel: string;       // Label completo de la sección
};

/**
 * Compara un producto del inventario con todas las secciones de la comanda
 * y retorna las mejores 2 sugerencias ordenadas por puntaje.
 */
export function suggestMatches(
  product: ProductAttributes,
  structure: ComandaStructure,
  topN = 2
): SuggestionMatch[] {
  const scored: SuggestionMatch[] = [];

  for (const sheet of structure.sheets) {
    for (const section of sheet.sections) {
      const { score, reasons } = scoreMatch(product, section, sheet.sheetName);

      // Buscar mejor color coincidente
      let suggestedColor: string | undefined;
      if (product.colorName) {
        suggestedColor = findBestColorMatch(product.colorName, section.colors);
      }

      scored.push({
        estilo: section.estilo,
        sheetName: sheet.sheetName,
        score,
        reasons,
        suggestedColor,
        displayLabel: section.displayLabel,
      });
    }
  }

  // Ordenar por puntaje descendente y tomar top N
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topN).filter(s => s.score > 0);
}

// Aliases de línea/material del proveedor — nombres que significan lo mismo
const LINE_ALIASES: Record<string, string[]> = {
  'activitee': ['activitee', 'dri-fit', 'drifit', 'dri fit', 'dry fit', 'dryfit'],
  'sublitee': ['sublitee', 'sublimacion', 'sublimation'],
  'heavy weight': ['heavy weight', 'heavyweight', 'heavy'],
  'mid weight': ['mid weight', 'midweight', 'mid'],
  'poly-cotton': ['poly-cotton', 'polycotton', 'poly cotton'],
};

// Mapeo peso del inventario → línea comercial en la comanda
const WEIGHT_LINE_MAP: Record<string, { matches: string[]; label: string }> = {
  '300': { matches: ['heavy weight', 'heavyweight', 'heavy'], label: 'Pesado (Heavy Weight)' },
  '200': { matches: ['mid weight', 'midweight', 'mid'], label: 'Medio (Mid Weight)' },
  'SP':  { matches: ['activitee', 'sublitee', 'poly-cotton', 'polycotton'], label: 'Sin Peso (Deportivo)' },
};

/** Verifica si dos nombres de línea son equivalentes */
function isLineAlias(a: string, b: string): boolean {
  const aNorm = a.toLowerCase().trim();
  const bNorm = b.toLowerCase().trim();
  if (aNorm === bNorm) return true;
  for (const aliases of Object.values(LINE_ALIASES)) {
    if (aliases.some(x => aNorm.includes(x)) && aliases.some(x => bNorm.includes(x))) {
      return true;
    }
  }
  return false;
}

/**
 * Puntúa qué tan bien coincide un producto con una sección de la comanda.
 *
 * Prioridades de puntaje:
 *   1. Código catálogo (match directo)       → +50
 *   2. Corte (clave para diferenciar)         → +22 match / −15 mismatch en mismo tipo
 *   3. Género                                 → +20 match
 *   4. Material                               → +15 match
 *   5. Línea / Peso (ActiviTee = Dri-Fit)    → +10
 *   6. Tipo de prenda (hoja)                  → +5
 */
function scoreMatch(
  product: ProductAttributes,
  section: SheetSection,
  sheetName: string
): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];
  const meta = section.meta;

  // Normalizar para comparación sin acentos
  const norm = (s?: string) =>
    (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

  // 1. CÓDIGO CATÁLOGO — match directo (máxima prioridad)
  if (product.catalogCode) {
    const catNorm = norm(product.catalogCode);
    const estiloNorm = norm(section.estilo);
    if (catNorm === estiloNorm) {
      score += 50;
      reasons.push(`Código ${section.estilo} coincide`);
    }
  }

  // 2. CORTE — clave para diferenciar modelos (máxima prioridad después de código)
  if (product.cutName) {
    const cutNorm = norm(product.cutName);
    const metaCorteNorm = norm(meta.corte);
    const metaTipoNorm = norm(meta.tipo);
    let corteMatched = false;

    // Match directo de corte
    if (cutNorm === metaCorteNorm) {
      score += 22;
      reasons.push(`Corte: ${meta.corte}`);
      corteMatched = true;
    }
    // "Polo" como corte → debe ser tipo Polo en la comanda
    else if (cutNorm.includes('polo') && metaTipoNorm === 'polo') {
      score += 22;
      reasons.push(`Tipo: Polo`);
      corteMatched = true;
    }
    // "Cuello V" match
    else if (cutNorm.includes('cuello v') && metaCorteNorm.includes('cuello v')) {
      score += 22;
      reasons.push(`Corte: Cuello V`);
      corteMatched = true;
    }
    // "Cuello Redondo" match
    else if (cutNorm.includes('cuello redondo') && metaCorteNorm.includes('cuello redondo')) {
      score += 20;
      reasons.push(`Corte: Cuello Redondo`);
      corteMatched = true;
    }
    // Sudadera con capucha, cangurera, cierre, etc.
    else if (cutNorm.includes('capucha') && metaCorteNorm.includes('capucha')) {
      score += 22;
      reasons.push(`Corte: ${meta.corte}`);
      corteMatched = true;
    }
    else if (cutNorm.includes('cangurera') && metaCorteNorm.includes('cangurera')) {
      score += 22;
      reasons.push(`Corte: ${meta.corte}`);
      corteMatched = true;
    }
    else if (cutNorm.includes('cierre') && metaCorteNorm.includes('cierre')) {
      score += 22;
      reasons.push(`Corte: ${meta.corte}`);
      corteMatched = true;
    }
    else if (cutNorm.includes('1/4') && metaCorteNorm.includes('1/4')) {
      score += 22;
      reasons.push(`Corte: ${meta.corte}`);
      corteMatched = true;
    }
    // Sin Mangas match
    else if ((cutNorm.includes('sin manga') || cutNorm.includes('tank') || cutNorm.includes('tirantes')) &&
             norm(meta.manga).includes('sin manga')) {
      score += 20;
      reasons.push(`Corte: Sin Mangas`);
      corteMatched = true;
    }

    // PENALIZACIÓN: Si el corte es de un tipo similar pero NO coincide → penalizar fuerte
    // Ej: producto es "Cuello V" pero sección es "Cuello Redondo" → no debe sugerirlo
    if (!corteMatched) {
      const isSameTipo = (
        (cutNorm.includes('cuello') && (metaCorteNorm.includes('cuello') || metaTipoNorm === 'playera')) ||
        (cutNorm.includes('polo') && metaTipoNorm === 'polo') ||
        (cutNorm.includes('sudadera') && metaTipoNorm === 'sudadera')
      );
      if (isSameTipo) {
        // Mismo tipo de prenda pero corte diferente → penalización fuerte
        score -= 15;
      }
    }
  }

  // 3. GÉNERO — muy importante
  if (product.genderName) {
    const genderNorm = norm(product.genderName);
    const metaGeneroNorm = norm(meta.genero);

    // Match directo
    if (genderNorm === metaGeneroNorm) {
      score += 20;
      reasons.push(`Género: ${meta.genero}`);
    }
    // Match parcial (Niño → Niños, Joven → Jóvenes, Bebé → Bebés)
    else if (
      (genderNorm.startsWith('nino') && metaGeneroNorm.startsWith('nino')) ||
      (genderNorm.startsWith('joven') && metaGeneroNorm.startsWith('joven')) ||
      (genderNorm.startsWith('bebe') && metaGeneroNorm.startsWith('bebe')) ||
      (genderNorm === 'hombre' && metaGeneroNorm === 'caballero') ||
      (genderNorm === 'mujer' && metaGeneroNorm === 'dama')
    ) {
      score += 18;
      reasons.push(`Género: ${meta.genero}`);
    }
    // Prefijo del estilo como fallback (C=Caballero, D=Dama, J=Jóvenes, N=Niños, B=Bebés)
    else {
      const prefix = section.estilo.charAt(0).toUpperCase();
      const prefixMap: Record<string, string[]> = {
        'C': ['caballero', 'hombre', 'unisex'],
        'D': ['dama', 'mujer'],
        'J': ['joven', 'jovenes'],
        'N': ['nino', 'ninos', 'nina'],
        'B': ['bebe', 'bebes'],
      };
      if (prefixMap[prefix]?.some(g => genderNorm.startsWith(g))) {
        score += 15;
        reasons.push(`Género: ${meta.genero} (por código)`);
      }
    }
  }

  // 4. MATERIAL — comparación fuzzy (incluye aliases Dri-Fit ↔ ActiviTee)
  if (product.materialName) {
    const matNorm = norm(product.materialName);
    const metaMatNorm = norm(meta.material);
    const lineaNorm = norm(meta.linea);

    if (matNorm && metaMatNorm) {
      // Match exacto de material
      if (metaMatNorm.includes(matNorm) || matNorm.includes(metaMatNorm)) {
        score += 15;
        reasons.push(`Material: ${meta.material}`);
      }
      // Match parcial: "algodón" en "100% algodón"
      else if (
        (matNorm.includes('algodon') && metaMatNorm.includes('algodon')) ||
        (matNorm.includes('poliester') && metaMatNorm.includes('poliester')) ||
        (matNorm.includes('poly') && metaMatNorm.includes('poly')) ||
        (matNorm.includes('cotton') && metaMatNorm.includes('cotton'))
      ) {
        const isPure = (s: string) => /100\s*%/.test(s);
        const isMix = (s: string) => /\d+\s*%.*\d+\s*%/.test(s);
        if ((isPure(matNorm) && isPure(metaMatNorm)) || (isMix(matNorm) && isMix(metaMatNorm))) {
          score += 12;
        } else {
          score += 5;
        }
        reasons.push(`Material: ${meta.material}`);
      }
    }

    // Check material name vs línea comercial (Dri-Fit → ActiviTee)
    if (matNorm && lineaNorm && isLineAlias(matNorm, lineaNorm)) {
      score += 12;
      reasons.push(`Material ≈ "${meta.linea}"`);
    }
  }

  // 5. TIPO DE PRENDA inferido del nombre de la hoja
  if (product.cutName) {
    const cutNorm = norm(product.cutName);
    if (cutNorm.includes('polo') && sheetName.toLowerCase().includes('polo')) {
      score += 5;
    } else if (
      (cutNorm.includes('cuello') || cutNorm.includes('playera')) &&
      sheetName.toLowerCase().includes('playera') && !sheetName.toLowerCase().includes('polo')
    ) {
      score += 5;
    } else if ((cutNorm.includes('sudadera') || cutNorm.includes('capucha') || cutNorm.includes('hoodie'))
      && sheetName.toLowerCase().includes('sudadera')) {
      score += 5;
    }
  }

  // 6. PESO / LÍNEA — match por peso o nombre de línea (incluye aliases y mapa de pesos)
  if (product.weightName) {
    const weightNorm = norm(product.weightName);
    const lineaNorm = norm(meta.linea);

    // Primero: intentar match directo por el mapa de pesos (300→Heavy, 200→Mid, SP→Deportivo)
    const weightKey = product.weightName.trim().toUpperCase().replace(/\s*G$/, ''); // "300g" → "300", "SP" → "SP"
    const weightMapping = WEIGHT_LINE_MAP[weightKey] || WEIGHT_LINE_MAP[weightNorm];

    if (weightMapping && lineaNorm) {
      const lineaMatchesWeight = weightMapping.matches.some(m => lineaNorm.includes(m));
      if (lineaMatchesWeight) {
        // Match: peso 300 + Heavy Weight → bonus alto
        score += 12;
        reasons.push(`Peso: ${weightMapping.label}`);
      } else {
        // Mismatch: peso 300 pero la sección es Mid Weight → penalización
        const isAnyWeightLine = Object.values(WEIGHT_LINE_MAP).some(
          wm => wm.matches.some(m => lineaNorm.includes(m))
        );
        if (isAnyWeightLine) {
          score -= 8;
          reasons.push(`Peso NO coincide (${product.weightName} vs "${meta.linea}")`);
        }
      }
    }
    // Fallback: Alias check (Dri-Fit ↔ ActiviTee, etc.)
    else if (lineaNorm && isLineAlias(weightNorm, lineaNorm)) {
      score += 10;
      reasons.push(`Línea: "${meta.linea}"`);
    }
    // Match directo o parcial
    else if (lineaNorm && (
      weightNorm.includes(lineaNorm) || lineaNorm.includes(weightNorm) ||
      (weightNorm.match(/\d+/) && lineaNorm.includes(weightNorm.match(/\d+/)?.[0] || '___'))
    )) {
      score += 10;
      reasons.push(`Línea: "${meta.linea}"`);
    }
    // Heavy/Mid weight keywords
    else if (
      (weightNorm.includes('heavy') && lineaNorm?.includes('heavy')) ||
      (weightNorm.includes('mid') && lineaNorm?.includes('mid'))
    ) {
      score += 10;
      reasons.push(`Peso: "${meta.linea}"`);
    }
  }

  return { score, reasons };
}

/**
 * Busca el color más parecido en los colores disponibles de una sección
 */
function findBestColorMatch(productColor: string, sectionColors: ColorInfo[]): string | undefined {
  const colorNorm = productColor
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

  // Match exacto en el nombre del color (sin el código)
  for (const c of sectionColors) {
    // Extraer nombre del color: "(100) Blanco" → "blanco"
    const colorName = c.code.replace(/^\(\d+\)\s*/, '')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
    if (colorName === colorNorm) return c.code;
  }

  // Match parcial (color dentro del nombre o viceversa)
  for (const c of sectionColors) {
    const colorName = c.code.replace(/^\(\d+\)\s*/, '')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
    if (colorName.includes(colorNorm) || colorNorm.includes(colorName)) return c.code;
  }

  return undefined;
}
