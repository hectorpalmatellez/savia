# ROADMAP.md

Feature proposals for `savia`, grouped by impact/effort. Items in the same group are roughly ordered by value. This is a wishlist, not a commitment — pick up anything that fits the moment. Pending tasks are numbered so they can be executed on demand (e.g. "do task 3"). Delivered work is collected at the end as a record of features and fixes.

## Pending tasks

### Medium (more design, still contained)

1. **Care reminders.** Watering/fertilizing schedules per plant, persisted in the existing localStorage cache, with due-date badges on cards and a "needs attention" strip on the home page. No backend required.
2. **Photo timeline / gallery.** The EXIF parsing already exists in `PlantDetail.tsx`; reuse it for a chronological gallery view (group by capture month, like a journal).
3. **Health history + care events.** Log status changes and care events (watered, repotted, fertilized) per plant in the cache; show a small history on the detail page. This also closes the last open piece of the plant-management initiative (care-event tracking).

### Larger initiatives (need planning or external support)

4. **PWA / offline.** The localStorage cache is a foundation; add a service worker + manifest so the grid works offline. Needs a cache-expiry strategy so stale data doesn't masquerade as fresh.
5. **Test setup.** No test framework installed. Introduce Vitest + React Testing Library for the CSV mapping (`csv.ts`) and cache helpers first, then Playwright for the two routes. Check conventions in AGENTS.md before adding.
6. **Sensor telemetry view.** If the `Sensor` column evolves into real readings, a dashboard with per-plant sensor history would make the detail page richer — scope with the API owner first.

## Delivered — features & fixes

1. **Blob URL env var.** `NEXT_PUBLIC_BLOB_BASE_URL` with built-in fallback; documented in `.env.example`, `README.md`, `AGENTS.md`.
2. **Dead code removal.** `PLANT_DATA`, `page.module.css`, `PlantDetail.module.css`, `globals.css` boilerplate, empty `src/components/` and `src/pages/`.
3. **Sensor filter.** "Todos / Con sensor / Sin sensor" `SegmentedControl` on the grid.
4. **Dark mode toggle.** `ThemeToggle.tsx` in the header (Mantine `useMantineColorScheme`, persisted automatically).
5. **README rewrite.** Project description, setup, env-var table, scripts, image pipeline, architecture summary.
6. **CI checks.** `.github/workflows/ci.yml` runs lint, typecheck and format:check (`pnpm typecheck` script added).
7. **Stable plant identity.** Explicit `ID` column in `db/Plants.csv`; IDs survive reorders/deletes; `getPlantById` falls back to row numbers so legacy links still resolve.
8. **Plant management UI (data).** `/admin` (dev-only) CRUD for `db/Plants.csv` via server actions; production renders a read-only notice.
9. **Admin photo upload.** File picker in the admin plant form uploads the photo via a server action: compressed in place into `./img` (sharp) and published straight to Vercel Blob, then auto-fills the Photo field.
10. **Location normalization.** `csv.ts` maps location synonyms to a single vocabulary (`LOCATION_MAP`), warning and defaulting unknown values to "Living Room".
11. **Image optimization.** `scripts/upload-images.ts` re-encodes photos in place with sharp (1600px cap, quality 82 mozjpeg / 80 webp, PNG lossless) preserving EXIF and baking orientation; `next/image` serves them (grid, detail hero, modal) with remote patterns for Blob and placehold.co.
