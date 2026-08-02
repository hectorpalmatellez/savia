# AGENTS.md

Guidance for AI agents working on the `savia` codebase.

## Overview

**savia** is a personal plant-tracking web app ("Mi Jardín" / My Garden), with a Spanish-language UI. It renders a searchable, filterable grid of plants with photos and a detail page per plant showing the photo's EXIF capture date, acquisition data, sensor status, and health status.

## Goals

- Photo-first plant journal: the photo (and its EXIF capture date) is the anchor of each plant record.
- Fast reads with zero external runtime dependencies: plant data is a committed, generated TypeScript module; a client-side localStorage cache keeps the grid usable offline.
- Simple, personal-scale architecture: no database and no remote API; `db/Plants.csv` is the source of truth.

## Stack

| Layer        | Technology                                                                                               |
| ------------ | -------------------------------------------------------------------------------------------------------- |
| Framework    | Next.js 16.2 (App Router, Turbopack-compatible)                                                          |
| UI           | React 19.2, Mantine v8 (`@mantine/core`, `@mantine/hooks`)                                               |
| Language     | TypeScript 5, `strict: true`                                                                             |
| Styling      | Mantine inline props + `postcss-preset-mantine` (`postcss.config.mjs` defines all 5 Mantine breakpoints) |
| Images       | `@vercel/blob` (public storage), `exif-js` for EXIF dates                                                |
| Build extras | React Compiler enabled (`next.config.ts` → `reactCompiler: true`)                                        |
| Deployment   | Vercel (`.vercel/project.json`)                                                                          |
| Tooling      | pnpm (lockfile `pnpm-lock.yaml`), ESLint 9 flat config, Prettier 3, `tsx` for scripts                    |

## Commands

```bash
pnpm dev          # start dev server
pnpm build        # production build
pnpm start        # serve production build
pnpm lint         # eslint (flat config)
pnpm typecheck    # tsc --noEmit
pnpm format       # prettier --write .
pnpm format:check # prettier --check .
pnpm sync:data    # regenerate src/data/plants-data.ts from db/Plants.csv
pnpm upload:img   # pnpm exec tsx scripts/upload-images.ts
```

## Environment variables

| Variable                    | Where                 | Purpose                                                                                                                |
| --------------------------- | --------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_BLOB_BASE_URL` | `.env` / `.env.local` | Vercel Blob base URL for plant photos (built-in fallback in `sync-plants.ts` and `store.ts` loading of generated data) |
| `savia_READ_WRITE_TOKEN`    | `.env.local` only     | Vercel Blob write token for `scripts/upload-images.ts`                                                                 |
| `VERCEL_OIDC_TOKEN`         | `.env.local` only     | Vercel-supplied OIDC token                                                                                             |

## Architecture

### Directory layout

```
db/
├── Plants.csv              # source of truth — hand-edited or via /admin (see "Data flow")
src/
├── app/                    # App Router routes
│   ├── layout.tsx          # Root layout: MantineProvider (defaultColorScheme="auto") + AppShell header
│   ├── page.tsx            # Home — server component (reads generated data module)
│   ├── HomePageClient.tsx  # 'use client' — search/status/sensor filter grid UI
│   ├── ThemeToggle.tsx     # 'use client' — dark/light mode toggle (header)
│   ├── admin/              # DEV-ONLY CRUD UI for db/Plants.csv
│   │   ├── page.tsx            # Server component — reads the CSV fresh from disk
│   │   ├── actions.ts          # 'use server' — createPlant / updatePlant / deletePlant
│   │   ├── AdminPageClient.tsx # 'use client' — table + modals
│   │   └── PlantForm.tsx       # 'use client' — Mantine form (create/edit)
│   └── plant/[id]/
│       ├── page.tsx        # Detail — server component (reads generated data module)
│       ├── PlantDetailPageClient.tsx  # 'use client' — cache wrapper
│       └── PlantDetail.tsx # 'use client' — detail UI (EXIF date, badges, modal)
├── data/
│   ├── plants.ts           # PlantData type (Room/PlantStatus unions)
│   ├── plants-data.ts      # GENERATED — committed PlantData[] from db/Plants.csv
│   ├── store.ts            # getPlants / getPlantById reading plants-data.ts
│   ├── csv.ts              # Server-only: CSV parse/serialize + PlantData mapping
│   ├── plant-form.ts       # Pure form↔CSV-field helpers (safe for client imports)
│   ├── sync.ts             # Server-only: read/write CSV + regenerate plants-data.ts
│   └── cache.ts            # localStorage cache helpers (key: savia_plants_cache)
scripts/
├── sync-plants.ts          # thin CLI wrapper around sync.ts → plants-data.ts
└── upload-images.ts        # uploads ./img/* photos to Vercel Blob under plants/
```

### Page pattern

Every route follows the same three-layer pattern:

1. **Server component** (`page.tsx`) — reads the generated data module synchronously, passes `PlantData[]` (or single plant) + optional `error` to the client wrapper.
2. **Client wrapper** (`XxxPageClient.tsx`) — `'use client'`; on mount, upserts the plants into the localStorage cache, then renders the presentational component.
3. **Presentational client component** — Mantine-based UI.

`params` is awaited (`{ params }: { params: Promise<{ id: string }> }`) per the Next 15+/16 async params convention.

The `/admin` route is the exception: it renders server-side, but all mutations go through server actions (`src/app/admin/actions.ts`) that rewrite `db/Plants.csv` and call `syncFromCsv()` before returning. Client code calls `router.refresh()` after each mutation.

### Data flow

- `db/Plants.csv` is the source of truth, hand-edited or managed through the dev-only `/admin` UI (see below). Format: `ID` column first (stable integer identity), English long-form dates like `"Wednesday, January 20, 2021"` or ISO `2021-01-20`, prices like `"$3,990"`, `Status` values `Viva`/`Débil`/`Muerta`, `Sensor` `TRUE`/`FALSE`.
- `pnpm sync:data` (`scripts/sync-plants.ts`, a thin wrapper around `src/data/sync.ts`) parses the CSV (`src/data/csv.ts` — hand-rolled RFC 4180-ish parser), normalizes each row to `PlantData`, and regenerates the committed module `src/data/plants-data.ts`. Field semantics live in `csv.ts`: location vocabulary mapping (see "Known quirks"), image URL prefixing with `NEXT_PUBLIC_BLOB_BASE_URL` (hardcoded fallback), sensor `=== 'TRUE'`, dates parsed to local-time `new Date(y, m-1, d)`.
- **IDs come from the `ID` column** (stable across reorders/deletes); a missing or non-numeric ID falls back to the CSV row number with a warning. `store.ts` `getPlantById(id)` matches the ID column first, then the row number (legacy links still resolve). Appending rows is always safe; deleting rows no longer breaks URLs.
- **`/admin` (dev only)**: a Mantine CRUD UI backed by server actions (`src/app/admin/actions.ts`) that read/write the CSV and regenerate the data module on every mutation. Writes are blocked when `process.env.VERCEL` is set (serverless filesystem is read-only) — production renders a read-only notice.
- Client-side cache (`src/data/cache.ts`): `localStorage` key `savia_plants_cache`, all helpers wrapped in try/catch (guards SSR/private mode).
- Image base URL comes from `NEXT_PUBLIC_BLOB_BASE_URL` with a hardcoded fallback in `csv.ts` (see `.env.example`); full image URLs are baked into `plants-data.ts` at sync time.

### Image pipeline

1. Phone photos are dropped into `./img/` (or uploaded there from the `/admin` plant form).
2. `pnpm upload:img` (`scripts/upload-images.ts`) re-encodes each image in place with sharp (1600px max width, JPEG quality 82 mozjpeg / WebP 80 / PNG lossless), preserving EXIF (DateTimeOriginal drives the photo date) and baking EXIF orientation into pixels. Then it uploads each file to Vercel Blob at `plants/<filename>` (public access) using `savia_READ_WRITE_TOKEN`, printing the resulting URLs. GIF/SVG are uploaded unchanged.
3. The `Photo` column in `db/Plants.csv` stores the filename; `pnpm sync:data` bakes the full URL into the generated data.

Photos are rendered with `next/image` (grid, detail hero and modal); `next.config.ts` lists the Blob host and `placehold.co` as `images.remotePatterns`. EXIF dates are read client-side in `PlantDetail.tsx` (`DateTimeOriginal` / `CreateDate` / `ModifyDate`) with `img.crossOrigin = 'Anonymous'`.

### Styling & theme

- Mantine `createTheme` in `src/app/layout.tsx`: `primaryColor: 'green'`, `fontFamily: 'Inter, sans-serif'`.
- UI strings are Spanish ("Mi Jardín", "Vivas/Muertas", "Ver Detalles", "Foto tomada el …").
- Styling is done with inline Mantine props; CSS modules exist but are largely unused.

## Known quirks & technical debt

- **Row-based IDs (legacy)**: URLs before the `ID` column encoded the CSV row; `getPlantById` still falls back to row numbers, but new links use the `ID` column, which is stable across reorders and deletions.
- **Mixed languages in data**: `location` values mix English (`'Living Room'`) and Spanish (`'Dormitorio'`, `'Balcón'`, `'Pieza Cony'`); the mapping in `csv.ts` normalizes known synonyms and silently defaults anything unknown to `'Living Room'`. The `/admin` form only writes normalized values.
- **Duplicate rows**: rows 2-3 in `db/Plants.csv` are identical Monstera records (kept on purpose); `sync:data` warns about duplicates.
- **No tests**; README.md is curated (not boilerplate). Lint, typecheck and format checks run in CI (`.github/workflows/ci.yml`).

## Conventions

- Follow the server → client wrapper → presentational component pattern for any new route.
- Path alias `@/*` → `./src/*` for imports.
- Spanish UI strings; keep `lang="es"` in the root layout.
- All `PlantData`-related types live in `src/data/plants.ts`.
- Formatting: Prettier with `semi: true, singleQuote: true, tabWidth: 2, trailingComma: "all", printWidth: 80, arrowParens: "avoid"`.
- No test framework is installed yet; if adding tests, check `ROADMAP.md` first.
- Never commit `.env*`, `.vercel`, or secrets (see `.gitignore`).
