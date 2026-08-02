import { readCsv } from '@/data/sync';
import AdminPageClient from './AdminPageClient';

export const dynamic = 'force-dynamic';

export default function AdminPage() {
  let rows: string[][] = [];
  let error: string | null = null;

  try {
    rows = readCsv();
  } catch (err) {
    error = err instanceof Error ? err.message : 'Error reading db/Plants.csv';
  }

  const readOnly = Boolean(process.env.VERCEL);

  return <AdminPageClient rows={rows} error={error} readOnly={readOnly} />;
}
