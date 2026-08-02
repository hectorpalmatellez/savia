'use server';

import fs from 'fs';
import path from 'path';
import { revalidatePath } from 'next/cache';
import { buildCsvRow } from '@/data/csv';
import type { PlantFormInput } from '@/data/plant-form';
import { readCsv, syncFromCsv, writeCsv } from '@/data/sync';

export type ActionResult =
  { ok: true; warnings: string[] } | { ok: false; error: string };

export type UploadResult =
  | { ok: true; filename: string; warnings: string[] }
  | { ok: false; error: string };

const IMG_DIR = path.join(process.cwd(), 'img');
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];

function editableError(): string | null {
  if (process.env.VERCEL) {
    return 'La edición solo está disponible en desarrollo local (pnpm dev) — Vercel no permite escribir archivos.';
  }
  return null;
}

function rowIndexById(rows: string[][], id: number): number {
  return rows.findIndex(row => Number(row[0]) === id);
}

export async function createPlant(
  input: PlantFormInput,
): Promise<ActionResult> {
  const blocked = editableError();
  if (blocked) return { ok: false, error: blocked };

  const rows = readCsv();
  const ids = rows.map(row => Number(row[0])).filter(Number.isFinite);
  const nextId = ids.length > 0 ? Math.max(...ids) + 1 : 1;
  rows.push(buildCsvRow(nextId, input));

  writeCsv(rows);
  const { warnings } = syncFromCsv();
  revalidatePath('/');
  return { ok: true, warnings };
}

export async function updatePlant(
  id: number,
  input: PlantFormInput,
): Promise<ActionResult> {
  const blocked = editableError();
  if (blocked) return { ok: false, error: blocked };

  const rows = readCsv();
  const index = rowIndexById(rows, id);
  if (index < 0) {
    return { ok: false, error: `Planta ${id} no encontrada` };
  }

  rows[index] = buildCsvRow(id, input);

  writeCsv(rows);
  const { warnings } = syncFromCsv();
  revalidatePath('/');
  return { ok: true, warnings };
}

export async function deletePlant(id: number): Promise<ActionResult> {
  const blocked = editableError();
  if (blocked) return { ok: false, error: blocked };

  const rows = readCsv();
  const index = rowIndexById(rows, id);
  if (index < 0) {
    return { ok: false, error: `Planta ${id} no encontrada` };
  }

  rows.splice(index, 1);

  writeCsv(rows);
  const { warnings } = syncFromCsv();
  revalidatePath('/');
  return { ok: true, warnings };
}

export async function uploadPhoto(formData: FormData): Promise<UploadResult> {
  const blocked = editableError();
  if (blocked) return { ok: false, error: blocked };

  const file = formData.get('file');
  if (!(file instanceof File)) {
    return { ok: false, error: 'No se recibió ningún archivo.' };
  }

  const ext = path.extname(file.name).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return {
      ok: false,
      error: `Formato no permitido: ${ALLOWED_EXTENSIONS.join(', ')}`,
    };
  }

  const filename = path.basename(file.name);
  fs.mkdirSync(IMG_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(IMG_DIR, filename),
    Buffer.from(await file.arrayBuffer()),
  );

  return { ok: true, filename, warnings: [] };
}
