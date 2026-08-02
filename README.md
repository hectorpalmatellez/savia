# SAVIA — Mi Jardín

A personal plant-tracking web app ("Mi Jardín" / My Garden), with a Spanish-language UI. It renders a searchable, filterable grid of plants with photos and a detail page per plant showing the photo's EXIF capture date, acquisition data, sensor status, and health status.

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript** (strict)
- **Mantine v8** for UI (`@mantine/core`, `@mantine/hooks`)
- **exif-js** for EXIF photo dates, **@vercel/blob** for photo storage
- ISR (`revalidate = 60`) + a client-side localStorage cache for resilient reads
- Deployed on **Vercel**

## Getting Started

```bash
npm install
cp .env.example .env.local   # then fill in your values
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The app fetches plant data from the remote REST API; it throws at startup if `NEXT_PUBLIC_API_URL` is missing.

## Environment variables

| Variable                    | Required    | Purpose                                                              |
| --------------------------- | ----------- | -------------------------------------------------------------------- |
| `NEXT_PUBLIC_API_URL`       | yes         | Base URL of the remote plant API                                     |
| `API_KEY`                   | no          | Sent as `X-API-Key` header on API requests                           |
| `NEXT_PUBLIC_BLOB_BASE_URL` | no          | Vercel Blob base URL for plant photos (has a built-in fallback)      |
| `savia_READ_WRITE_TOKEN`    | for uploads | Vercel Blob write token for `npm run upload:img` (`.env.local` only) |
| `VERCEL_OIDC_TOKEN`         | for Vercel  | Vercel-supplied OIDC token (`.env.local` only)                       |

## Scripts

```bash
npm run dev          # start dev server
npm run build        # production build
npm run start        # serve production build
npm run lint         # eslint (flat config)
npm run typecheck    # tsc --noEmit
npm run format       # prettier --write .
npm run format:check # prettier --check .
npm run upload:img   # upload ./img/* photos to Vercel Blob (plants/ prefix)
```

## Image pipeline

1. Drop phone photos into `./img/`.
2. Run `npm run upload:img` to upload them to Vercel Blob under `plants/`.
3. Store the resulting filenames in the remote API's `Photo` column; the app reconstructs full URLs from `NEXT_PUBLIC_BLOB_BASE_URL`.

EXIF capture dates are read client-side on the detail page to show "Foto tomada el: …".

## Architecture

- **Data source**: a remote REST API returning `{ success, data, meta }` with Spanish column names (`Name`, `Latin`, `Precio`, `Status`, `Photo`, `Sensor`, …). No database lives in this repo.
- **Page pattern**: server component (`page.tsx`, ISR fetch) → client wrapper (`XxxPageClient.tsx`, localStorage cache upsert) → presentational client component.
- **IDs are array indexes**: the API stopped returning `ID`, so plant URLs encode the plant's position in the collection. See `AGENTS.md` for details and known quirks.
- **Resilience**: ISR keeps the grid fast, and the localStorage cache (`savia_plants_cache`) keeps it usable if the API is slow or down.

See `AGENTS.md` for agent guidance and `ROADMAP.md` for the feature wishlist.
