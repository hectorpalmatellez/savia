# ROADMAP.md

Feature proposals for `savia`, grouped by impact/effort. Items in the same group are roughly ordered by value. This is a wishlist, not a commitment — pick up anything that fits the moment.

## Quick wins (low effort, immediate value)

- **Move the hardcoded Blob URL to an env var.** `BLOB_BASE_URL` in `src/data/api.ts:7` is baked into the source. Add e.g. `NEXT_PUBLIC_BLOB_BASE_URL` to `.env.example` and fall back to the current value if unset.
- **Remove dead code.** `PLANT_DATA` in `src/data/plants.ts`, `src/app/page.module.css`, `PlantDetail.module.css`, leftover `globals.css` boilerplate, empty `src/components/` and `src/pages/` directories.
- **Enable the sensor filter.** The `.filter(plant => plant.sensor === true)` logic in `HomePageClient.tsx` is commented out; wire it into the existing `SegmentedControl` (e.g. "Todos / Con sensor / Sin sensor").
- **Dark mode toggle.** `ColorSchemeScript` is already in the root layout and Mantine supports it natively; add a `useMantineColorScheme()` toggle in the AppShell header and persist the choice.
- **Replace README.md boilerplate** with a short project description, setup steps, and env-var table (README is still `create-next-app` boilerplate).
- **Add lint + typecheck to CI** (or at least a pre-commit hook) to keep the repo green.

## Medium (more design, still contained)

- **Stable plant identity.** Index-based IDs break URLs if the API reorders records. Options: (a) convince the API to return `ID` again, (b) build a stable slug from `_row` + name, (c) derive a hash of the record. Consider a server-side redirect map from old `/plant/{index}` URLs.
- **Care reminders.** Watering/fertilizing schedules per plant, persisted in the existing localStorage cache, with due-date badges on cards and a "needs attention" strip on the home page. No backend required.
- **Photo timeline / gallery.** The EXIF parsing already exists in `PlantDetail.tsx`; reuse it for a chronological gallery view (group by capture month, like a journal).
- **Image optimization.** `img/` files are ~2.5 MB each from a Galaxy S24 Ultra. Compress on upload in `scripts/upload-images.ts` (sharp) and serve via `next/image` instead of raw `<img>`.
- **Health history.** Log status changes and care events (watered, repotted, fertilized) per plant in the cache; show a small history on the detail page.
- **Data normalization.** Fix the mixed-language `location` values (`'Living Room'` vs `'Dormitorio'`) and the fragile ternary default in `api.ts` — normalize at mapping time to one vocabulary.

## Larger initiatives (need planning or external support)

- **Plant management UI.** Currently read-only: add create/edit/delete forms for plants and photos. Requires write support from the remote API (and rethinking how `Photo` is linked to records).
- **PWA / offline.** The localStorage cache is a foundation; add a service worker + manifest so the grid works offline. Needs a cache-expiry strategy so stale data doesn't masquerade as fresh.
- **Test setup.** No test framework installed. Introduce Vitest + React Testing Library for `api.ts` mapping and cache helpers first, then Playwright for the two routes. Check conventions in AGENTS.md before adding.
- **Sensor telemetry view.** If the `Sensor` column evolves into real readings, a dashboard with per-plant sensor history would make the detail page richer — scope with the API owner first.

## Done / retired ideas

- None yet — this is the first roadmap pass.
