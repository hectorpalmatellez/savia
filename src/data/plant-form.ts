import type { Room } from './plants';

/**
 * Pure helpers shared between the CSV sync pipeline (server) and the /admin
 * form UI (client). No Node APIs, no process.env — safe for client imports.
 */

export interface PlantFormInput {
  name: string;
  type: string;
  category: string;
  latin: string;
  date: string;
  location: string;
  orientation: string;
  origin: string;
  status: string;
  photo: string;
  sensor: boolean;
  price: number | undefined;
}

export const LOCATION_OPTIONS: Room[] = [
  'Living Room',
  'Dormitorio',
  'Balcón',
  'Pieza Cony',
  'Bedroom',
  'Kitchen',
];

export const STATUS_OPTIONS = ['Viva', 'Débil', 'Muerta'];

export function emptyPlantForm(): PlantFormInput {
  return {
    name: '',
    type: '',
    category: '',
    latin: '',
    date: '',
    location: 'Living Room',
    orientation: '',
    origin: '',
    status: '',
    photo: '',
    sensor: false,
    price: undefined,
  };
}

/**
 * "$3,990" / "$12,990" / "$0" → 3990 / 12990 / 0
 */
export function parsePrice(raw: string | undefined): number | undefined {
  if (!raw) return undefined;
  const digits = raw.replace(/[^0-9]/g, '');
  if (!digits) return undefined;
  const value = Number(digits);
  return Number.isFinite(value) ? value : undefined;
}

/**
 * 3990 → "$3,990" (matches the format used by the existing CSV rows)
 */
export function formatPrice(value: number): string {
  return `$${value.toLocaleString('en-US')}`;
}

/**
 * CSV row fields (ID excluded) → form values. Values must be trimmed already.
 */
export function csvFieldsToPlantForm(fields: string[]): PlantFormInput {
  const field = (index: number) => (fields[index] ?? '').trim();
  return {
    name: field(0),
    type: field(1),
    category: field(2),
    latin: field(3),
    date: field(4),
    location: field(5),
    orientation: field(6),
    origin: field(7),
    status: field(8),
    photo: field(9),
    sensor: field(10) === 'TRUE',
    price: parsePrice(field(11)),
  };
}

/**
 * Form values → CSV row fields (ID excluded, ready to be joined with the ID).
 */
export function plantFormToCsvFields(input: PlantFormInput): string[] {
  return [
    input.name.trim(),
    input.type.trim(),
    input.category.trim(),
    input.latin.trim(),
    input.date.trim(),
    input.location.trim(),
    input.orientation.trim(),
    input.origin.trim(),
    input.status.trim(),
    input.photo.trim(),
    input.sensor ? 'TRUE' : 'FALSE',
    input.price === undefined ? '' : formatPrice(input.price),
  ];
}
