import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import type { PlantData } from './plants';
import {
  PLANT_HEADERS,
  parseCsv,
  plantRowToPlantData,
  serializeCsv,
} from './csv';

/**
 * Server-only: reads/writes db/Plants.csv and regenerates the committed
 * data module. Used by scripts/sync-plants.ts and the /admin server actions.
 */

export const CSV_PATH = path.join(process.cwd(), 'db', 'Plants.csv');
export const DATA_OUT_PATH = path.join(
  process.cwd(),
  'src',
  'data',
  'plants-data.ts',
);

export interface SyncResult {
  plants: PlantData[];
  warnings: string[];
}

/**
 * Reads the CSV file and returns the data rows (header excluded, blank
 * lines filtered). Throws if the file is missing or empty.
 */
export function readCsv(): string[][] {
  if (!fs.existsSync(CSV_PATH)) {
    throw new Error(`${CSV_PATH} does not exist`);
  }
  const rows = parseCsv(fs.readFileSync(CSV_PATH, 'utf-8')).filter(row =>
    row.some(cell => cell.trim() !== ''),
  );
  if (rows.length < 2) {
    throw new Error(`${CSV_PATH} has no data rows`);
  }
  return rows.slice(1);
}

/**
 * Writes the data rows back to the CSV file (header included). Rows are
 * padded to the header length so a new trailing column (e.g. ParentID)
 * stays consistent even for rows that were read before the column existed.
 */
export function writeCsv(rows: string[][]): void {
  const padded = rows.map(row => [
    ...row,
    ...Array(Math.max(0, PLANT_HEADERS.length - row.length)).fill(''),
  ]);
  fs.writeFileSync(CSV_PATH, serializeCsv(PLANT_HEADERS, padded));
}

function serializePlant(plant: PlantData): string {
  const quote = (value: string | null | undefined) =>
    value === undefined || value === null
      ? 'undefined'
      : `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;

  const date = plant.purchase_date
    ? `new Date(${plant.purchase_date.getFullYear()}, ${plant.purchase_date.getMonth()}, ${plant.purchase_date.getDate()})`
    : 'undefined';

  return [
    '  {',
    `    id: '${plant.id ?? ''}',`,
    `    row: ${plant.row ?? 0},`,
    `    common_name: ${quote(plant.common_name)},`,
    `    scientific_name: ${quote(plant.scientific_name)},`,
    `    category: ${quote(plant.category)},`,
    `    type: ${quote(plant.type)},`,
    `    origin: ${quote(plant.origin)},`,
    `    price: ${quote(plant.price)},`,
    `    location: ${quote(plant.location)},`,
    `    placement: ${quote(plant.placement)},`,
    `    purchase_date: ${date},`,
    `    status: ${quote(plant.status)},`,
    `    image: ${quote(plant.image)},`,
    `    sensor: ${plant.sensor},`,
    `    parent_id: ${quote(plant.parent_id)},`,
    '  },',
  ].join('\n');
}

/**
 * Parses db/Plants.csv and regenerates src/data/plants-data.ts.
 * Returns the mapped plants plus any data-quality warnings.
 */
export function syncFromCsv(): SyncResult {
  const rows = readCsv();
  const warnings: string[] = [];
  const plants: PlantData[] = [];
  const seen = new Set<string>();
  const seenIds = new Set<string>();

  rows.forEach((row, index) => {
    const rowNumber = index + 2;
    const plant = plantRowToPlantData(row, rowNumber, warnings);

    if (seenIds.has(plant.id ?? '')) {
      warnings.push(`Row ${rowNumber}: duplicate ID "${plant.id}"`);
    }
    seenIds.add(plant.id ?? '');

    const key = `${plant.common_name}|${plant.location}|${plant.purchase_date?.toISOString() ?? ''}`;
    if (seen.has(key)) {
      warnings.push(
        `Row ${rowNumber}: duplicate of "${plant.common_name}" (same name, location and date)`,
      );
    }
    seen.add(key);

    plants.push(plant);
  });

  const content = [
    '// AUTO-GENERATED FILE — do not edit by hand.',
    '// Regenerate with `pnpm sync:data` after editing db/Plants.csv.',
    "import type { PlantData } from './plants';",
    '',
    'export const plants: PlantData[] = [',
    plants.map(serializePlant).join('\n'),
    '];',
    '',
  ].join('\n');

  fs.writeFileSync(DATA_OUT_PATH, content);

  try {
    const prettierBin = path.join(
      process.cwd(),
      'node_modules',
      '.bin',
      'prettier',
    );
    execSync(`"${prettierBin}" --write ${DATA_OUT_PATH}`, {
      cwd: process.cwd(),
      stdio: 'inherit',
    });
  } catch {
    // Prettier is optional here; the emitted file is already close enough.
  }

  return { plants, warnings };
}
