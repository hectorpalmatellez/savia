import fs from 'fs';
import path from 'path';
import { put } from '@vercel/blob';
import * as dotenv from 'dotenv';

// Load environment variables from .env and .env.local
dotenv.config({ path: path.join(process.cwd(), '.env') });
dotenv.config({ path: path.join(process.cwd(), '.env.local'), override: true });

const BLOB_TOKEN = process.env.savia_READ_WRITE_TOKEN;

if (!BLOB_TOKEN) {
  console.error('Error: savia_READ_WRITE_TOKEN environment variable is not set');
  process.exit(1);
}

const IMG_DIR = path.join(process.cwd(), 'img');

async function uploadImages() {
  if (!fs.existsSync(IMG_DIR)) {
    console.log(`Directory ${IMG_DIR} does not exist. Creating it...`);
    fs.mkdirSync(IMG_DIR, { recursive: true });
  }

  const allFiles = fs.readdirSync(IMG_DIR);
  const files = allFiles.filter(file => {
    // Basic image extension filtering
    const ext = path.extname(file).toLowerCase();
    return ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'].includes(ext);
  });

  if (files.length === 0) {
    console.log(`No image files found in the ./img/ directory. Total files found: ${allFiles.length}`);
    return;
  }

  console.log(`Found ${files.length} images to upload...`);

  for (const file of files) {
    const filePath = path.join(IMG_DIR, file);
    const fileBuffer = fs.readFileSync(filePath);

    try {
      console.log(`Uploading ${file}...`);
      const blob = await put(`plants/${file}`, fileBuffer, {
        access: 'public',
        token: BLOB_TOKEN,
      });

      console.log(`Successfully uploaded ${file}:`);
      console.log(`  URL: ${blob.url}`);
    } catch (error) {
      console.error(`Failed to upload ${file}:`, error);
    }
  }

  console.log('Finished uploading images.');
}

uploadImages().catch(err => {
  console.error('Unhandled error during upload:', err);
  process.exit(1);
});
