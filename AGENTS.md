# AGENTS.md

Guidance for AI agents working on the `savia` codebase.

## Overview

**savia** is a personal plant-tracking web app ("Mi Jardín" / My Garden), with a Spanish-language UI. It renders a searchable, filterable grid of plants with photos and a detail page per plant showing the photo's EXIF capture date, acquisition data, sensor status, and health status.

## Goals

- Photo-first plant journal: the photo (and its EXIF capture date) is the anchor of each plant record.
- Fast reads with minimal dependency on the remote API: ISR + a client-side localStorage cache keep the app usable even when the API is slow or down.
- Simple, personal-scale architecture: no database in this repo; the remote REST API is the source of truth.

## Stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 16.1.6 (App Router, Turbopack-compatible) |
| UI | React 19.2.3, Mantine v8 (`@mantine/core`, `@mantine/hooks`) |
| Language | TypeScript 5, `strict: true` |
| Styling | Mantine inline props + `postcss-preset-mantine` (`postcss.config.mjs` defines all 5 Mantine breakpoints) |
| Images | `@vercel/blob` (public storage), `exif-js` for EXIF dates |
| Build extras | React Compiler enabled (`next.config.ts` → `reactCompiler: true`) |
| Deployment | Vercel (`.vercel/project.json`) |
| Tooling | ESLint 9 flat config, Prettier 3, `tsx` for scripts |

## Commands

```bash
npm run dev          # start dev server
npm run build        # production build
npm run start        # serve production build
npm run lint         # eslint (flat config)
npm run format       # prettier --write .
npm run format:check # prettier --check .
npm run upload:img   # npx tsx scripts/upload-images.ts
```

## Environment variables

| Variable | Where | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | `.env` / `.env.local` | Base URL of the remote plant API (required; app throws at import if missing) |
| `API_KEY` | `.env` / `.env.local` | Sent as `X-API-Key` header on API requests |
| `savia_READ_WRITE_TOKEN` | `.env.local` only | Vercel Blob write token for `scripts/upload-images.ts` |
| `VERCEL_OIDC_TOKEN` | `.env.local` only | Vercel-supplied OIDC token |

## Architecture

### Directory layout

```
src/
├── app/                    # App Router routes
│   ├── layout.tsx          # Root layout: MantineProvider + AppShell header ("SAVIA" wordmark)
│   ├── page.tsx            # Home — server component (ISR fetch)
│   ├── HomePageClient.tsx  # 'use client' — search/filter grid UI
│   └── plant/[id]/
│       ├── page.tsx        # Detail — server component (ISR fetch)
│       ├── PlantDetailPageClient.tsx  # 'use client' — cache wrapper
│       └── PlantDetail.tsx # 'use client' — detail UI (EXIF date, badges, modal)
├── components/             # empty placeholder (components live next to their routes)
├── data/
│   ├── plants.ts           # PlantData type + legacy sample data (mostly dead)
│   ├── api.ts              # fetchPlants / fetchPlantById + API→PlantData mapping
│   └── cache.ts            # localStorage cache helpers (key: savia_plants_cache)
└── pages/                  # empty placeholder — App Router is used instead
scripts/
└── upload-images.ts        # uploads ./img/* photos to Vercel Blob under plants/
```

### Page pattern

Every route follows the same three-layer pattern:

1. **Server component** (`page.tsx`) — fetches data server-side, exports `revalidate = 60` (ISR), passes `PlantData[]` (or single plant) + optional `error` to the client wrapper.
2. **Client wrapper** (`XxxPageClient.tsx`) — `'use client'`; on mount, upserts fetched plants into the localStorage cache, then renders the presentational component.
3. **Presentational client component** — Mantine-based UI.

`params` is awaited (`{ params }: { params: Promise<{ id: string }> }`) per the Next 15+/16 async params convention.

### Data flow

- Remote REST API returns an envelope `{ success, data, meta }` where `data` is an array of records with **Spanish column names** (`Name`, `Latin`, `Precio`, `Date`, `Location`, `Orientation`, `Status`, `Photo`, `Sensor`, `_row`, optional `ID`).
- `src/data/api.ts` maps those records to `PlantData` (see `mapApiPlantToPlantData`). Image URLs are built by prefixing the `Photo` filename with a hardcoded Vercel Blob base URL.
- **IDs are array indexes.** The API stopped returning `ID`, so `fetchPlantById(id)` fetches the entire collection and returns `data[index]` via `parseInt(id, 10)`. Route links (`/plant/{id}`) therefore encode position, not a stable key. Do not assume IDs are stable across API changes.
- Client-side cache (`src/data/cache.ts`): `localStorage` key `savia_plants_cache`, all helpers wrapped in try/catch (guards SSR/private mode).

### Image pipeline

1. Phone photos are dropped into `./img/`.
2. `npm run upload:img` (`scripts/upload-images.ts`) uploads each image to Vercel Blob at `plants/<filename>` (public access) using `savia_READ_WRITE_TOKEN`, printing the resulting URLs.
3. The `Photo` column in the remote API stores the filename; the app reconstructs the full URL.

EXIF dates are read client-side in `PlantDetail.tsx` (`DateTimeOriginal` / `CreateDate` / `ModifyDate`) with `img.crossOrigin = 'Anonymous'`.

### Styling & theme

- Mantine `createTheme` in `src/app/layout.tsx`: `primaryColor: 'green'`, `fontFamily: 'Inter, sans-serif'`.
- UI strings are Spanish ("Mi Jardín", "Vivas/Muertas", "Ver Detalles", "Foto tomada el …").
- Styling is done with inline Mantine props; CSS modules exist but are largely unused.

## Known quirks & technical debt

- **Index-based IDs**: plant URLs break if the API reorders or filters records. See "Data flow" above.
- **Hardcoded Blob URL**: `BLOB_BASE_URL` in `src/data/api.ts:7` should move to an env var.
- **Dead code**: `PLANT_DATA` sample data in `src/data/plants.ts` (references a non-existent `/images/monstera.jpg`), `src/app/page.module.css`, `PlantDetail.module.css` (unreferenced), leftover `globals.css` boilerplate, empty `src/components/` and `src/pages/`.
- **Mixed languages in data**: `location` values mix English (`'Living Room'`) and Spanish (`'Dormitorio'`, `'Balcón'`); the normalization ternary in `api.ts` silently defaults anything unknown to `'Living Room'`.
- **Commented-out feature**: the sensor filter in `HomePageClient.tsx` (`.filter(plant => plant.sensor === true)`) is disabled.
- **No tests**, no lint/typecheck CI. README.md is untouched create-next-app boilerplate.
- `fetchPlantById` re-fetches the whole collection (O(n)) — fine at personal scale, not a scalability pattern.

## Conventions

- Follow the server → client wrapper → presentational component pattern for any new route.
- Path alias `@/*` → `./src/*` for imports.
- Spanish UI strings; keep `lang="es"` in the root layout.
- All `PlantData`-related types live in `src/data/plants.ts`.
- Formatting: Prettier with `semi: true, singleQuote: true, tabWidth: 2, trailingComma: "all", printWidth: 80, arrowParens: "avoid"`.
- No test framework is installed yet; if adding tests, check `ROADMAP.md` first.
- Never commit `.env*`, `.vercel`, or secrets (see `.gitignore`).
