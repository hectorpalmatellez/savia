# SAVIA — Mi Jardín

A personal plant-tracking web app ("Mi Jardín" / My Garden), with a Spanish-language UI. It renders a searchable, filterable grid of plants with photos and a detail page per plant showing the photo's EXIF capture date, acquisition data, sensor status, and health status.

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript** (strict)
- **Mantine v8** for UI (`@mantine/core`, `@mantine/hooks`)
- **exif-js** for EXIF photo dates, **@vercel/blob** for photo storage
- Plant data lives in `db/Plants.csv` and is compiled into a typed module at sync time; a client-side localStorage cache keeps the grid usable offline
- Deployed on **Vercel**

## Getting Started

```bash
pnpm install
cp .env.example .env.local   # optional — there is a built-in fallback for images
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). Plant data comes from the committed, generated module `src/data/plants-data.ts` — no API keys or remote services needed.

## Environment variables

| Variable                    | Required    | Purpose                                                           |
| --------------------------- | ----------- | ----------------------------------------------------------------- |
| `NEXT_PUBLIC_BLOB_BASE_URL` | no          | Vercel Blob base URL for plant photos (built-in fallback)         |
| `savia_READ_WRITE_TOKEN`    | for uploads | Vercel Blob write token for `pnpm upload:img` (`.env.local` only) |
| `VERCEL_OIDC_TOKEN`         | for Vercel  | Vercel-supplied OIDC token (`.env.local` only)                    |

## Scripts

```bash
pnpm dev          # start dev server
pnpm build        # production build
pnpm start        # serve production build
pnpm lint         # eslint (flat config)
pnpm typecheck    # tsc --noEmit
pnpm format       # prettier --write .
pnpm format:check # prettier --check .
pnpm sync:data    # regenerate src/data/plants-data.ts from db/Plants.csv
pnpm upload:img   # upload ./img/* photos to Vercel Blob (plants/ prefix)
```

## Image pipeline

1. Drop phone photos into `./img/`.
2. Run `pnpm upload:img` — it compresses each photo in place with sharp (1600px cap, EXIF capture date preserved) and uploads to Vercel Blob under `plants/`.
3. Store the resulting filenames in the `Photo` column of `db/Plants.csv` (via `/admin` or `pnpm sync:data` after hand-editing) — full URLs are baked into the generated data.

EXIF capture dates are read client-side on the detail page to show "Foto tomada el: …".

## Admin (dev only)

`http://localhost:3000/admin` is a Mantine CRUD UI for `db/Plants.csv`: list, create, edit and delete plants through server actions that rewrite the CSV and regenerate the data module on every change. Writes are blocked on Vercel (read-only filesystem), so production shows a read-only notice — manage plants locally and commit the changes.

## Architecture

- **Data source**: `db/Plants.csv` is the single source of truth (no database, no remote API). Each row has a stable `ID` column; `pnpm sync:data` parses the CSV and regenerates the committed, typed module `src/data/plants-data.ts`, which `src/data/store.ts` (`getPlants` / `getPlantById`) reads.
- **Page pattern**: server component (`page.tsx`, reads the generated module) → client wrapper (`XxxPageClient.tsx`, localStorage cache upsert) → presentational client component.
- **IDs are explicit and stable**: `/plant/{id}` uses the `ID` column, so appending, reordering or deleting rows never breaks URLs (`getPlantById` also falls back to row numbers for legacy links).
- **Resilience**: zero runtime dependencies, and the localStorage cache (`savia_plants_cache`) keeps the grid usable offline.

See `AGENTS.md` for agent guidance and `ROADMAP.md` for the feature wishlist.
