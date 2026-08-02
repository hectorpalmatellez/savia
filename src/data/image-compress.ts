import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

/**
 * Server-only: sharp-based in-place photo compression for the upload
 * pipeline. Used by scripts/upload-images.ts and the /admin uploadPhoto
 * server action. Never imported by client components.
 */

export const IMAGE_EXTENSIONS = [
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.webp',
  '.svg',
];

export const COMPRESSIBLE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

export const MAX_WIDTH = 1600;

export function formatBytes(bytes: number): string {
  return bytes > 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.round(bytes / 1024)} KB`;
}

/**
 * Re-encodes the image in place with sharp: baked-in EXIF orientation,
 * capped at MAX_WIDTH, format-appropriate quality. Metadata is preserved
 * (.withMetadata) because EXIF DateTimeOriginal drives the photo capture
 * date shown in the detail view. Skips formats that cannot be re-encoded
 * safely (animated GIF, SVG) and files where compression gains nothing.
 */
export async function compressImage(filePath: string): Promise<void> {
  const ext = path.extname(filePath).toLowerCase();
  if (!COMPRESSIBLE_EXTENSIONS.includes(ext)) return;

  const before = fs.statSync(filePath).size;
  const pipeline = sharp(filePath)
    .rotate()
    .resize({ width: MAX_WIDTH, withoutEnlargement: true })
    .withMetadata();

  let buffer: Buffer;
  if (ext === '.jpg' || ext === '.jpeg') {
    buffer = await pipeline.jpeg({ quality: 82, mozjpeg: true }).toBuffer();
  } else if (ext === '.png') {
    buffer = await pipeline.png({ compressionLevel: 9 }).toBuffer();
  } else {
    buffer = await pipeline.webp({ quality: 80 }).toBuffer();
  }

  if (buffer.length >= before) {
    return;
  }

  fs.writeFileSync(filePath, buffer);
}
