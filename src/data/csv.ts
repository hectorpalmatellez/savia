import type { PlantData, PlantStatus, Room } from './plants';
import { plantFormToCsvFields } from './plant-form';
import type { PlantFormInput } from './plant-form';

/**
 * CSV parsing/serialization and PlantData mapping for db/Plants.csv.
 * Server-only: reads process.env and is imported by sync.ts, the admin
 * server actions and scripts/sync-plants.ts — never by client components.
 */

export const PLANT_HEADERS = [
  'ID',
  'Name',
  'Type',
  'Category',
  'Latin',
  'Date',
  'Location',
  'Orientation',
  'Origin',
  'Status',
  'Photo',
  'Sensor',
  'Precio',
] as const;

const BLOB_BASE_URL_FALLBACK =
  'https://bfvid4lplyqsxghx.public.blob.vercel-storage.com/plants/';

export function blobBaseUrl(): string {
  return process.env.NEXT_PUBLIC_BLOB_BASE_URL || BLOB_BASE_URL_FALLBACK;
}

const LOCATION_MAP: Record<string, Room> = {
  Living: 'Living Room',
  'Living Room': 'Living Room',
  Bedroom: 'Bedroom',
  Kitchen: 'Kitchen',
  Dormitorio: 'Dormitorio',
  Balcón: 'Balcón',
  'Pieza Cony': 'Pieza Cony',
};

const MONTHS: Record<string, number> = {
  January: 1,
  February: 2,
  March: 3,
  April: 4,
  May: 5,
  June: 6,
  July: 7,
  August: 8,
  September: 9,
  October: 10,
  November: 11,
  December: 12,
};

/**
 * Minimal RFC 4180-style CSV parser: handles quoted fields, escaped quotes,
 * commas and newlines inside quotes, and CRLF line endings.
 */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  const source = text.replace(/\r\n/g, '\n');

  for (let i = 0; i < source.length; i++) {
    const char = source[i];
    if (inQuotes) {
      if (char === '"') {
        if (source[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }

  if (field !== '' || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

function quoteField(field: string): string {
  if (/[",\n]/.test(field)) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

/**
 * Serializes a header row + data rows back to CSV text (RFC 4180-ish).
 */
export function serializeCsv(
  headers: readonly string[],
  rows: string[][],
): string {
  const lines = [headers.map(quoteField).join(',')];
  for (const row of rows) {
    lines.push(row.map(quoteField).join(','));
  }
  return `${lines.join('\n')}\n`;
}

/**
 * Accepts "Wednesday, January 20, 2021", "January 20, 2021" or "2021-01-20".
 * Returns [year, month (1-12), day].
 */
export function parsePurchaseDate(
  raw: string,
): [number, number, number] | undefined {
  const value = raw.trim();
  if (!value) return undefined;

  const iso = value.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (iso) {
    return [Number(iso[1]), Number(iso[2]), Number(iso[3])];
  }

  const long = value.match(/^(?:[A-Za-z]+, )?([A-Za-z]+) (\d{1,2}), (\d{4})$/);
  if (long) {
    const month = MONTHS[long[1]];
    if (month) {
      return [Number(long[3]), month, Number(long[2])];
    }
  }

  return undefined;
}

/**
 * Maps a CSV data row (aligned to PLANT_HEADERS) to PlantData.
 * rowNumber is the 1-based line in the file (data starts at row 2).
 */
export function plantRowToPlantData(
  values: string[],
  rowNumber: number,
  warnings: string[],
): PlantData {
  const record: Record<string, string> = {};
  PLANT_HEADERS.forEach((header, index) => {
    record[header] = (values[index] ?? '').trim();
  });

  const commonName = record.Name;
  if (!commonName) {
    throw new Error(`Row ${rowNumber}: missing Name`);
  }

  const id = record.ID || String(rowNumber);
  if (!record.ID) {
    warnings.push(`Row ${rowNumber}: missing ID, falling back to row number`);
  }
  if (record.ID && !/^\d+$/.test(record.ID)) {
    warnings.push(`Row ${rowNumber}: non-numeric ID "${record.ID}"`);
  }

  const locationRaw = record.Location;
  if (locationRaw && !(locationRaw in LOCATION_MAP)) {
    warnings.push(
      `Row ${rowNumber}: unknown location "${locationRaw}", defaulting to "Living Room"`,
    );
  }
  const location = LOCATION_MAP[locationRaw] ?? 'Living Room';

  const dateParts = parsePurchaseDate(record.Date);
  if (record.Date && !dateParts) {
    warnings.push(`Row ${rowNumber}: unparseable Date "${record.Date}"`);
  }

  const photo = record.Photo;
  const status = record.Status;

  return {
    id,
    row: rowNumber,
    common_name: commonName,
    scientific_name: record.Latin || undefined,
    category: record.Category || undefined,
    type: record.Type || undefined,
    origin: record.Origin || undefined,
    price: record.Precio || undefined,
    location,
    placement: record.Orientation || undefined,
    purchase_date: dateParts
      ? new Date(dateParts[0], dateParts[1] - 1, dateParts[2])
      : undefined,
    status: (status || undefined) as PlantStatus,
    image: photo ? `${blobBaseUrl()}${photo}` : undefined,
    sensor: record.Sensor === 'TRUE',
  };
}

/**
 * Builds a full new CSV row (ID included) from a form input.
 */
export function buildCsvRow(id: number, input: PlantFormInput): string[] {
  return [String(id), ...plantFormToCsvFields(input)];
}
