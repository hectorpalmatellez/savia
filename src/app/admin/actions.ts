'use server';

import fs from 'fs';
import path from 'path';
import { put } from '@vercel/blob';
import { revalidatePath } from 'next/cache';
import { buildCsvRow } from '@/data/csv';
import { IMAGE_EXTENSIONS, compressImage } from '@/data/image-compress';
import type { PlantFormInput } from '@/data/plant-form';
import { readCsv, syncFromCsv, writeCsv } from '@/data/sync';

export type ActionResult =
  { ok: true; warnings: string[] } | { ok: false; error: string };

export type UploadResult =
  | { ok: true; filename: string; warnings: string[] }
  | { ok: false; error: string };

const IMG_DIR = path.join(process.cwd(), 'img');

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
  if (!IMAGE_EXTENSIONS.includes(ext)) {
    return {
      ok: false,
      error: `Formato no permitido: ${IMAGE_EXTENSIONS.join(', ')}`,
    };
  }

  const filename = path.basename(file.name);
  const filePath = path.join(IMG_DIR, filename);
  fs.mkdirSync(IMG_DIR, { recursive: true });
  fs.writeFileSync(filePath, Buffer.from(await file.arrayBuffer()));

  const warnings: string[] = [];
  try {
    await compressImage(filePath);
  } catch (error) {
    warnings.push(
      `La foto se guardó sin comprimir: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  const token = process.env.savia_READ_WRITE_TOKEN;
  if (token) {
    try {
      await put(`plants/${filename}`, fs.readFileSync(filePath), {
        access: 'public',
        token,
      });
    } catch (error) {
      warnings.push(
        `La foto se guardó en ./img pero no se publicó en Blob: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  } else {
    warnings.push(
      'savia_READ_WRITE_TOKEN no está configurado — la foto solo quedó en ./img.',
    );
  }

  return { ok: true, filename, warnings };
}
