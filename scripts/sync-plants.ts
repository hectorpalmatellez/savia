import * as dotenv from 'dotenv';
import path from 'path';
import { syncFromCsv } from '../src/data/sync';

dotenv.config({ path: path.join(process.cwd(), '.env') });
dotenv.config({ path: path.join(process.cwd(), '.env.local'), override: true });

const { plants, warnings } = syncFromCsv();

for (const warning of warnings) {
  console.warn(`⚠  ${warning}`);
}

console.log(
  `Synced ${plants.length} plants from db/Plants.csv to src/data/plants-data.ts`,
);
