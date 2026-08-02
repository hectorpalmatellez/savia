import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { put } from '@vercel/blob';
import * as dotenv from 'dotenv';

// Load environment variables from .env and .env.local
dotenv.config({ path: path.join(process.cwd(), '.env') });
dotenv.config({ path: path.join(process.cwd(), '.env.local'), override: true });

const BLOB_TOKEN = process.env.savia_READ_WRITE_TOKEN;

if (!BLOB_TOKEN) {
  console.error(
    'Error: savia_READ_WRITE_TOKEN environment variable is not set',
  );
  process.exit(1);
}

const IMG_DIR = path.join(process.cwd(), 'img');
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
const COMPRESSIBLE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
const MAX_WIDTH = 1600;

function formatBytes(bytes: number): string {
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
async function compressImage(filePath: string): Promise<void> {
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
    console.log(
      `  ${path.basename(filePath)}: already optimal (${formatBytes(before)})`,
    );
    return;
  }

  fs.writeFileSync(filePath, buffer);
  const saved = Math.round((1 - buffer.length / before) * 100);
  console.log(
    `  Compressed ${path.basename(filePath)}: ${formatBytes(before)} → ${formatBytes(buffer.length)} (−${saved}%)`,
  );
}

async function uploadImages() {
  if (!fs.existsSync(IMG_DIR)) {
    console.log(`Directory ${IMG_DIR} does not exist. Creating it...`);
    fs.mkdirSync(IMG_DIR, { recursive: true });
  }

  const allFiles = fs.readdirSync(IMG_DIR);
  const files = allFiles.filter(file => {
    const ext = path.extname(file).toLowerCase();
    return IMAGE_EXTENSIONS.includes(ext);
  });

  if (files.length === 0) {
    console.log(
      `No image files found in the ./img/ directory. Total files found: ${allFiles.length}`,
    );
    return;
  }

  console.log(`Found ${files.length} images to upload...`);

  for (const file of files) {
    const filePath = path.join(IMG_DIR, file);

    try {
      await compressImage(filePath);
      const fileBuffer = fs.readFileSync(filePath);

      console.log(`Uploading ${file}...`);
      const blob = await put(`plants/${file}`, fileBuffer, {
        access: 'public',
        token: BLOB_TOKEN,
      });

      console.log(`Successfully uploaded ${file}:`);
      console.log(`  URL: ${blob.url}`);
    } catch (error) {
      console.error(`Failed to process ${file}:`, error);
    }
  }

  console.log('Finished uploading images.');
}

uploadImages().catch(err => {
  console.error('Unhandled error during upload:', err);
  process.exit(1);
});
